import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { departmentService } from '../../../services/departmentService';
import { employeeService } from '../../../services/employeeService';
import { useAuth } from '../../../hooks/useAuth';
import { Card, Badge, Button, Input, Select, Modal, Avatar } from '../../../components/ui';
import { Building2, Plus, Users, Search, Edit3, Trash2, ChevronRight, UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Department, User } from '../../../types';
import { useTranslation } from '../../../context/LanguageContext';

const departmentSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  code: z.string().min(2, 'Code is required').max(10, 'Code max 10 chars').transform((val) => val.toUpperCase()),
  manager_id: z.string().optional().nullable(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export const DepartmentListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

  // Assign Staff Modal State
  const [assigningDepartment, setAssigningDepartment] = useState<Department | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  const canManage = hasPermission('departments.manage');

  // 1. Fetch Departments
  const { data: departmentData, isLoading } = useQuery({
    queryKey: ['departments', search],
    queryFn: () => departmentService.getDepartments({ search }),
    refetchInterval: 5000,
  });

  // 2. Fetch Potential Managers
  const { data: managers = [] } = useQuery({
    queryKey: ['managers-list'],
    queryFn: () => employeeService.getManagers(),
    enabled: isCreateModalOpen || !!editingDepartment,
  });

  // 3. Fetch All Employees for Assign Staff Checklist
  const { data: allEmployeesData } = useQuery({
    queryKey: ['all-employees-assign'],
    queryFn: () => employeeService.getEmployees({ per_page: 100 }),
    enabled: !!assigningDepartment,
  });

  const departments: Department[] = departmentData?.data || [];
  const allEmployees: User[] = allEmployeesData?.data || [];

  // Pre-check staff members currently in the assigning department
  useEffect(() => {
    if (assigningDepartment && allEmployees.length > 0) {
      const currentIds = allEmployees
        .filter((emp) => emp.department?.id === assigningDepartment.id)
        .map((emp) => emp.id);
      setSelectedMemberIds(currentIds);
    }
  }, [assigningDepartment, allEmployeesData]);

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
  });

  const openCreateModal = () => {
    reset({ name: '', code: '', manager_id: '' });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDepartment(dept);
    setValue('name', dept.name);
    setValue('code', dept.code);
    setValue('manager_id', dept.manager_id ? String(dept.manager_id) : '');
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (values: DepartmentFormValues) =>
      departmentService.createDepartment({
        name: values.name,
        code: values.code,
        manager_id: values.manager_id ? Number(values.manager_id) : null,
      }),
    onSuccess: () => {
      toast.success('Department created successfully');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      setIsCreateModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create department');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (values: DepartmentFormValues) =>
      departmentService.updateDepartment(editingDepartment!.id, {
        name: values.name,
        code: values.code,
        manager_id: values.manager_id ? Number(values.manager_id) : null,
      }),
    onSuccess: () => {
      toast.success('Department updated successfully');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      setEditingDepartment(null);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update department');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => departmentService.deleteDepartment(id),
    onSuccess: () => {
      toast.success('Department removed successfully');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      setDeletingDepartment(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete department');
    },
  });

  // Assign Members Mutation
  const assignMembersMutation = useMutation({
    mutationFn: () => departmentService.assignMembers(assigningDepartment!.id, selectedMemberIds),
    onSuccess: () => {
      toast.success('Department staff updated successfully');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setAssigningDepartment(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update department staff');
    },
  });

  const toggleEmployeeSelection = (empId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const onSubmit = (values: DepartmentFormValues) => {
    if (editingDepartment) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const managerOptions = managers.map((m: any) => ({
    value: String(m.id),
    label: `${m.name} (${m.position || 'Manager'})`,
  }));

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t('dept_title', 'Department Directory')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('dept_sub', 'Organize company structure, assign division leads, and view staff distributions.')}
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreateModal} size="sm" className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {t('dept_add_btn', 'Create Department')}
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 border border-slate-200/80 rounded-xl shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('dept_search_placeholder', 'Search department name or code...')}
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {t('lbl_total', 'Total')}: <strong>{departments.length}</strong> {t('lbl_departments', 'departments')}
        </span>
      </div>

      {/* Grid of Department Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : departments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <Card
              key={dept.id}
              hoverable
              className="flex flex-col justify-between relative group"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl flex-shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition-colors">
                        {dept.name}
                      </h3>
                      <Badge variant="default" className="mt-0.5">
                        {dept.code}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  {canManage && (
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setAssigningDepartment(dept)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
                        title="Assign Staff Members"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(dept)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Department"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingDepartment(dept)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Manager Row */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {dept.manager ? (
                      <>
                        <Avatar name={dept.manager.name} src={dept.manager.avatar_url} size="sm" />
                        <div>
                          <p className="text-[11px] font-semibold text-slate-700 leading-tight">
                            {dept.manager.name}
                          </p>
                          <p className="text-[9px] text-slate-400 leading-none mt-0.5">{t('lbl_dept_lead', 'Department Lead')}</p>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">{t('lbl_no_lead_assigned', 'No Lead Assigned')}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dept.users_count ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* View detail footer link */}
              <Link
                to={`/departments/${dept.id}`}
                className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                <span>{t('btn_view_dept_staff', 'View Department Staff')}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-slate-50 rounded-full text-slate-400">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">{t('empty_departments', 'No departments found')}</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Try adjusting your search criteria or create a new department.
            </p>
          </div>
        </Card>
      )}

      {/* Create / Edit Department Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingDepartment}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingDepartment(null);
        }}
        title={editingDepartment ? t('dept_modal_edit_title', 'Edit Department') : t('dept_modal_create_title', 'Create New Department')}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingDepartment(null);
              }}
            >
              {t('modal_cancel', 'Cancel')}
            </Button>
            <Button
              size="sm"
              isLoading={createMutation.isPending || updateMutation.isPending}
              onClick={handleSubmit(onSubmit)}
            >
              {editingDepartment ? t('btn_save', 'Save Changes') : t('dept_add_btn', 'Create Department')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label={t('lbl_dept_name', 'Department Name')}
            placeholder={t('ph_dept_name', 'e.g. Engineering, Product, Human Resources')}
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label={t('lbl_dept_code', 'Department Code (Short Identifier)')}
            placeholder={t('ph_dept_code', 'e.g. ENG, HRD, MKT')}
            error={errors.code?.message}
            {...register('code')}
          />

          <Controller
            name="manager_id"
            control={control}
            render={({ field }) => (
              <Select
                label={t('lbl_dept_manager', 'Department Manager / Lead')}
                options={managerOptions}
                placeholder={t('ph_select_manager', 'Select a manager (Optional)')}
                error={errors.manager_id?.message}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </form>
      </Modal>

      {/* Assign Staff Members Modal */}
      <Modal
        isOpen={!!assigningDepartment}
        onClose={() => setAssigningDepartment(null)}
        title={`Assign Staff to ${assigningDepartment?.name}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAssigningDepartment(null)}>
              {t('modal_cancel', 'Cancel')}
            </Button>
            <Button
              size="sm"
              isLoading={assignMembersMutation.isPending}
              onClick={() => assignMembersMutation.mutate()}
            >
              Save Staff Assignments ({selectedMemberIds.length})
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
          <p className="text-xs text-slate-500 mb-1">
            Check the employees you want to assign to <strong>{assigningDepartment?.name}</strong>:
          </p>

          {allEmployees.map((emp) => {
            const isChecked = selectedMemberIds.includes(emp.id);

            return (
              <div
                key={emp.id}
                onClick={() => toggleEmployeeSelection(emp.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isChecked
                    ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={emp.name} src={emp.avatar_url} size="sm" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{emp.name}</h4>
                    <p className="text-[10px] text-slate-500">{emp.position || 'Staff Member'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {emp.department && (
                    <Badge variant={emp.department.id === assigningDepartment?.id ? 'success' : 'default'}>
                      {emp.department.name}
                    </Badge>
                  )}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingDepartment}
        onClose={() => setDeletingDepartment(null)}
        title="Confirm Department Deletion"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeletingDepartment(null)}>
              {t('modal_cancel', 'Cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => deletingDepartment && deleteMutation.mutate(deletingDepartment.id)}
            >
              Delete Department
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          Are you sure you want to delete the <strong>{deletingDepartment?.name}</strong> department?
          This will soft-delete the department. Employees currently assigned to it will remain intact.
        </p>
      </Modal>
    </div>
  );
};

export default DepartmentListPage;
