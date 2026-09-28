import React, { useState } from 'react';
import { ShieldCheck, Search, Code2, Activity, FileText } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { Avatar, EmployeeHoverCard } from '../../../components/ui';
import { auditLogService, type AuditLogItem } from '../../../services/auditLogService';
import { useTranslation } from '../../../context/LanguageContext';

import { useQuery } from '@tanstack/react-query';

export const AuditLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedLogPayload, setSelectedLogPayload] = useState<AuditLogItem | null>(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['audit-logs', categoryFilter, submittedSearch],
    queryFn: () =>
      auditLogService.getAuditLogs({
        category: categoryFilter,
        search: submittedSearch,
        per_page: 50,
      }),
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => (query.state.status === 'error' ? false : 5000),
    placeholderData: (previousData) => previousData,
  });

  const isInitialLoading = isPending && !data && !isError;
  const logs: AuditLogItem[] = data?.data || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(search);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'leave':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
      case 'user':
        return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case 'department':
        return 'bg-purple-50 text-purple-700 border-purple-200/60';
      case 'policy':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      case 'security':
      case 'system':
        return 'bg-rose-50 text-rose-700 border-rose-200/60';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatActionTitle = (action: string) => {
    switch (action) {
      case 'user.status_toggled':
        return 'Employee Status Changed';
      case 'user.created':
      case 'user.invited':
        return 'New Employee Invited';
      case 'user.invitation_accepted':
        return 'Employee Activated Account';
      case 'user.updated':
      case 'user.profile_updated':
        return 'Employee Profile Updated';
      case 'user.deleted':
        return 'Employee Account Deleted';
      case 'auth.login':
        return 'User Logged In';
      case 'auth.logout':
        return 'User Logged Out';
      case 'auth.password_changed':
        return 'User Changed Password';
      case 'leave.submitted':
        return 'Submitted Leave Request';
      case 'leave.approved':
        return 'Approved Leave Request';
      case 'leave.rejected':
        return 'Declined Leave Request';
      case 'leave.cancelled':
        return 'Cancelled Leave Request';
      case 'policy.created':
        return 'Created Leave Policy';
      case 'policy.updated':
        return 'Updated Leave Policy';
      case 'policy.deleted':
        return 'Deleted Leave Policy';
      case 'entitlement.updated':
        return 'Adjusted Leave Balance';
      case 'department.created':
        return 'Created Department';
      case 'department.updated':
        return 'Updated Department';
      case 'department.deleted':
        return 'Deleted Department';
      case 'holiday.created':
        return 'Added Company Holiday';
      case 'holiday.deleted':
        return 'Removed Company Holiday';
      case 'settings.updated':
        return 'System Settings Updated';
      default:
        return action.replace(/_/g, ' ').replace(/\./g, ' - ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const getLogDescription = (log: AuditLogItem): string => {
    if (log.description) return log.description;
    const p = log.payload || {};
    switch (log.action) {
      case 'leave.approved':
        return `Approved ${p.leave_type || 'Leave'} request${p.days ? ` (${p.days} days)` : ''}`;
      case 'leave.submitted':
        return `Submitted ${p.leave_type || 'Leave'} application${p.days ? ` (${p.days} days)` : ''}`;
      case 'leave.rejected':
        return `Declined ${p.leave_type || 'Leave'} request${p.rejection_reason ? `: "${p.rejection_reason}"` : ''}`;
      case 'leave.cancelled':
        return `Cancelled ${p.leave_type || 'Leave'} application`;
      case 'user.invited':
        return `Invited team member ${p.name || p.email || ''}${p.role ? ` (${p.role})` : ''}`;
      case 'user.status_toggled':
        return `Changed employee status to ${p.status || 'updated'}`;
      case 'user.password_reset':
        return `Reset password for ${p.target_email || 'user'}`;
      case 'policy.created':
        return `Created policy ${p.policy_name || p.name || ''}`;
      case 'policy.updated':
        return `Updated policy ${p.policy_name || p.name || ''}`;
      case 'policy.deleted':
        return `Deleted policy ${p.policy_name || p.name || ''}`;
      case 'department.created':
        return `Created department ${p.department_name || p.name || ''}`;
      case 'department.updated':
        return `Updated department ${p.department_name || p.name || ''}`;
      case 'department.deleted':
        return `Deleted department ${p.department_name || p.name || ''}`;
      case 'entitlement.updated':
        return `Updated entitlement balance`;
      case 'auth.login':
        return `Logged into the system`;
      case 'auth.logout':
        return `Logged out of the system`;
      default:
        return p.summary || p.description || '';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('audit_title', 'System Audit Logs & Security Trail')}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{t('audit_sub', 'Real-time immutable ledger of administrative transactions, security events, and system changes.')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/80">
          <Activity className="w-4 h-4 text-emerald-600 animate-pulse" /> Audit Engine Live
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('audit_ph_search', 'Search actor name, action, IP address...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSubmittedSearch(e.target.value);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSubmittedSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Select
              options={[
                { value: 'all', label: t('audit_cat_all', 'All Categories') },
                { value: 'leave', label: t('audit_cat_leave', 'Leave Transactions') },
                { value: 'user', label: t('audit_cat_user', 'User & Role Changes') },
                { value: 'department', label: t('audit_cat_department', 'Departments') },
                { value: 'policy', label: t('audit_cat_policy', 'Policies & Settings') },
                { value: 'system', label: t('audit_cat_system', 'System & Security') },
              ]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-48 text-xs"
            />

            {(search || categoryFilter !== 'all') && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSubmittedSearch('');
                  setCategoryFilter('all');
                }}
                className="text-slate-500 hover:text-slate-700 whitespace-nowrap"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Audit Log Table */}
      <Card className="overflow-hidden p-0">
        {isError ? (
          <div className="py-12 text-center text-xs flex flex-col items-center gap-3">
            <p className="font-semibold text-rose-600">
              {(error as any)?.response?.data?.message || 'Unable to load system audit logs.'}
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry Loading Logs
            </Button>
          </div>
        ) : isInitialLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">{t('loading_audit_logs', 'Loading audit log entries...')}</div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 font-semibold text-slate-600">{t('audit_col_actor', 'ACTOR')}</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">{t('audit_col_action', 'ACTION PERFORMED')}</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">{t('audit_col_category', 'CATEGORY')}</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">{t('audit_col_ip', 'IP ADDRESS')}</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">{t('audit_col_time', 'TIMESTAMP')}</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      {log.user ? (
                        <EmployeeHoverCard
                          user={{
                            id: log.user.id,
                            name: log.actor_name || `${log.user.first_name} ${log.user.last_name}`,
                            email: log.user.email,
                            avatar_url: log.user.avatar_url,
                          }}
                        />
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <Avatar name={log.actor_name || 'System'} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-800">{log.actor_name || 'System'}</p>
                            <p className="text-[10px] text-slate-400">System Process</p>
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 text-[12px]">{formatActionTitle(log.action)}</p>
                      {getLogDescription(log) && (
                        <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs">{getLogDescription(log)}</p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${getCategoryBadgeColor(log.category)}`}>
                        {log.category}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>

                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {log.payload && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedLogPayload(log)}
                          className="flex items-center gap-1 ml-auto text-[11px]"
                        >
                          <Code2 className="w-3.5 h-3.5 text-brand-600" /> View Details
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
            <p>{t('empty_audit_logs', 'No audit log entries match your search criteria.')}</p>
            {(search || categoryFilter !== 'all') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSubmittedSearch('');
                  setCategoryFilter('all');
                }}
              >
                Reset Search Filters
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Audit Event Details Modal */}
      {selectedLogPayload && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLogPayload(null)}
          title="Audit Event Details"
        >
          <div className="flex flex-col gap-4 text-xs">
            {/* Header summary badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Performed By</span>
                <p className="font-bold text-slate-800 text-sm">{selectedLogPayload.actor_name || 'System'}</p>
                <p className="text-[11px] text-slate-500">{selectedLogPayload.user?.email || 'Automated System Event'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Date & Time</span>
                <p className="font-semibold text-slate-700">{new Date(selectedLogPayload.created_at).toLocaleString()}</p>
                <span className="text-[10px] font-mono text-slate-500">IP: {selectedLogPayload.ip_address || '127.0.0.1'}</span>
              </div>
            </div>

            {/* Description if present */}
            {selectedLogPayload.description && (
              <div className="p-3 bg-brand-50/70 border border-brand-200/80 rounded-xl text-brand-900 font-medium">
                {selectedLogPayload.description.replace(/\s*00:00:00/g, '').replace(/\(empty\)/g, 'Not Set')}
              </div>
            )}

            {/* Human Readable Details */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Activity className="w-4 h-4 text-brand-600" />
                Action: <span className="font-mono text-brand-700">{selectedLogPayload.action}</span>
              </h4>

              {selectedLogPayload.payload && typeof selectedLogPayload.payload === 'object' && (
                <div className="flex flex-col gap-2 mt-1">
                  {Object.entries(selectedLogPayload.payload).map(([key, val]) => {
                    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

                    if (key === 'changes' && typeof val === 'object' && val !== null) {
                      return (
                        <div key={key} className="flex flex-col gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                            <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-brand-600" /> Modified Fields & Value Comparison
                            </span>
                            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                              {Object.keys(val).filter((k) => k !== 'name').length} Field(s) Changed
                            </span>
                          </div>

                          <div className="space-y-2 mt-1">
                            {Object.entries(val)
                              .filter(([field]) => field !== 'name')
                              .map(([field, diff]: [string, any]) => {
                                const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                                const rawFrom = diff?.from !== undefined ? diff.from : diff?.old;
                                const rawTo = diff?.to !== undefined ? diff.to : diff?.new;

                                const formatDiffVal = (f: string, v: any) => {
                                  if (v === null || v === undefined || v === '' || v === '(empty)' || v === 'Unspecified') {
                                    return <span className="text-slate-400 font-normal italic text-[11px]">Not Provided</span>;
                                  }
                                  const s = String(v);
                                  if (f.includes('date') && s.length >= 10 && !isNaN(new Date(s).getTime())) {
                                    return (
                                      <span className="font-semibold">
                                        {new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    );
                                  }
                                  return <span>{s}</span>;
                                };

                                return (
                                  <div key={field} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
                                    <span className="text-xs font-bold text-slate-800 capitalize flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                                      {fieldLabel}
                                    </span>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                      {/* BEFORE / FROM */}
                                      <div className="flex items-center gap-2 bg-rose-50/80 border border-rose-200/80 p-2 rounded-lg text-rose-900 overflow-hidden">
                                        <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded flex-shrink-0">BEFORE</span>
                                        <div className="truncate text-xs">{formatDiffVal(field, rawFrom)}</div>
                                      </div>

                                      {/* AFTER / TO */}
                                      <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 p-2 rounded-lg text-emerald-900 overflow-hidden">
                                        <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded flex-shrink-0">AFTER</span>
                                        <div className="font-bold text-xs truncate">{formatDiffVal(field, rawTo)}</div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      );
                    }

                    if (Array.isArray(val)) {
                      return (
                        <div key={key} className="flex flex-col gap-1 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="font-bold text-slate-700">{formattedKey}:</span>
                          <div className="flex flex-wrap gap-1.5 mt-0.5">
                            {val.map((item, idx) => (
                              <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium text-slate-800 shadow-2xs">
                                {String(item).replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="flex items-center justify-between p-2 text-slate-600 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="font-medium text-slate-700">{formattedKey}:</span>
                        <span className="font-bold text-slate-900 font-mono text-[11px]">
                          {typeof val === 'boolean' ? (val ? 'Yes / Enabled' : 'No / Disabled') : typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLogPayload(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
