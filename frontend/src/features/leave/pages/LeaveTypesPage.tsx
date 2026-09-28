import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { leaveService, type LeaveType } from '../../../services/leaveService';
import { Card, Badge, Button, Input, Modal } from '../../../components/ui';
import { Plus, Edit3, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../../../context/LanguageContext';

const typeSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(2, 'Code is required').max(10, 'Max 10 chars').transform((v) => v.toUpperCase()),
  description: z.string().optional(),
  default_days: z.number().min(0).max(365),
  is_paid: z.boolean(),
  requires_attachment: z.boolean(),
  color: z.string().min(4, 'Color required'),
  is_active: z.boolean(),
});

type TypeFormValues = z.infer<typeof typeSchema>;

const PRESET_COLORS = ['#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

export const LeaveTypesPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [deletingType, setDeletingType] = useState<LeaveType | null>(null);

  // Fetch Leave Types
  const { data, isLoading } = useQuery({
    queryKey: ['leave-types-admin'],
    queryFn: () => leaveService.getLeaveTypes(false),
  });

  const leaveTypes: LeaveType[] = data?.data || [];

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TypeFormValues>({
    resolver: zodResolver(typeSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      default_days: 25,
      is_paid: true,
      requires_attachment: false,
      color: '#4F46E5',
      is_active: true,
    },
  });

  const watchColor = watch('color');

  const openCreateModal = () => {
    reset({
      name: '',
      code: '',
      description: '',
      default_days: 25,
      is_paid: true,
      requires_attachment: false,
      color: '#4F46E5',
      is_active: true,
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (type: LeaveType) => {
    setEditingType(type);
    setValue('name', type.name);
    setValue('code', type.code);
    setValue('description', type.description || '');
    setValue('default_days', type.default_days);
    setValue('is_paid', type.is_paid);
    setValue('requires_attachment', type.requires_attachment);
    setValue('color', type.color || '#4F46E5');
    setValue('is_active', type.is_active);
  };

  const invalidateAllLeaveQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['leave-types-admin'] });
    queryClient.invalidateQueries({ queryKey: ['leave-types-active'] });
    queryClient.invalidateQueries({ queryKey: ['leave-types'] });
    queryClient.invalidateQueries({ queryKey: ['my-leave-balances'] });
    queryClient.invalidateQueries({ queryKey: ['my-leave-requests'] });
    queryClient.invalidateQueries({ queryKey: ['leave-reports'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (values: TypeFormValues) => leaveService.createLeaveType(values),
    onSuccess: () => {
      toast.success('Leave policy created');
      invalidateAllLeaveQueries();
      setIsCreateModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create leave policy');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (values: TypeFormValues) => leaveService.updateLeaveType(editingType!.id, values),
    onSuccess: () => {
      toast.success('Leave policy updated');
      invalidateAllLeaveQueries();
      setEditingType(null);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update leave policy');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => leaveService.deleteLeaveType(id),
    onSuccess: () => {
      toast.success('Leave policy deleted');
      invalidateAllLeaveQueries();
      setDeletingType(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete policy');
    },
  });

  const onSubmit = (values: TypeFormValues) => {
    if (editingType) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t('pol_title', 'Leave Policies & Types')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('pol_sub', 'Configure company leave entitlement categories, paid rules, and attachment requirements.')}
          </p>
        </div>
        <Button onClick={openCreateModal} size="sm" className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {t('pol_add_btn', 'Add Leave Policy')}
        </Button>
      </div>

      {/* Grid of Leave Types */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">{t('loading_policies', 'Loading leave policies...')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {leaveTypes.map((type) => (
            <Card key={type.id} hoverable className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: type.color || '#4F46E5' }}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{type.name}</h3>
                      <Badge variant="default" className="mt-0.5">
                        {type.code}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(type)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingType(type)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 min-h-[36px]">{type.description || t('lbl_no_description', 'No description provided.')}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    {type.is_paid ? `${type.default_days} ${t('lbl_default_days_year', 'Default Days / Year')}` : t('unpaid_no_limit', 'Unpaid (No Limit)')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        type.is_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {type.is_paid ? t('badge_paid', 'Paid') : t('badge_unpaid', 'Unpaid')}
                    </span>
                    {type.requires_attachment && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                        {t('badge_attachment_req', 'Attachment Req.')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingType}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingType(null);
        }}
        title={editingType ? t('pol_modal_edit_title', 'Edit Leave Policy') : t('pol_modal_create_title', 'Create Leave Policy')}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingType(null);
              }}
            >
              {t('modal_cancel', 'Cancel')}
            </Button>
            <Button
              size="sm"
              isLoading={createMutation.isPending || updateMutation.isPending}
              onClick={handleSubmit(onSubmit)}
            >
              {editingType ? t('btn_save', 'Save Changes') : t('btn_create_policy', 'Create Policy')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label={t('lbl_policy_name', 'Policy Name')} placeholder={t('ph_policy_name', 'e.g. Paid Annual Leave')} error={errors.name?.message} {...register('name')} />

          <div className="grid grid-cols-2 gap-3">
            <Input label={t('lbl_code_identifier', 'Code (Identifier)')} placeholder={t('ph_policy_code', 'e.g. AL, SL, MPL')} error={errors.code?.message} {...register('code')} />
            <Input
              label={watch('is_paid') ? t('lbl_default_days', 'Default Days / Year') : `${t('lbl_default_days', 'Default Days / Year')} (Disabled)`}
              type="number"
              disabled={!watch('is_paid')}
              error={errors.default_days?.message}
              {...register('default_days', { valueAsNumber: true })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">{t('lbl_description', 'Description')}</label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder={t('ph_policy_desc', 'Summary of guidelines for this time off policy...')}
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Color Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">{t('lbl_tag_color', 'Category Tag Color')}</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                    watchColor === c ? 'ring-2 ring-slate-800 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {watchColor === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Switches */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" {...register('is_paid')} className="rounded text-brand-600 focus:ring-brand-500" />
              {t('lbl_is_paid', 'Is Paid Leave')}
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" {...register('requires_attachment')} className="rounded text-brand-600 focus:ring-brand-500" />
              {t('lbl_req_attachment', 'Requires Attachment')}
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingType}
        onClose={() => setDeletingType(null)}
        title="Confirm Policy Deletion"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeletingType(null)}>
              {t('modal_cancel', 'Cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => deletingType && deleteMutation.mutate(deletingType.id)}
            >
              Delete Policy
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete the policy <strong>{deletingType?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
};

export default LeaveTypesPage;
