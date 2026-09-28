import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { employeeService } from '../../../services/employeeService';
import { departmentService } from '../../../services/departmentService';
import { useAuth } from '../../../hooks/useAuth';
import { Card, Badge, Avatar, Button, Input, Select, DatePicker } from '../../../components/ui';
import type { User, Department } from '../../../types';
import {
  ArrowLeft,
  User as UserIcon,
  Briefcase,
  Upload,
  Users,
  Mail,
  ShieldCheck,
  Image as ImageIcon,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  department_id: z.string().optional().nullable(),
  manager_id: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  employment_type: z.enum(['Full-time', 'Part-time', 'Contractor', 'Intern']),
  hire_date: z.string().optional().nullable(),
  contract_end_date: z.string().optional().nullable(),
  role: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, hasPermission, isAdmin, isHR } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'personal' | 'job' | 'avatar' | 'subordinates'>('personal');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isSelf = currentUser?.id === Number(id);
  const canSeeContract = isAdmin || isHR || isSelf;
  const canEdit = isSelf || isAdmin || isHR;

  // 1. Fetch Employee Profile
  const { data, isLoading, isError } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.getEmployee(Number(id)),
    enabled: !!id,
  });

  // 2. Fetch Departments & Managers
  const { data: departmentListData } = useQuery({
    queryKey: ['departments-dropdown'],
    queryFn: () => departmentService.getDepartments({ all: true }),
    enabled: canEdit,
  });

  const { data: managers = [] } = useQuery({
    queryKey: ['managers-dropdown'],
    queryFn: () => employeeService.getManagers(),
    enabled: canEdit,
  });

  const employee: User | null = data?.data || null;
  const subordinates: User[] = data?.subordinates || [];
  const departments: Department[] = departmentListData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (employee) {
      reset({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone || '',
        birth_date: employee.birth_date || '',
        gender: employee.gender || '',
        address: employee.address || '',
        department_id: employee.department_id ? String(employee.department_id) : '',
        manager_id: employee.manager_id ? String(employee.manager_id) : '',
        position: employee.position || '',
        employment_type: employee.employment_type || 'Full-time',
        hire_date: employee.hire_date || '',
        contract_end_date: employee.contract_end_date || '',
        role: employee.roles[0] || 'Employee',
      });
    }
  }, [employee, reset]);

  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      employeeService.updateEmployee(Number(id), {
        ...values,
        department_id: values.department_id ? Number(values.department_id) : null,
        manager_id: values.manager_id ? Number(values.manager_id) : null,
      }),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    },
  });

  // Upload Avatar Mutation
  const avatarMutation = useMutation({
    mutationFn: (file: File) => employeeService.uploadAvatar(Number(id), file),
    onSuccess: () => {
      toast.success('Avatar uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = (values: ProfileFormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-6 bg-slate-100 rounded-md w-1/4" />
        <div className="h-44 bg-slate-100 rounded-xl" />
        <div className="h-96 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm font-semibold text-slate-700">Employee profile not found.</p>
        <Link to="/employees" className="mt-4 inline-block text-xs font-semibold text-brand-600 hover:underline">
          Return to Employee Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div>
        <Link
          to="/employees"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Employees
        </Link>
      </div>

      {/* Summary Profile Header Banner */}
      <Card className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-white border border-slate-200/80">
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
          <Avatar name={employee.name} src={previewUrl || employee.avatar_url} size="xl" />
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-xl font-bold text-slate-800">{employee.name}</h2>
              <Badge variant={employee.status === 'active' ? 'success' : 'warning'}>
                {employee.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {employee.position || 'Staff Member'} • {employee.department ? employee.department.name : 'Unassigned'}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 mt-3">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                {employee.employee_number}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {employee.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          <Badge variant="info" className="px-3 py-1 text-xs">
            Role: {employee.roles[0] || 'Employee'}
          </Badge>
        </div>
      </Card>

      {/* Tab Controls Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'personal'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserIcon className="w-4 h-4" /> Personal Information
        </button>

        {canSeeContract && (
          <button
            onClick={() => setActiveTab('job')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'job'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Job & Contract
          </button>
        )}

        {canEdit && (
          <button
            onClick={() => setActiveTab('avatar')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'avatar'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" /> Photo Avatar
          </button>
        )}

        <button
          onClick={() => setActiveTab('subordinates')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'subordinates'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Direct Reports ({subordinates.length})
        </button>
      </div>

      {/* Tab 1: Personal Info */}
      {activeTab === 'personal' && (
        <Card title="Personal Details" subtitle="Contact information and basic profile record">
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="First Name" disabled={!canEdit} error={errors.first_name?.message} {...register('first_name')} />
            <Input label="Last Name" disabled={!canEdit} error={errors.last_name?.message} {...register('last_name')} />
            <Input label="Email Address" type="email" disabled={!canEdit} error={errors.email?.message} {...register('email')} />
            <Input label="Phone Number" disabled={!canEdit} placeholder="+33 6 12 34 56 78" error={errors.phone?.message} {...register('phone')} />
            {canEdit ? (
              <Controller
                name="birth_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Birth Date"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.birth_date?.message}
                  />
                )}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Birth Date</label>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-100 p-2.5 border border-slate-200/80 rounded-xl cursor-not-allowed">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    {employee.birth_date
                      ? new Date(employee.birth_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Unspecified'}
                  </span>
                </div>
              </div>
            )}

            {canEdit ? (
              <Select
                label="Gender"
                options={[
                  { value: '', label: 'Unspecified' },
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
                error={errors.gender?.message}
                {...register('gender')}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Gender</label>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-100 p-2.5 border border-slate-200/80 rounded-xl cursor-not-allowed">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span className="capitalize">{employee.gender || 'Unspecified'}</span>
                </div>
              </div>
            )}
            <div className="md:col-span-2">
              <Input label="Residential Address" disabled={!canEdit} placeholder="Full address" error={errors.address?.message} {...register('address')} />
            </div>

            {canEdit && (
              <div className="md:col-span-2 flex justify-end mt-2">
                <Button size="sm" isLoading={updateMutation.isPending}>
                  Save Personal Info
                </Button>
              </div>
            )}
          </form>
        </Card>
      )}

      {/* Tab 2: Job & Contract Details */}
      {activeTab === 'job' && canSeeContract && (
        <Card title="Job & Contract Specifications" subtitle="Organizational position, department, and employment contract">
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Employee Number" value={employee.employee_number} disabled />
            <Input label="Position Title" disabled={!canEdit} placeholder="e.g. Lead Engineer" error={errors.position?.message} {...register('position')} />

            <Select
              label="Department Division"
              disabled={!canEdit}
              options={[{ value: '', label: 'Unassigned' }, ...departments.map((d) => ({ value: String(d.id), label: d.name }))]}
              error={errors.department_id?.message}
              {...register('department_id')}
            />

            <Select
              label="Direct Manager / Lead"
              disabled={!canEdit}
              options={[{ value: '', label: 'None' }, ...managers.map((m: any) => ({ value: String(m.id), label: m.name }))]}
              error={errors.manager_id?.message}
              {...register('manager_id')}
            />

            <Select
              label="Employment Type"
              disabled={!canEdit}
              options={[
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Contractor', label: 'Contractor' },
                { value: 'Intern', label: 'Intern' },
              ]}
              error={errors.employment_type?.message}
              {...register('employment_type')}
            />

            <Select
              label="System RBAC Role"
              disabled={!hasPermission('users.edit')}
              options={[
                { value: 'Employee', label: 'Employee' },
                { value: 'Manager', label: 'Manager' },
                { value: 'HR', label: 'HR' },
                { value: 'Admin', label: 'Admin' },
              ]}
              error={errors.role?.message}
              {...register('role')}
            />

            <Controller
              name="hire_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Hire Date"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!canEdit}
                  error={errors.hire_date?.message}
                />
              )}
            />

            <Controller
              name="contract_end_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Contract End Date (If applicable)"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!canEdit}
                  error={errors.contract_end_date?.message}
                />
              )}
            />

            {canEdit && (
              <div className="md:col-span-2 flex justify-end mt-2">
                <Button size="sm" isLoading={updateMutation.isPending}>
                  Save Contract Specs
                </Button>
              </div>
            )}
          </form>
        </Card>
      )}

      {/* Tab 3: Avatar Upload */}
      {activeTab === 'avatar' && canEdit && (
        <Card title="Profile Photo Avatar" subtitle="Upload a high-resolution profile picture">
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50/60 border-2 border-dashed border-slate-200 rounded-xl gap-4">
            <Avatar name={employee.name} src={previewUrl || employee.avatar_url} size="xl" />

            <div className="text-center">
              <p className="text-xs font-semibold text-slate-700">Select image file (PNG, JPG, WEBP)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Maximum file size: 4MB</p>
            </div>

            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs hover:bg-slate-50 transition-colors">
                <ImageIcon className="w-4 h-4 text-brand-600" /> Choose File
              </span>
            </label>

            {selectedFile && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-slate-600 font-medium">{selectedFile.name}</span>
                <Button
                  size="sm"
                  isLoading={avatarMutation.isPending}
                  onClick={() => avatarMutation.mutate(selectedFile)}
                >
                  Upload & Save
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tab 4: Direct Reports */}
      {activeTab === 'subordinates' && (
        <Card title="Direct Reports" subtitle={`Employees supervised by ${employee.name}`}>
          <div className="divide-y divide-slate-100">
            {subordinates.length > 0 ? (
              subordinates.map((sub) => (
                <div key={sub.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <Avatar name={sub.name} src={sub.avatar_url} size="sm" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{sub.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sub.position || 'Staff Member'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="default">{sub.employment_type}</Badge>
                    <Link to={`/employees/${sub.id}`} className="text-xs font-semibold text-brand-600 hover:underline">
                      View Profile
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-slate-400">
                No direct reports assigned to this employee.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default EmployeeProfilePage;
