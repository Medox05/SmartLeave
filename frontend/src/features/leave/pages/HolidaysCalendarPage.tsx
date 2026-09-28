import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { Card, Badge, Button, Modal, Input, Select, Avatar, DatePicker } from '../../../components/ui';
import { CalendarDays, Plus, Trash2, Clock, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../../../context/LanguageContext';

export interface CompanyHoliday {
  id: number;
  name: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  is_half_day: boolean;
  half_day_type?: string;
  notes?: string;
}

export interface TeamLeaveSchedule {
  id: number;
  user: {
    id: number;
    name: string;
    avatar_url?: string;
    department?: string;
    position?: string;
  };
  leave_type: {
    name: string;
    color: string;
  };
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
}

const formatDateOnly = (dateStr?: string | null) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  return String(dateStr);
};

export const HolidaysCalendarPage: React.FC = () => {
  const { isAdmin, isHR } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState<CompanyHoliday | null>(null);

  // Form State
  const [holidayName, setHolidayName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState('morning');
  const [notes, setNotes] = useState('');

  const canManage = isAdmin || isHR;

  // Fetch Company Holidays
  const { data: holidays = [], isLoading: isLoadingHolidays } = useQuery<CompanyHoliday[]>({
    queryKey: ['company-holidays', selectedYear],
    queryFn: async () => {
      const res = await api.get('/holidays', { params: { year: selectedYear } });
      return res.data.data || [];
    },
  });

  // Fetch Approved Team Leave Schedule
  const { data: teamRequests = [] } = useQuery<TeamLeaveSchedule[]>({
    queryKey: ['team-approved-leaves', selectedYear],
    queryFn: async () => {
      const res = await api.get('/leave-requests/calendar', { params: { year: selectedYear } });
      return res.data.data || [];
    },
  });

  // Create Holiday Mutation
  const createHolidayMutation = useMutation({
    mutationFn: (newHoliday: any) => api.post('/holidays', newHoliday),
    onSuccess: () => {
      toast.success('Company holiday added successfully');
      queryClient.invalidateQueries({ queryKey: ['company-holidays'] });
      queryClient.invalidateQueries({ queryKey: ['team-approved-leaves'] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create holiday');
    },
  });

  // Delete Holiday Mutation
  const deleteHolidayMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/holidays/${id}`),
    onSuccess: () => {
      toast.success('Company holiday deleted');
      queryClient.invalidateQueries({ queryKey: ['company-holidays'] });
      queryClient.invalidateQueries({ queryKey: ['team-approved-leaves'] });
      setDeletingHoliday(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete holiday');
    },
  });

  const resetForm = () => {
    setHolidayName('');
    setStartDate('');
    setEndDate('');
    setIsHalfDay(false);
    setHalfDayType('morning');
    setNotes('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName || !startDate) {
      toast.error('Please complete all required fields');
      return;
    }
    const finalEndDate = endDate || startDate;
    if (finalEndDate < startDate) {
      toast.error('End date cannot be earlier than start date');
      return;
    }
    createHolidayMutation.mutate({
      name: holidayName,
      start_date: startDate,
      end_date: finalEndDate,
      is_half_day: isHalfDay,
      half_day_type: isHalfDay ? halfDayType : 'none',
      notes,
    });
  };

  // Helper to compute date status (Upcoming, Passed, Future)
  const getHolidayMeta = (h: CompanyHoliday) => {
    const rawStart = h.start_date || h.date || '';
    const rawEnd = h.end_date || rawStart;

    const startDateStr = formatDateOnly(rawStart);
    const endDateStr = formatDateOnly(rawEnd);

    const startObj = new Date(startDateStr);
    const endObj = new Date(endDateStr);
    const nowObj = new Date();
    nowObj.setHours(0, 0, 0, 0);

    let dayCount = 1;
    if (!isNaN(startObj.getTime()) && !isNaN(endObj.getTime())) {
      const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
      dayCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }
    if (h.is_half_day) {
      dayCount = 0.5;
    }

    let diffDaysFromNow = 0;
    if (!isNaN(startObj.getTime())) {
      diffDaysFromNow = Math.ceil((startObj.getTime() - nowObj.getTime()) / (1000 * 3600 * 24));
    }

    let category: 'passed' | 'upcoming_soon' | 'future' = 'future';

    if (!isNaN(endObj.getTime()) && endObj < nowObj) {
      category = 'passed';
    } else if (diffDaysFromNow >= 0 && diffDaysFromNow <= 7) {
      category = 'upcoming_soon';
    } else {
      category = 'future';
    }

    // Color schemes
    let cardClass = 'bg-blue-50/70 border-blue-200/80 text-blue-900';
    let iconClass = 'bg-blue-100 text-blue-700';
    let statusBadge = (
      <Badge variant="default" className="text-[10px]">
        {dayCount} {dayCount === 1 || dayCount === 0.5 ? t('cal_day', 'Day') : t('cal_days', 'Days')}
      </Badge>
    );

    if (category === 'passed') {
      cardClass = 'bg-slate-100/70 border-slate-200 text-slate-500 opacity-75';
      iconClass = 'bg-slate-200 text-slate-600';
      statusBadge = (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
          {t('cal_passed', 'Passed')}
        </span>
      );
    } else if (category === 'upcoming_soon') {
      cardClass = 'bg-emerald-50/90 border-emerald-200 text-emerald-900 shadow-2xs ring-2 ring-emerald-500/20';
      iconClass = 'bg-emerald-100 text-emerald-700';
      statusBadge = (
        <Badge variant="success" className="text-[10px] font-extrabold flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {diffDaysFromNow === 0 ? t('cal_today', 'Today!') : `In ${diffDaysFromNow}d (${dayCount}d)`}
        </Badge>
      );
    }

    const formattedDate = endDateStr && endDateStr !== startDateStr
      ? `${startDateStr} → ${endDateStr}`
      : startDateStr;

    return {
      dayCount,
      category,
      cardClass,
      iconClass,
      statusBadge,
      formattedDate,
    };
  };

  // Sort holidays: Green (Upcoming) FIRST, Blue (Future) SECOND, Gray (Passed) LAST
  const sortedHolidays = [...holidays].sort((a, b) => {
    const metaA = getHolidayMeta(a);
    const metaB = getHolidayMeta(b);

    const priorityMap = {
      upcoming_soon: 1,
      future: 2,
      passed: 3,
    };

    return priorityMap[metaA.category] - priorityMap[metaB.category];
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t('cal_title', 'Company Holidays & Team Schedule')}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('cal_sub', 'Manage official single or multi-day public holidays and view upcoming team leave schedules.')}
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {t('cal_add_btn', 'Add Company Holiday')}
          </Button>
        )}
      </div>

      {/* Legend Bar */}
      <div className="bg-white p-3 border border-slate-200/80 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-700">{t('cal_status_guide', 'Status Color Guide')}:</span>
          <span className="flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> {t('cal_upcoming_week', 'Upcoming (Within 1 Week)')}
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> {t('cal_future_scheduled', 'Future Scheduled (> 1 Week)')}
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" /> {t('cal_passed_holiday', 'Passed Holiday')}
          </span>
        </div>

        <div className="w-36">
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
      </div>

      {/* Grid of Company Holidays */}
      <Card
        title={`${t('cal_official_holidays', 'Official Company Holidays')} (${selectedYear})`}
        subtitle={t('cal_dates_sub', 'Dates automatically excluded from employee leave duration calculations')}
      >
        {isLoadingHolidays ? (
          <div className="py-12 text-center text-xs text-slate-400">{t('loading_holidays', 'Loading company holidays...')}</div>
        ) : sortedHolidays.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-2">
            {sortedHolidays.map((h) => {
              const meta = getHolidayMeta(h);

              return (
                <div
                  key={h.id}
                  className={`p-4 border rounded-xl flex items-center justify-between group transition-all ${meta.cardClass}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${meta.iconClass}`}>
                      <PartyPopper className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold">{h.name}</h4>
                      <p className="text-[11px] font-semibold mt-0.5 flex items-center gap-1 opacity-90">
                        <CalendarDays className="w-3 h-3 opacity-70" />
                        {meta.formattedDate}
                      </p>
                      <span className="text-[10px] font-semibold block mt-0.5 opacity-75">
                        {t('cal_duration', 'Duration')}: {meta.dayCount} {meta.dayCount === 1 || meta.dayCount === 0.5 ? t('cal_day', 'Day') : t('cal_days', 'Days')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {meta.statusBadge}
                    {h.is_half_day && (
                      <Badge variant="warning" className="text-[9px]">
                        Half-Day
                      </Badge>
                    )}
                    {canManage && (
                      <button
                        onClick={() => setDeletingHoliday(h)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer opacity-80 group-hover:opacity-100 mt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 flex justify-center">
            <p className="text-xs text-slate-500 max-w-sm">
              {t('empty_company_holidays', 'No official company holidays configured for')} {selectedYear}.
            </p>
          </div>
        )}
      </Card>

      {/* Team Leave Schedule Overview */}
      <Card title={t('cal_approved_schedule', 'Approved Team Out-of-Office Schedule')} subtitle={t('cal_live_timeline', 'Live team attendance & absence timeline')}>
        {teamRequests.length > 0 ? (
          <div className="space-y-3">
            {teamRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 bg-white border border-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={req.user?.name || 'Employee'} src={req.user?.avatar_url} size="sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800">{req.user?.name}</h4>
                      {req.user?.department && <Badge variant="default">{req.user.department}</Badge>}
                    </div>
                    <p className="text-[11px] text-slate-500">{req.user?.position || 'Staff Member'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: req.leave_type?.color || '#4F46E5' }}
                  >
                    {req.leave_type?.name}
                  </span>
                  <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                    {formatDateOnly(req.start_date)} → {formatDateOnly(req.end_date)} ({req.total_days}d)
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">{t('empty_team_schedule', 'No upcoming team out-of-office dates scheduled.')}</div>
        )}
      </Card>

      {/* Add Holiday Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title={t('modal_add_holiday_title', 'Add Company Holiday')}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
            >
              {t('modal_cancel', 'Cancel')}
            </Button>
            <Button
              size="sm"
              isLoading={createHolidayMutation.isPending}
              onClick={handleCreateSubmit}
            >
              {t('btn_save_holiday', 'Save Holiday')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label={t('lbl_holiday_name', 'Holiday Name')}
            placeholder={t('ph_holiday_name', 'e.g., Independence Day')}
            value={holidayName}
            onChange={(e) => setHolidayName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label={t('lbl_start_date', 'Start Date')}
              placeholder={t('ph_select_start', 'Select start...')}
              value={startDate}
              onChange={(d) => {
                setStartDate(d);
                if (!endDate || endDate < d) {
                  setEndDate(d);
                }
              }}
            />
            <DatePicker
              label={t('lbl_end_date', 'End Date')}
              placeholder={t('ph_select_end', 'Select end...')}
              value={endDate}
              onChange={(d) => setEndDate(d)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isHalfDay"
              checked={isHalfDay}
              onChange={(e) => setIsHalfDay(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <label htmlFor="isHalfDay" className="text-xs font-semibold text-slate-700 cursor-pointer">
              {t('lbl_half_day_holiday', 'Half-Day Holiday')}
            </label>
          </div>

          {isHalfDay && (
            <Select
              label={t('lbl_half_day_period', 'Half-Day Period')}
              options={[
                { value: 'morning', label: t('opt_morning_half', 'Morning Half-Day (AM)') },
                { value: 'afternoon', label: t('opt_afternoon_half', 'Afternoon Half-Day (PM)') },
              ]}
              value={halfDayType}
              onChange={(e) => setHalfDayType(e.target.value)}
            />
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">{t('lbl_notes_desc', 'Notes / Description (Optional)')}</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('ph_notes_desc', 'Internal office closure details...')}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingHoliday}
        onClose={() => setDeletingHoliday(null)}
        title="Confirm Holiday Deletion"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeletingHoliday(null)}>
              {t('modal_cancel', 'Cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteHolidayMutation.isPending}
              onClick={() => deletingHoliday && deleteHolidayMutation.mutate(deletingHoliday.id)}
            >
              Delete Holiday
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Are you sure you want to delete <strong className="text-slate-800">{deletingHoliday?.name}</strong>?
          This action will recalculate pending leave requests that fall across these dates.
        </p>
      </Modal>
    </div>
  );
};

export default HolidaysCalendarPage;
