import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from '../../../context/LanguageContext';
import { Card, Button, Avatar, Input, Select, DatePicker } from '../../../components/ui';
import { BadgeCheck, Shield, Briefcase, Camera, KeyRound, Save } from 'lucide-react';
import { toast } from 'sonner';

// Profile schema
const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
});

// Password schema
const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'New password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const deptName = typeof user?.department === 'object' ? (user.department as any)?.name : user?.department || 'Unassigned';

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    control: controlProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || user?.name?.split(' ')[0] || '',
      last_name: user?.last_name || user?.name?.split(' ').slice(1).join(' ') || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      birth_date: user?.birth_date || '',
      gender: user?.gender || '',
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  });

  // Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (values: ProfileFormValues) => api.put('/user/profile', values),
    onSuccess: (res) => {
      toast.success('Profile details updated successfully');
      queryClient.setQueryData(['auth-user'], res.data.user);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    },
  });

  // Avatar Upload Mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return api.post('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: (res) => {
      toast.success('Profile avatar updated');
      queryClient.setQueryData(['auth-user'], res.data.user);
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    },
  });

  // Password Change Mutation
  const updatePasswordMutation = useMutation({
    mutationFn: (values: PasswordFormValues) => api.put('/user/password', values),
    onSuccess: () => {
      toast.success('Your password has been updated');
      resetPasswordForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update password');
    },
  });

  if (!user) return null;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{t('prof_title', 'My Account Profile')}</h2>
        <p className="text-xs text-slate-500 mt-1">{t('prof_sub', 'Manage your personal information, profile photo, and password credentials.')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Role Summary */}
        <Card className="flex flex-col items-center text-center p-6">
          <div className="relative group">
            <Avatar name={user.name} src={avatarPreview || user.avatar_url} size="xl" />
            <label className="absolute bottom-0 right-0 p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-md cursor-pointer transition-colors">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
            </label>
          </div>

          {selectedAvatarFile && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                isLoading={uploadAvatarMutation.isPending}
                onClick={() => uploadAvatarMutation.mutate(selectedAvatarFile)}
              >
                {t('btn_save', 'Save Photo')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedAvatarFile(null);
                  setAvatarPreview(null);
                }}
              >
                {t('modal_cancel', 'Cancel')}
              </Button>
            </div>
          )}

          <h3 className="text-base font-bold text-slate-800 mt-4">{user.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{user.position || 'Staff Member'}</p>
          <span className="text-[10px] text-brand-600 font-semibold bg-brand-50 px-2.5 py-0.5 rounded-full mt-2.5 border border-brand-100 uppercase tracking-wider">
            {user.roles[0]}
          </span>

          <div className="w-full border-t border-slate-100 mt-6 pt-5 text-left space-y-3.5">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <BadgeCheck className="w-4 h-4 text-brand-600" />
              <span>{t('prof_employee_id', 'Employee ID')}: <strong className="text-slate-800">{user.employee_number}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>{t('prof_department', 'Department')}: <strong className="text-slate-800">{deptName}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>{t('prof_account_status', 'Account Status')}: <strong className="text-emerald-600 uppercase">{t('emp_active', 'ACTIVE')}</strong></span>
            </div>
          </div>
        </Card>

        {/* Right Column: Profile Form & Password Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <Card title={t('prof_personal_info', 'Personal Information')} subtitle={t('prof_personal_sub', 'Update your contact details and address')}>
            <form onSubmit={handleSubmitProfile((v) => updateProfileMutation.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('lbl_first_name', 'First Name')}
                  {...registerProfile('first_name')}
                  error={profileErrors.first_name?.message}
                />

                <Input
                  label={t('lbl_last_name', 'Last Name')}
                  {...registerProfile('last_name')}
                  error={profileErrors.last_name?.message}
                />

                <Input
                  label={t('lbl_email_address', 'Email Address')}
                  type="email"
                  placeholder="user@example.com"
                  {...registerProfile('email')}
                  error={profileErrors.email?.message}
                />

                <Input
                  label={t('prof_phone', 'Phone Number')}
                  placeholder="+1 (555) 000-0000"
                  {...registerProfile('phone')}
                  error={profileErrors.phone?.message}
                />

                <Controller
                  name="birth_date"
                  control={controlProfile}
                  render={({ field }) => (
                    <DatePicker
                      label={t('lbl_birth_date', 'Birth Date')}
                      value={field.value}
                      onChange={(d) => field.onChange(d)}
                    />
                  )}
                />

                <Controller
                  name="gender"
                  control={controlProfile}
                  render={({ field }) => (
                    <Select
                      label={t('lbl_gender', 'Gender')}
                      options={[
                        { value: '', label: 'Unspecified' },
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                      ]}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />

                <div className="md:col-span-2">
                  <Input
                    label={t('prof_address', 'Address')}
                    placeholder="Street, City, State"
                    {...registerProfile('address')}
                    error={profileErrors.address?.message}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" isLoading={updateProfileMutation.isPending} className="flex items-center gap-1.5">
                  <Save className="w-4 h-4" /> {t('prof_save_btn', 'Save Profile Details')}
                </Button>
              </div>
            </form>
          </Card>

          {/* Change Password Form */}
          <Card title={t('prof_sec_title', 'Security & Password')} subtitle={t('prof_sec_sub', 'Update your account login password')}>
            <form onSubmit={handleSubmitPassword((v) => updatePasswordMutation.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="password"
                  label={t('prof_curr_pass', 'Current Password')}
                  placeholder="••••••••"
                  {...registerPassword('current_password')}
                  error={passwordErrors.current_password?.message}
                />

                <Input
                  type="password"
                  label={t('prof_new_pass', 'New Password')}
                  placeholder="••••••••"
                  {...registerPassword('password')}
                  error={passwordErrors.password?.message}
                />

                <Input
                  type="password"
                  label={t('prof_conf_pass', 'Confirm Password')}
                  placeholder="••••••••"
                  {...registerPassword('password_confirmation')}
                  error={passwordErrors.password_confirmation?.message}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" variant="secondary" isLoading={updatePasswordMutation.isPending} className="flex items-center gap-1.5 text-slate-800">
                  <KeyRound className="w-4 h-4" /> {t('prof_update_pass_btn', 'Update Password')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
