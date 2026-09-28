import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { employeeService } from '../../../services/employeeService';
import { departmentService } from '../../../services/departmentService';
import { useAuth } from '../../../hooks/useAuth';
import { DataTable, Badge, Button, Input, Select, Modal, EmployeeHoverCard, Avatar } from '../../../components/ui';
import type { User, Department } from '../../../types';
import { UserPlus, Eye, UserCheck, UserX, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const inviteSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  department_id: z.string().optional().nullable(),
  manager_id: z.string().optional().nullable(),
  position: z.string().optional(),
  employment_type: z.enum(['Full-time', 'Part-time', 'Contractor', 'Intern']),
  role: z.enum(['Admin', 'HR', 'Manager', 'Employee']),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

import { useTranslation } from '../../../context/LanguageContext';

export const EmployeeListPage: React.FC = () => {
  const { user: currentUser, hasPermission, isAdmin, isHR, isManager } = useAuth();
  const { t, tRole, tType, tStatus } = useTranslation();
  const queryClient = useQueryClient();

  // Filters State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');

  // Modals State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<User | null>(null);

  const canCreate = hasPermission('users.create') || isAdmin || isHR || isManager;
  const canEdit = hasPermission('users.edit');
  const canDelete = hasPermission('users.delete');

  // 1. Fetch Employees
  const { data: employeeData, isLoading } = useQuery({
    queryKey: ['employees', page, search, departmentId, employmentType, status, role],
    queryFn: () =>
      employeeService.getEmployees({
        page,
        per_page: 10,
        search,
        department_id: departmentId,
        employment_type: employmentType,
        status,
        role,
      }),
    refetchInterval: 5000,
  });

  // 2. Fetch Departments for dropdown
  const { data: departmentListData } = useQuery({
    queryKey: ['departments-dropdown'],
    queryFn: () => departmentService.getDepartments({ all: true }),
  });

  // 3. Fetch Managers for dropdown
  const { data: managers = [] } = useQuery({
    queryKey: ['managers-dropdown'],
    queryFn: () => employeeService.getManagers(),
    enabled: isInviteModalOpen,
  });

  const employees: User[] = employeeData?.data || [];
  const meta = employeeData?.meta || {};
  const departments: Department[] = departmentListData?.data || [];

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      department_id: '',
      manager_id: '',
      position: '',
      employment_type: 'Full-time',
      role: 'Employee',
    },
  });

  // Invite Mutation
  const inviteMutation = useMutation({
    mutationFn: (values: InviteFormValues) =>
      employeeService.inviteEmployee({
        ...values,
        department_id: values.department_id ? Number(values.department_id) : null,
        manager_id: values.manager_id ? Number(values.manager_id) : null,
      }),
    onSuccess: (data: any) => {
      toast.success(data.message || 'Employee invited successfully and email sent');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      setIsInviteModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    },
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'inactive' }) =>
      employeeService.toggleStatus(id, status),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      toast.success('Employee account removed successfully');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      setDeletingEmployee(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    },
  });

  const onInviteSubmit = (values: InviteFormValues) => {
    inviteMutation.mutate(values);
  };

  // Table Columns Definition
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: t('emp_col_employee', 'EMPLOYEE'),
      cell: ({ row }) => <EmployeeHoverCard user={row.original} />,
    },
    {
      accessorKey: 'department',
      header: t('emp_col_dept_role', 'ROLE & DEPARTMENT'),
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div>
            <p className="font-medium text-slate-700 text-xs">{emp.position || (emp.roles?.[0] ? tRole(emp.roles[0]) : t('role_staff_member', 'Staff Member'))}</p>
            <p className="text-[11px] text-slate-400">{emp.department?.name || t('status_unassigned', 'Unassigned')}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'manager',
      header: t('emp_col_manager', 'DIRECT MANAGER'),
      cell: ({ row }) => {
        const manager = row.original.manager;
        if (!manager) {
          return <span className="text-[11px] text-slate-400 italic">{t('status_no_manager', 'No Manager')}</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <Avatar name={manager.name} src={manager.avatar_url || undefined} size="sm" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-700">{manager.name}</span>
              <span className="text-[10px] text-slate-400">{manager.position || t('role_manager', 'Manager')}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'employment_type',
      header: t('emp_col_type', 'TYPE'),
      cell: ({ row }) => <Badge variant="default">{tType(row.original.employment_type)}</Badge>,
    },
    {
      accessorKey: 'status',
      header: t('emp_col_status', 'STATUS'),
      cell: ({ row }) => {
        const s = row.original.status;
        const variantMap: Record<string, 'success' | 'warning' | 'danger'> = {
          active: 'success',
          pending: 'warning',
          inactive: 'danger',
        };
        return <Badge variant={variantMap[s] || 'default'}>{tStatus(s)}</Badge>;
      },
    },
    {
      id: 'actions',
      header: t('emp_col_actions', 'ACTIONS'),
      cell: ({ row }) => {
        const emp = row.original;
        const isSelf = currentUser?.id === emp.id;

        return (
          <div className="flex items-center gap-2">
            <Link
              to={`/employees/${emp.id}`}
              className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={t('view_profile', 'View Profile')}
            >
              <Eye className="w-4 h-4" />
            </Link>

            {canEdit && !isSelf && (
              <button
                onClick={() =>
                  toggleStatusMutation.mutate({
                    id: emp.id,
                    status: emp.status === 'active' ? 'inactive' : 'active',
                  })
                }
                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                title={emp.status === 'active' ? t('deactivate_employee', 'Deactivate Employee') : t('activate_employee', 'Activate Employee')}
              >
                {emp.status === 'active' ? (
                  <UserX className="w-4 h-4 text-amber-600" />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                )}
              </button>
            )}

            {canDelete && !isSelf && (
              <button
                onClick={() => setDeletingEmployee(emp)}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title={t('delete_employee', 'Delete Employee')}
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t('emp_title', 'Employee Directory')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('emp_sub', 'Search staff, update roles, manage department assignments, and send onboarding invites.')}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsInviteModalOpen(true)} size="sm" className="flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" /> {t('dash_invite_employee', 'Invite Employee')}
          </Button>
        )}
      </div>

      {/* Filter Dropdowns Bar */}
      <div className="bg-white p-3.5 border border-slate-200/80 rounded-xl shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Select
          options={[
            { value: '', label: t('emp_all_depts', 'All Departments') },
            ...departments.map((d) => ({ value: String(d.id), label: d.name })),
          ]}
          value={departmentId}
          onChange={(e) => {
            setDepartmentId(e.target.value);
            setPage(1);
          }}
        />

        <Select
          options={[
            { value: '', label: t('emp_all_types', 'All Employment Types') },
            { value: 'Full-time', label: tType('Full-time') },
            { value: 'Part-time', label: tType('Part-time') },
            { value: 'Contractor', label: tType('Contractor') },
            { value: 'Intern', label: tType('Intern') },
          ]}
          value={employmentType}
          onChange={(e) => {
            setEmploymentType(e.target.value);
            setPage(1);
          }}
        />

        <Select
          options={[
            { value: '', label: t('emp_all_statuses', 'All Statuses') },
            { value: 'active', label: tStatus('active') },
            { value: 'pending', label: tStatus('pending') },
            { value: 'inactive', label: tStatus('inactive') },
          ]}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        />

        <Select
          options={[
            { value: '', label: t('emp_all_roles', 'All Roles') },
            { value: 'Admin', label: tRole('Admin') },
            { value: 'HR', label: tRole('HR') },
            { value: 'Manager', label: tRole('Manager') },
            { value: 'Employee', label: tRole('Employee') },
          ]}
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        pageCount={meta.last_page || 1}
        pageIndex={page}
        pageSize={meta.per_page || 10}
        totalCount={meta.total}
        onPageChange={(p) => setPage(p)}
        onSearch={(s) => {
          setSearch(s);
          setPage(1);
        }}
        searchPlaceholder={t('emp_search_placeholder', 'Search name, email, employee #...')}
      />

      {/* Invite Employee Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title={t('invite_modal_title', 'Invite New Employee')}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsInviteModalOpen(false)}>
              {t('modal_cancel', 'Cancel')}
            </Button>
            <Button size="sm" isLoading={inviteMutation.isPending} onClick={handleSubmit(onInviteSubmit)}>
              {t('invite_send_btn', 'Send Invitation Link')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onInviteSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('lbl_first_name', 'First Name')} placeholder={t('ph_first_name', 'e.g. Jean')} error={errors.first_name?.message} {...register('first_name')} />
            <Input label={t('lbl_last_name', 'Last Name')} placeholder={t('ph_last_name', 'e.g. Dupont')} error={errors.last_name?.message} {...register('last_name')} />
          </div>

          <Input label={t('lbl_email', 'Email Address')} type="email" placeholder={t('ph_email', 'name@company.com')} error={errors.email?.message} {...register('email')} />

          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="department_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('prof_department', 'Department')}
                  options={[{ value: '', label: t('lbl_none', 'None') }, ...departments.map((d) => ({ value: String(d.id), label: d.name }))]}
                  error={errors.department_id?.message}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />

            <Controller
              name="manager_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('lbl_manager_supervisor', 'Manager / Supervisor')}
                  options={[{ value: '', label: t('lbl_none', 'None') }, ...managers.map((m: any) => ({ value: String(m.id), label: m.name }))]}
                  error={errors.manager_id?.message}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
          </div>

          <Input label={t('lbl_position', 'Position / Job Title')} placeholder={t('ph_position', 'e.g. Senior Frontend Developer')} error={errors.position?.message} {...register('position')} />

          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="employment_type"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('lbl_employment_type', 'Employment Type')}
                  options={[
                    { value: 'Full-time', label: tType('Full-time') },
                    { value: 'Part-time', label: tType('Part-time') },
                    { value: 'Contractor', label: tType('Contractor') },
                    { value: 'Intern', label: tType('Intern') },
                  ]}
                  error={errors.employment_type?.message}
                  value={field.value ?? 'Full-time'}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />

            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  label={t('lbl_system_role', 'System Role')}
                  options={[
                    { value: 'Employee', label: tRole('Employee') },
                    { value: 'Manager', label: tRole('Manager') },
                    { value: 'HR', label: tRole('HR') },
                    { value: 'Admin', label: tRole('Admin') },
                  ]}
                  error={errors.role?.message}
                  value={field.value ?? 'Employee'}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        title={t('confirm_delete_title', 'Confirm Employee Deletion')}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeletingEmployee(null)}>
              {t('modal_cancel', 'Cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => deletingEmployee && deleteMutation.mutate(deletingEmployee.id)}
            >
              {t('btn_delete_account', 'Delete Account')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          {t('confirm_delete_msg', 'Are you sure you want to delete the account for')} <strong>{deletingEmployee?.name}</strong> ({deletingEmployee?.email})? {t('confirm_delete_sub', 'This action will soft-delete their profile record.')}
        </p>
      </Modal>
    </div>
  );
};

export default EmployeeListPage;
