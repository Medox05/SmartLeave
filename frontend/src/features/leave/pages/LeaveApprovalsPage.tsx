import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService, type LeaveRequest } from '../../../services/leaveService';
import { useAuth } from '../../../hooks/useAuth';
import { Card, Badge, Button, Avatar, Modal } from '../../../components/ui';
import { CheckCircle2, XCircle, Clock, FileText, Calendar, UserCheck, Eye, MessageSquare, History, ShieldAlert, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// Format server ISO timestamp into user's local browser time (YYYY-MM-DD HH:MM)
const formatLocalSubmissionTime = (req: LeaveRequest) => {
  const rawIso = req.created_at;
  if (!rawIso) return req.submitted_at || '';
  const d = new Date(rawIso);
  if (isNaN(d.getTime())) return req.submitted_at || rawIso;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

import { useTranslation } from '../../../context/LanguageContext';

export const LeaveApprovalsPage: React.FC = () => {
  const { user, isAdmin, isHR } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [rejectingRequest, setRejectingRequest] = useState<LeaveRequest | null>(null);
  const [viewingNoteModal, setViewingNoteModal] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const canApprove = isAdmin || isHR;

  // Fetch Requests for Approval (Manager/HR scope)
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['leave-approvals', statusFilter],
    queryFn: () =>
      leaveService.getLeaveRequests({
        scope: 'auto',
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    refetchInterval: 5000,
  });

  const requests: LeaveRequest[] = requestsData?.data || [];

  const [approvingId, setApprovingId] = useState<number | null>(null);

  const invalidateAllApprovalState = () => {
    queryClient.invalidateQueries({ queryKey: ['leave-approvals'] });
    queryClient.invalidateQueries({ queryKey: ['my-leave-balances'] });
    queryClient.invalidateQueries({ queryKey: ['my-leave-requests'] });
    queryClient.invalidateQueries({ queryKey: ['leave-reports'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-leaves'] });
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (id: number) => {
      setApprovingId(id);
      return leaveService.approveLeaveRequest(id);
    },
    onSuccess: () => {
      toast.success('Leave request approved successfully');
      invalidateAllApprovalState();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    },
    onSettled: () => {
      setApprovingId(null);
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: () => leaveService.rejectLeaveRequest(rejectingRequest!.id, rejectionReason),
    onSuccess: () => {
      toast.success('Leave request rejected');
      invalidateAllApprovalState();
      setRejectingRequest(null);
      setRejectionReason('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    },
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  if (!canApprove) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-full">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Access Restricted</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Only HR personnel and System Administrators are authorized to approve or reject employee leave applications.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t('approvals_title', 'Leave Approvals Queue')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('approvals_sub', 'Review, approve, or reject employee leave applications.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="text-xs py-1 px-3">
            <Clock className="w-3.5 h-3.5 mr-1" /> {pendingCount} Pending Review
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3 border border-slate-200/80 rounded-xl shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'pending', label: t('status_pending', 'Pending Approvals') },
            { id: 'approved', label: t('status_approved', 'Approved') },
            { id: 'rejected', label: t('status_rejected', 'Rejected') },
            { id: 'all', label: t('status_all', 'All Requests') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-brand-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {t('lbl_total', 'Total')}: <strong>{requests.length}</strong> {t('lbl_applications', 'applications')}
        </span>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">{t('loading_approvals', 'Loading approval queue...')}</div>
      ) : requests.length > 0 ? (
        <div className="flex flex-col gap-4">
          {requests.map((req) => (
            <Card key={req.id} hoverable className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
              {/* Employee Info & Leave Details */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <Avatar name={req.user?.name || 'Employee'} src={req.user?.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800">{req.user?.name}</h3>
                    {req.user?.department && <Badge variant="default">{req.user.department}</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{req.user?.position || 'Staff Member'}</p>

                  {/* Leave Details Pills & Submission Time */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-md text-white flex items-center gap-1"
                      style={{ backgroundColor: req.leave_type?.color || '#4F46E5' }}
                    >
                      {req.leave_type?.name}
                    </span>
                    <span className="text-xs text-slate-600 font-medium flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {req.start_date} → {req.end_date}
                    </span>
                    <span className="text-xs font-bold text-slate-800 bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md">
                      {t('lbl_working_days_count', 'Working Days')} {req.total_days}
                    </span>
                    {req.is_overdraft && (
                      <span className="text-xs font-extrabold text-red-700 bg-red-100 border border-red-200 px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                        {t('overdraft_warning', 'Overdraft Warning')} (+{req.overdraft_days}d over balance)
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">
                      <History className="w-3 h-3 text-slate-400" />
                      {t('lbl_submitted', 'Submitted')} {formatLocalSubmissionTime(req)} ({req.submitted_ago || 'recently'})
                    </span>
                  </div>

                  {/* Reason & Read Note Button */}
                  {req.reason && (
                    <p className="text-xs text-slate-600 italic mt-2 max-w-xl break-words line-clamp-2">
                      "{req.reason}"
                    </p>
                  )}

                  {req.rejection_reason && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg mt-2 max-w-xl break-words line-clamp-2">
                      <strong>Rejection Note:</strong> {req.rejection_reason}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {(req.reason || req.rejection_reason) && (
                      <button
                        onClick={() => setViewingNoteModal(req)}
                        className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> {t('btn_read_full_note', 'Read Full Note')}
                      </button>
                    )}

                    {req.attachment_url && (
                      <a
                        href={req.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-semibold"
                      >
                        <FileText className="w-3.5 h-3.5" /> Attached Document
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {req.status === 'pending' ? (
                  req.user_id === user?.id && !isAdmin ? (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      Self-Application (Awaiting Admin / HR Review)
                    </span>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setRejectingRequest(req);
                          setRejectionReason('');
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        isLoading={approvingId === req.id}
                        disabled={approvingId !== null}
                        onClick={() => approveMutation.mutate(req.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    </>
                  )
                ) : (
                  <div className="flex items-center gap-2">
                    {req.status === 'approved' && <Badge variant="success">Approved by {req.approver?.name || 'Manager'}</Badge>}
                    {req.status === 'rejected' && <Badge variant="danger">Rejected</Badge>}
                    {req.status === 'cancelled' && <Badge variant="default">Cancelled</Badge>}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-slate-50 rounded-full text-slate-400">
              <UserCheck className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">{t('empty_approval_queue', 'No requests in approval queue')}</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              All leave requests for this status filter have been processed.
            </p>
          </div>
        </Card>
      )}

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
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Avatar name={viewingNoteModal?.user?.name || 'Employee'} src={viewingNoteModal?.user?.avatar_url} size="sm" />
              <div>
                <h4 className="font-bold text-slate-800">{viewingNoteModal?.user?.name}</h4>
                <p className="text-[11px] text-slate-500">{viewingNoteModal?.user?.department} • {viewingNoteModal?.user?.position}</p>
              </div>
            </div>
            {viewingNoteModal && (
              <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                <History className="w-3 h-3 text-slate-400" />
                Submitted {formatLocalSubmissionTime(viewingNoteModal)} ({viewingNoteModal.submitted_ago})
              </span>
            )}
          </div>

          {viewingNoteModal?.reason && (
            <div className="bg-slate-50 p-3.5 border border-slate-200/80 rounded-xl">
              <span className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-brand-600" /> Employee Reason / Notes:
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

      {/* Rejection Modal */}
      <Modal
        isOpen={!!rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        title="Reject Leave Application"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setRejectingRequest(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={rejectMutation.isPending}
              disabled={!rejectionReason.trim()}
              onClick={() => rejectMutation.mutate()}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-600">
            Please provide a reason for rejecting the leave request from{' '}
            <strong>{rejectingRequest?.user?.name}</strong>:
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            placeholder="Explain why this request is being declined..."
            className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </div>
      </Modal>
    </div>
  );
};

export default LeaveApprovalsPage;
