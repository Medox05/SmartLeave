import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService, type ReportSummary } from '../../../services/reportService';
import { leaveService, type LeaveRequest } from '../../../services/leaveService';
import { departmentService } from '../../../services/departmentService';
import { useAuth } from '../../../hooks/useAuth';
import { Card, Badge, Button, Select } from '../../../components/ui';
import { Printer } from 'lucide-react';
import { useTranslation } from '../../../context/LanguageContext';

export const ReportsPage: React.FC = () => {
  const { user, isAdmin, isHR, isManager } = useAuth();
  const { t } = useTranslation();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const isManagerOnly = isManager && !isAdmin && !isHR;
  const deptName = typeof user?.department === 'object' ? (user.department as any)?.name : user?.department || 'Department';

  // Fetch Report Analytics Summary
  const { data: summaryData } = useQuery({
    queryKey: ['reports-summary', selectedYear],
    queryFn: () => reportService.getSummary(selectedYear),
  });

  // Fetch All Filtered Requests for Complete Ledger PDF Export
  const { data: requestsData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['reports-requests-ledger', selectedYear, departmentFilter, typeFilter, statusFilter],
    queryFn: () =>
      leaveService.getLeaveRequests({
        scope: 'all',
        all: true,
        year: selectedYear,
        department_id: departmentFilter || undefined,
        status: statusFilter || undefined,
        leave_type_id: typeFilter ? Number(typeFilter) : undefined,
      }),
  });

  // Fetch Departments for Filter
  const { data: departmentListData } = useQuery({
    queryKey: ['departments-report-filter'],
    queryFn: () => departmentService.getDepartments({ all: true }),
  });

  // Fetch Leave Types for Filter
  const { data: leaveTypesData } = useQuery({
    queryKey: ['leave-types-report-filter'],
    queryFn: () => leaveService.getLeaveTypes(false),
  });

  const summary: ReportSummary | undefined = summaryData;
  const requests: LeaveRequest[] = requestsData?.data || [];
  const departments = departmentListData?.data || [];
  const leaveTypes = leaveTypesData?.data || [];

  const metrics = summary?.metrics || {
    total_days_taken: 0,
    approved_count: 0,
    pending_count: 0,
    rejected_count: 0,
    avg_absence_days: 0,
  };

  const deptBreakdown = summary?.department_breakdown || [];
  const typeBreakdown = summary?.leave_type_breakdown || [];

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 print:p-0 print:gap-4 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t('rep_title', 'HR Reports & Absence Ledger')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('rep_sub', 'Comprehensive breakdown of employee leave consumption and department analytics')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handlePrintPdf} className="flex items-center gap-1.5">
            <Printer className="w-4 h-4" /> {t('btn_print_pdf', 'Print / Export PDF')}
          </Button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block mb-4 border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-extrabold text-slate-900">
          SmartLeave - {isManagerOnly ? `${deptName} Attendance Report` : 'HR Attendance & Leave Summary'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Report Generated for Year: {selectedYear}</p>
      </div>

      {/* Year & Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        <Card className="flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('rep_total_leave_days', 'Total Leave Days Taken')}</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800">{metrics.total_days_taken}</span>
            <span className="text-xs text-slate-500 font-medium">{t('cal_days', 'Days')}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {isManagerOnly ? t('rep_approved_in_dept', 'Approved time-off in your department') : t('rep_approved_across_divs', 'Approved time-off across all divisions')}
          </p>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('rep_approved_apps', 'Approved Applications')}</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-emerald-600">{metrics.approved_count}</span>
            <span className="text-xs text-slate-500 font-medium">{t('rep_requests', 'Requests')}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">{t('rep_avg_duration', 'Avg duration')}: {metrics.avg_absence_days} {t('rep_days_per_req', 'days / request')}</p>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('rep_pending_approvals', 'Pending Approvals')}</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-amber-600">{metrics.pending_count}</span>
            <span className="text-xs text-slate-500 font-medium">{t('rep_requests', 'Requests')}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">{t('rep_awaiting_review', 'Awaiting manager/HR review')}</p>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('rep_target_year', 'Target Analytics Year')}</span>
          <div className="mt-1 print:hidden">
            <Select
              options={[
                { value: '2024', label: '2024' },
                { value: '2025', label: '2025' },
                { value: '2026', label: '2026' },
                { value: '2027', label: '2027' },
              ]}
              value={String(selectedYear)}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            />
          </div>
          <span className="hidden print:block text-3xl font-extrabold text-slate-800 mt-2">{selectedYear}</span>
          <p className="text-[10px] text-slate-400 mt-2">{t('rep_cal_year_sub', 'Calendar year for analytics')}</p>
        </Card>
      </div>

      {/* Visual Analytics Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
        {/* Department Absence Distribution */}
        <Card title={t('rep_dept_absence_breakdown', 'Department Absence Breakdown')} subtitle={`${t('rep_dept_absence_sub', 'Leave days taken per division in')} ${selectedYear}`}>
          <div className="space-y-4 mt-3">
            {deptBreakdown.map((dept) => {
              const maxDays = Math.max(...deptBreakdown.map((d) => d.total_days_taken), 1);
              const pct = Math.min(100, (dept.total_days_taken / maxDays) * 100);

              return (
                <div key={dept.department_id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{dept.name}</span>
                      <Badge variant="default">{dept.code}</Badge>
                    </div>
                    <span className="font-extrabold text-slate-800">{dept.total_days_taken} {t('cal_days', 'Days')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Leave Type Usage */}
        <Card title={t('rep_leave_cat_dist', 'Leave Category Distribution')} subtitle={t('rep_time_off_volume', 'Time off volume by category policy')}>
          <div className="space-y-4 mt-3">
            {typeBreakdown.map((type) => {
              const maxDays = Math.max(...typeBreakdown.map((t) => t.total_days), 1);
              const pct = Math.min(100, (type.total_days / maxDays) * 100);

              return (
                <div key={type.leave_type_id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: type.color || '#4F46E5' }}
                      />
                      <span className="font-bold text-slate-800">{type.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-800">
                      {type.total_days} {t('cal_days', 'Days')} ({type.request_count} {t('rep_requests', 'requests')})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: type.color || '#4F46E5',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Detailed Filterable Ledger Table */}
      <Card title={t('rep_detailed_ledger', 'Detailed Leave Ledger')} subtitle={t('rep_ledger_sub', 'Filterable employee attendance records')}>
        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 print:hidden">
          {!isManagerOnly ? (
            <Select
              placeholder={t('emp_all_depts', 'All Departments')}
              options={[
                { value: '', label: t('emp_all_depts', 'All Departments') },
                ...departments.map((d: any) => ({ value: String(d.id), label: d.name })),
              ]}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            />
          ) : (
            <div className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>{t('th_department', 'Department')}:</span>
              <Badge variant="default">{deptName}</Badge>
            </div>
          )}

          <Select
            placeholder={t('rep_all_leave_types', 'All Leave Types')}
            options={[
              { value: '', label: t('rep_all_leave_types', 'All Leave Types') },
              ...leaveTypes.map((t: any) => ({ value: String(t.id), label: t.name })),
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />

          <Select
            placeholder={t('emp_all_statuses', 'All Statuses')}
            options={[
              { value: '', label: t('emp_all_statuses', 'All Statuses') },
              { value: 'approved', label: t('rep_approved_only', 'Approved Only') },
              { value: 'pending', label: t('rep_pending_only', 'Pending Only') },
              { value: 'rejected', label: t('rep_rejected_only', 'Rejected Only') },
              { value: 'cancelled', label: t('rep_cancelled_only', 'Cancelled Only') },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>

        {/* Ledger Table */}
        {isLoadingRequests ? (
          <div className="py-12 text-center text-xs text-slate-400">{t('loading_ledger', 'Loading ledger records...')}</div>
        ) : requests.length > 0 ? (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 font-semibold text-slate-600">{t('th_employee', 'Employee')}</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">{t('th_department', 'Department')}</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">{t('th_policy', 'Leave Policy')}</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">{t('th_submitted_at', 'Submitted At')}</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">{t('th_dates', 'Dates')}</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">{t('th_days', 'Days')}</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">{t('th_status', 'Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {req.user?.name}
                      {req.user?.employee_number && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {req.user.employee_number}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{req.user?.department || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: req.leave_type?.color || '#4F46E5' }}
                      >
                        {req.leave_type?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {req.submitted_at || (req.created_at ? new Date(req.created_at).toLocaleString() : 'N/A')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {req.start_date} → {req.end_date}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{req.total_days}d</td>
                    <td className="px-4 py-3 capitalize">
                      <span
                        className={`font-semibold ${
                          req.status === 'approved'
                            ? 'text-emerald-600'
                            : req.status === 'pending'
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            {t('empty_ledger_records', 'No ledger records match your filter criteria.')}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;
