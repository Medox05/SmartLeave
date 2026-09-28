import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { leaveService, type LeaveBalance, type LeaveRequest } from '../../../services/leaveService';
import { Card, Badge, Button, Select, DatePicker, Modal } from '../../../components/ui';
import { Plus, Clock, CheckCircle2, XCircle, FileText, Upload, Info, Eye, MessageSquare, History, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const requestSchema = z.object({
  leave_type_id: z.string().min(1, 'Please select a leave type'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  half_day_type: z.enum(['none', 'morning', 'afternoon']),
  reason: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

import { useTranslation } from '../../../context/LanguageContext';

export const MyLeavePage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [viewingNoteModal, setViewingNoteModal] = useState<LeaveRequest | null>(null);
  const [cancellingRequest, setCancellingRequest] = useState<LeaveRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [calculatedDuration, setCalculatedDuration] = useState<number | null>(null);

  // 1. Fetch Balances
  const { data: balanceData, isLoading: isLoadingBalances } = useQuery({
    queryKey: ['my-leave-balances'],
    queryFn: () => leaveService.getMyBalances(),
    refetchInterval: 5000,
  });

  // 2. Fetch My Leave Requests
  const { data: requestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['my-leave-requests', statusFilter],
    queryFn: () =>
      leaveService.getLeaveRequests({
        scope: 'mine',
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    refetchInterval: 5000,
  });

  // 3. Fetch Active Leave Types
  const { data: leaveTypesData } = useQuery({
    queryKey: ['leave-types-active'],
    queryFn: () => leaveService.getLeaveTypes(true),
  });

  const balances: LeaveBalance[] = balanceData?.data || [];
  const requests: LeaveRequest[] = requestsData?.data || [];
  const leaveTypes = leaveTypesData?.data || [];

  // Form Setup
  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      leave_type_id: '',
      start_date: '',
      end_date: '',
      half_day_type: 'none',
      reason: '',
    },
  });

  const watchLeaveTypeId = watch('leave_type_id');
  const watchStartDate = watch('start_date');
  const watchEndDate = watch('end_date');
  const watchHalfDayType = watch('half_day_type');

  const selectedLeaveType = leaveTypes.find((t: any) => String(t.id) === watchLeaveTypeId);

  // Calculate live working days duration when dates change
  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      leaveService
        .calculateDuration(watchStartDate, watchEndDate, watchHalfDayType)
        .then((res) => setCalculatedDuration(res.duration))
        .catch(() => setCalculatedDuration(null));
    } else {
      setCalculatedDuration(null);
    }
  }, [watchStartDate, watchEndDate, watchHalfDayType]);

  const invalidateAllLeaveState = () => {
    queryClient.invalidateQueries({ queryKey: ['my-leave-balances'] });
    queryClient.invalidateQueries({ queryKey: ['my-leave-requests'] });
    queryClient.invalidateQueries({ queryKey: ['leave-types-active'] });
    queryClient.invalidateQueries({ queryKey: ['leave-types'] });
    queryClient.invalidateQueries({ queryKey: ['leave-approvals'] });
    queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] });
    queryClient.invalidateQueries({ queryKey: ['leave-reports'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-leaves'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  // Submit Request Mutation
  const submitMutation = useMutation({
    mutationFn: (values: RequestFormValues) => {
      const formData = new FormData();
      formData.append('leave_type_id', values.leave_type_id.toString());
      formData.append('start_date', values.start_date);
      formData.append('end_date', values.end_date);
      formData.append('half_day_type', values.half_day_type || 'none');
      if (values.reason) formData.append('reason', values.reason);
      if (selectedFile) formData.append('attachment', selectedFile);

      return leaveService.submitLeaveRequest(formData);
    },
    onSuccess: () => {
      toast.success('Leave request submitted successfully');
      invalidateAllLeaveState();
      setIsRequestModalOpen(false);
      reset();
      setSelectedFile(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    },
  });

  // Cancel Request Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => leaveService.cancelLeaveRequest(id),
    onSuccess: () => {
      toast.success('Leave request cancelled');
      invalidateAllLeaveState();
      setCancellingRequest(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    },
  });

  const onSubmit = (values: RequestFormValues) => {
    if (selectedLeaveType?.requires_attachment && !selectedFile) {
      toast.error(`An attachment or supporting document is required for ${selectedLeaveType.name}`);
      return;
    }
    submitMutation.mutate(values);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t('status_approved', 'Approved')}</Badge>;
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t('status_pending', 'Pending')}</Badge>;
      case 'rejected':
        return <Badge variant="danger" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> {t('status_rejected', 'Rejected')}</Badge>;
      case 'cancelled':
        return <Badge variant="default" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> {t('status_cancelled', 'Cancelled')}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t('leave_title', 'My Leave Hub')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('leave_sub', 'View your real-time leave entitlement balances and submit time-off requests.')}
          </p>
        </div>
        <Button onClick={() => setIsRequestModalOpen(true)} size="sm" className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {t('btn_request_leave', 'Request Leave')}
        </Button>
      </div>

      {/* Leave Entitlement Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingBalances
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))
          : balances.map((b) => {
              const usedPct = b.allocated_days > 0 ? Math.min(100, (b.used_days / b.allocated_days) * 100) : 0;

              return (
                <Card key={b.leave_type_id} className="flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white"
                      style={{ backgroundColor: b.color || '#4F46E5' }}
                    >
                      {b.leave_type_code}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {b.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>

                  {(() => {
                    const isOverdraft = b.is_paid && b.used_days > b.allocated_days;
                    const overdraftDays = isOverdraft ? Math.round((b.used_days - b.allocated_days) * 10) / 10 : 0;

                    return (
                      <>
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-slate-600 truncate">{b.leave_type_name}</p>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className={`text-2xl font-extrabold ${isOverdraft ? 'text-red-600' : 'text-slate-800'}`}>
                              {b.used_days}
                            </span>
                            {b.is_paid ? (
                              <span className={`text-xs font-medium ${isOverdraft ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                                / {b.allocated_days} {t('days', 'days')} {t('used', 'used')}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-slate-400">
                                {t('days_taken', 'days taken')}
                              </span>
                            )}
                            {isOverdraft && (
                              <span className="text-[10px] font-extrabold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                +{overdraftDays}d {t('overdraft_warning', 'Overdraft')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar & Subtitle */}
                        <div className="mt-3">
                          {b.is_paid && (
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${usedPct}%`,
                                  backgroundColor: isOverdraft ? '#DC2626' : (b.color || '#4F46E5'),
                                }}
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            {b.is_paid ? (
                              <span className={`font-semibold ${isOverdraft ? 'text-red-600 font-extrabold' : 'text-slate-600'}`}>
                                {t('remaining', 'Remaining')}: {b.remaining_days}d
                              </span>
                            ) : (
                              <span className="font-semibold text-slate-500">
                                {t('unpaid_no_limit', 'Unpaid (No Limit)')}
                              </span>
                            )}
                            {b.pending_days > 0 && <span className="text-amber-600 font-semibold">{t('status_pending', 'Pending')}: {b.pending_days}d</span>}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </Card>
              );
            })}
      </div>

      {/* Request History Section */}
      <Card title={t('leave_history_title', 'My Leave History')} subtitle={t('leave_history_sub', 'Chronological ledger of your submitted leave applications')}>
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 pb-4 mb-4 border-b border-slate-100 overflow-x-auto">
          {[
            { id: 'all', label: t('status_all', 'All') },
            { id: 'pending', label: t('status_pending', 'Pending') },
            { id: 'approved', label: t('status_approved', 'Approved') },
            { id: 'rejected', label: t('status_rejected', 'Rejected') },
            { id: 'cancelled', label: t('status_cancelled', 'Cancelled') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-brand-50 text-brand-700 font-bold'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoadingRequests ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading requests...</div>
        ) : requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase">{t('th_policy', 'Leave Type')}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase">{t('th_submitted_at', 'Submitted At')}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase">{t('th_dates', 'Dates')}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase">{t('th_duration', 'Duration')}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase">{t('th_reason', 'Reason')}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase">{t('th_status', 'Status')}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase">{t('th_actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: req.leave_type?.color || '#4F46E5' }}
                        />
                        <span className="font-bold text-slate-800">{req.leave_type?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {req.submitted_at || (req.created_at ? new Date(req.created_at).toLocaleString() : 'N/A')}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      {req.start_date} → {req.end_date}
                      {req.half_day_type !== 'none' && (
                        <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold">
                          {req.half_day_type}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">{req.total_days} {t('days', 'days')}</td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">
                      {req.reason ? `"${req.reason}"` : 'N/A'}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(req.status)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        {(req.reason || req.rejection_reason) && (
                          <button
                            onClick={() => setViewingNoteModal(req)}
                            className="text-xs text-brand-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> {t('btn_read_note', 'Read Note')}
                          </button>
                        )}
                        {req.status === 'pending' && (
                          <button
                            onClick={() => setCancellingRequest(req)}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                          >
                            {t('btn_cancel', 'Cancel Application')}
                          </button>
                        )}
                        {req.attachment_url && (
                          <a
                            href={req.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand-600 hover:underline font-semibold flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" /> {t('btn_view_file', 'View File')}
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No leave requests found for the selected filter.
          </div>
        )}
      </Card>

      {/* Read Full Note Modal */}
      <Modal
        isOpen={!!viewingNoteModal}
        onClose={() => setViewingNoteModal(null)}
        title="Leave Request Note & Details"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setViewingNoteModal(null)}>
            Close Note
          </Button>
        }
      >
        <div className="flex flex-col gap-4 text-xs">
          <div className="pb-3 border-b border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1 w-max">
              <History className="w-3 h-3 text-slate-400" />
              Submitted {viewingNoteModal?.submitted_at || viewingNoteModal?.created_at?.slice(0, 16)} ({viewingNoteModal?.submitted_ago})
            </span>
          </div>

          {viewingNoteModal?.reason && (
            <div className="bg-slate-50 p-3.5 border border-slate-200/80 rounded-xl">
              <span className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-brand-600" /> My Submitted Reason:
              </span>
              <p className="text-slate-600 whitespace-pre-wrap break-words leading-relaxed">
                "{viewingNoteModal.reason}"
              </p>
            </div>
          )}

          {viewingNoteModal?.rejection_reason && (
            <div className="bg-red-50 p-3.5 border border-red-200/80 rounded-xl text-red-900">
              <span className="font-bold text-red-700 block mb-1 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-600" /> Manager / HR Rejection Note:
              </span>
              <p className="whitespace-pre-wrap break-words leading-relaxed">
                {viewingNoteModal.rejection_reason}
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancellingRequest}
        onClose={() => setCancellingRequest(null)}
        title="Confirm Leave Cancellation"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCancellingRequest(null)}>
              Keep Request
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={cancelMutation.isPending}
              onClick={() => cancellingRequest && cancelMutation.mutate(cancellingRequest.id)}
            >
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Are you sure you want to cancel your application for <strong>{cancellingRequest?.leave_type?.name}</strong> ({cancellingRequest?.start_date} → {cancellingRequest?.end_date})?
              Your balance days will be restored once cancelled.
            </p>
          </div>
        </div>
      </Modal>

      {/* New Leave Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title={t('modal_request_leave_title', 'Submit New Leave Request')}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsRequestModalOpen(false)}>
              {t('modal_cancel', 'Cancel')}
            </Button>
            <Button size="sm" isLoading={submitMutation.isPending} onClick={handleSubmit(onSubmit)}>
              {t('btn_submit_app', 'Submit Application')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Controller
            name="leave_type_id"
            control={control}
            render={({ field }) => (
              <Select
                label={t('lbl_leave_type', 'Leave Type')}
                placeholder={t('ph_select_policy', 'Select time off policy...')}
                options={leaveTypes.map((t: any) => ({
                  value: String(t.id),
                  label: `${t.name} (${t.code})`,
                  subtext: `${t.default_days} default days ${t.requires_attachment ? '• Medical note required' : ''}`,
                }))}
                error={errors.leave_type_id?.message}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label={t('lbl_start_date', 'Start Date')}
                  placeholder={t('ph_select_start', 'Select start...')}
                  error={errors.start_date?.message}
                  value={field.value}
                  onChange={(d) => field.onChange(d)}
                />
              )}
            />

            <Controller
              name="end_date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label={t('lbl_end_date', 'End Date')}
                  placeholder={t('ph_select_end', 'Select end...')}
                  error={errors.end_date?.message}
                  value={field.value}
                  onChange={(d) => field.onChange(d)}
                />
              )}
            />
          </div>

          <Controller
            name="half_day_type"
            control={control}
            render={({ field }) => (
              <Select
                label={t('lbl_day_schedule', 'Day Schedule')}
                options={[
                  { value: 'none', label: t('opt_full_days', 'Full Working Days') },
                  { value: 'morning', label: t('opt_morning_half', 'Morning Half-Day (AM)') },
                  { value: 'afternoon', label: t('opt_afternoon_half', 'Afternoon Half-Day (PM)') },
                ]}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          {/* Live Net Working Days Banner */}
          {calculatedDuration !== null && (
            <div className="p-3 bg-brand-50 border border-brand-200/80 rounded-xl flex items-center justify-between text-xs text-brand-800">
              <span className="flex items-center gap-1.5 font-medium">
                <Info className="w-4 h-4 text-brand-600 flex-shrink-0" />
                Calculated Working Duration (Excludes weekends & holidays):
              </span>
              <span className="font-extrabold text-sm text-brand-700">{calculatedDuration} Days</span>
            </div>
          )}

          {/* Document Attachment Upload Field (when policy requires attachment) */}
          {selectedLeaveType?.requires_attachment && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-brand-600" />
                  Medical Certificate / Attachment <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                  Mandatory Policy Requirement
                </span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">PDF, JPG, PNG or DOC (Max 5MB)</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">{t('lbl_reason_notes', 'Reason / Notes (Optional)')}</label>
            <textarea
              {...register('reason')}
              rows={3}
              placeholder={t('ph_reason_notes', 'Provide context or handoff details for your supervisor...')}
              className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyLeavePage;
