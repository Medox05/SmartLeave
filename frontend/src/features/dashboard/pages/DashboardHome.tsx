import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from '../../../context/LanguageContext';
import {
  Users,
  Building2,
  Calendar,
  Clock,
  Cake,
  TrendingUp,
  Plus,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { Card, Badge, Button, Avatar } from '../../../components/ui';

// ==========================================
// 1. ADMIN DASHBOARD VIEW
// ==========================================
const AdminDashboardView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t('dash_admin_panel', 'Admin Control Panel')}</h2>
          <p className="text-xs text-slate-500 mt-1">{t('dash_admin_sub', 'Global system overview, configuration, and security audits.')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">{t('dash_system_check', 'System Check')}</Button>
          <Button size="sm" className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {t('dash_invite_employee', 'Invite Employee')}
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card hoverable className="border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_total_users', 'Total Users')}</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5">142</h3>
            </div>
            <div className="bg-brand-50 p-2.5 rounded-xl text-brand-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card hoverable className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_departments', 'Departments')}</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5">12</h3>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card hoverable className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_active_logs', 'Active Logs')}</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5">1,208</h3>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card hoverable className="border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_uptime', 'System Uptime')}</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5">99.98%</h3>
            </div>
            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Logs */}
        <Card className="lg:col-span-2" title={t('dash_security_activity', 'System Security Activity')} subtitle={t('dash_security_sub', 'Real-time audits of admin transactions')}>
          <div className="divide-y divide-slate-100">
            {[
              { id: 1, action: 'users.create', desc: 'Admin created profile for EMP-00042', time: '10 minutes ago', ip: '192.168.1.1' },
              { id: 2, action: 'settings.manage', desc: 'Admin updated SMTP mail queue credentials', time: '1 hour ago', ip: '192.168.1.1' },
              { id: 3, action: 'leave.approve', desc: 'System override: Approved Sick Leave request for user #12', time: '3 hours ago', ip: '127.0.0.1' },
            ].map(log => (
              <div key={log.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{log.action}</Badge>
                    <span className="text-xs text-slate-700 font-medium">{log.desc}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">IP: {log.ip}</span>
                </div>
                <span className="text-[10px] text-slate-400">{log.time}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* System Settings Status */}
        <Card title={t('dash_module_config', 'Module Configuration')} subtitle={t('dash_module_sub', 'Verify active services and sync state')}>
          <div className="space-y-4">
            {[
              { name: 'Spatie RBAC Permissions', status: t('dash_enabled', 'Enabled'), type: 'success' },
              { name: 'Sanctum CSRF Cookies', status: t('dash_active', 'Active'), type: 'success' },
              { name: 'Mailpit SMTP Relay', status: t('dash_connected', 'Connected'), type: 'success' },
              { name: 'Redis Queue Worker', status: t('dash_idle', 'Idle'), type: 'warning' },
            ].map((module, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/40 rounded-xl">
                <span className="text-xs font-semibold text-slate-700">{module.name}</span>
                <Badge variant={module.type as any}>{module.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ==========================================
// 2. HR DASHBOARD VIEW
// ==========================================
const HRDashboardView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t('dash_hr_title', 'HR Analytics Center')}</h2>
          <p className="text-xs text-slate-500 mt-1">{t('dash_hr_sub', 'Track employee numbers, contract dates, and annual rosters.')}</p>
        </div>
        <Button size="sm" className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {t('dash_add_emp_btn', 'Add New Employee')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card hoverable className="border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_total_headcount', 'Total Headcount')}</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5">142</h3>
            </div>
            <div className="bg-brand-50 p-2.5 rounded-xl text-brand-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card hoverable className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_fulltime_staff', 'Full-Time Staff')}</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5">118</h3>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card hoverable className="border-l-4 border-l-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_birthdays_today', 'Birthdays Today')}</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5">2</h3>
            </div>
            <div className="bg-pink-50 p-2.5 rounded-xl text-pink-600">
              <Cake className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card hoverable className="border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_leaves_today', 'Leaves Today')}</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5">8</h3>
            </div>
            <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title={t('dash_upcoming_contracts', 'Upcoming Contract End Dates')} subtitle="Reminders to evaluate contract expirations">
          <div className="divide-y divide-slate-100">
            {[
              { id: 1, name: 'Alice Dupont', role: 'Dev Intern', end: 'Aug 31, 2026', type: 'Intern' },
              { id: 2, name: 'Marc Chevalier', role: 'Sales Contractor', end: 'Sep 15, 2026', type: 'Contractor' },
              { id: 3, name: 'Julie Moreau', role: 'HR Assistant', end: 'Dec 31, 2026', type: 'Full-time' },
            ].map(contract => (
              <div key={contract.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <Avatar name={contract.name} size="sm" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{contract.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{contract.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">{contract.type}</Badge>
                  <span className="text-xs font-semibold text-slate-600">{contract.end}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('dash_anniversaries', 'Anniversaries & Birthdays')} subtitle="This month's celebrations">
          <div className="space-y-4">
            {[
              { name: 'Pierre Lemoine', event: 'Birthday', date: 'Jul 24', detail: 'Turns 28' },
              { name: 'Sarah Dubois', event: 'Work Anniversary', date: 'Jul 28', detail: '3 years at SmartLeave' },
            ].map((celebration, i) => (
              <div key={i} className="flex items-start justify-between p-3 bg-slate-50 border border-slate-200/40 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{celebration.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{celebration.detail}</p>
                </div>
                <Badge variant="info">{celebration.date}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ==========================================
// 3. MANAGER DASHBOARD VIEW
// ==========================================
const ManagerDashboardView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t('dash_mgr_title', 'Team Leadership Panel')}</h2>
          <p className="text-xs text-slate-500 mt-1">{t('dash_mgr_sub', 'Approve team absences, coordinate project calendars, and monitor team availability.')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card hoverable className="border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_pending_approvals', 'Pending Approvals')}</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5">3</h3>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card hoverable className="border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_team_absent_week', 'Team Absent This Week')}</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5">2</h3>
            </div>
            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card hoverable className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_team_capacity', 'Team Capacity')}</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1.5">92%</h3>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Approvals */}
        <Card className="lg:col-span-2" title={t('dash_pending_queue', 'Pending Action Queue')} subtitle="Absence requests awaiting your approval decision">
          <div className="space-y-4">
            {[
              { id: 1, name: 'Julien Richard', type: 'Paid Annual Leave', range: 'Jul 27 - Jul 31 (5 days)', reason: 'Summer holiday with family' },
              { id: 2, name: 'Emma Simon', type: 'Sick Leave', range: 'Jul 22 (1 day)', reason: 'Dental appointment' },
            ].map(request => (
              <div key={request.id} className="p-4 bg-slate-50 border border-slate-200/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={request.name} size="sm" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{request.name}</h4>
                    <p className="text-[11px] text-slate-600 mt-1 font-semibold">{request.type}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{request.range}</p>
                    <p className="text-xs text-slate-500 italic mt-1.5">"{request.reason}"</p>
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-center">
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">{t('btn_reject', 'Reject')}</Button>
                  <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500">{t('btn_approve', 'Approve')}</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Team Calendar Sync */}
        <Card title={t('dash_team_calendar', 'Team Availability Calendar')} subtitle="Absence log for this week">
          <div className="space-y-4">
            {[
              { name: 'Julien Richard', status: 'On Holiday', days: 'Mon - Fri', type: 'warning' },
              { name: 'Emma Simon', status: 'Sick Leave', days: 'Wednesday', type: 'danger' },
              { name: 'Corentin Martin', status: 'Present', days: 'Mon - Fri', type: 'success' },
            ].map((employee, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/40 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{employee.name}</h4>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Schedule: {employee.days}</span>
                </div>
                <Badge variant={employee.type as any}>{employee.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ==========================================
// 4. EMPLOYEE DASHBOARD VIEW
// ==========================================
const EmployeeDashboardView: React.FC<{ user: any }> = ({ user }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t('dash_emp_welcome', 'Welcome')}, {user.first_name || user.name}</h2>
          <p className="text-xs text-slate-500 mt-1">{t('dash_emp_sub', 'Here is your personal absence ledger, upcoming holidays, and request status.')}</p>
        </div>
        <Button size="sm" className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {t('btn_request_leave', 'Request Leave')}
        </Button>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card hoverable className="border-l-4 border-l-brand-500 bg-brand-50/10">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_annual_leave', 'Paid Annual Leave')}</p>
          <div className="flex items-baseline gap-1 mt-2">
            <h3 className="text-3xl font-extrabold text-slate-800">18.5</h3>
            <span className="text-xs text-slate-400 font-semibold">/ 25.0 {t('days', 'days')}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-brand-500 h-full rounded-full" style={{ width: '74%' }} />
          </div>
        </Card>

        <Card hoverable className="border-l-4 border-l-emerald-500 bg-emerald-50/10">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_sick_leave', 'Sick Leave')}</p>
          <div className="flex items-baseline gap-1 mt-2">
            <h3 className="text-3xl font-extrabold text-slate-800">9.0</h3>
            <span className="text-xs text-slate-400 font-semibold">/ 10.0 {t('days', 'days')}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '90%' }} />
          </div>
        </Card>

        <Card hoverable className="border-l-4 border-l-purple-500 bg-purple-50/10">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dash_maternity_leave', 'Maternity/Paternity')}</p>
          <div className="flex items-baseline gap-1 mt-2">
            <h3 className="text-3xl font-extrabold text-slate-800">60.0</h3>
            <span className="text-xs text-slate-400 font-semibold">/ 60.0 {t('days', 'days')}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Requests */}
        <Card className="lg:col-span-2" title={t('dash_my_recent_requests', 'My Recent Absence Requests')} subtitle="Monitor the status of your submissions">
          <div className="divide-y divide-slate-100">
            {[
              { id: 1, type: 'Paid Annual Leave', range: 'Aug 10 - Aug 14, 2026', total: '5.0 days', status: 'approved', statusType: 'success' },
              { id: 2, type: 'Paid Annual Leave', range: 'Jul 27 - Jul 28, 2026', total: '2.0 days', status: 'pending', statusType: 'warning' },
              { id: 3, type: 'Sick Leave', range: 'Jun 12, 2026', total: '1.0 day', status: 'approved', statusType: 'success' },
            ].map(req => (
              <div key={req.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-xs font-bold text-slate-800">{req.type}</h4>
                  <p className="text-[10px] text-slate-500">{req.range}</p>
                </div>
                <div className="flex items-center gap-3.5">
                  <span className="text-xs font-semibold text-slate-600">{req.total}</span>
                  <Badge variant={req.statusType as any}>{req.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Holidays */}
        <Card title={t('dash_upcoming_holidays', 'Upcoming Company Holidays')} subtitle="National & corporate closures">
          <div className="space-y-4">
            {[
              { name: 'Assumption of Mary', date: 'August 15, 2026', daysRemaining: '25 days away' },
              { name: 'All Saints\' Day', date: 'November 1, 2026', daysRemaining: '102 days away' },
            ].map((holiday, i) => (
              <div key={i} className="flex items-start justify-between p-3 bg-slate-50 border border-slate-200/40 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{holiday.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{holiday.date}</p>
                </div>
                <span className="text-[10px] text-brand-600 font-semibold">{holiday.daysRemaining}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT SWITCHER
// ==========================================
export const DashboardHome: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Decide view based on role precedence: Admin -> HR -> Manager -> Employee
  if (user.roles.includes('Admin')) {
    return <AdminDashboardView />;
  }
  if (user.roles.includes('HR')) {
    return <HRDashboardView />;
  }
  if (user.roles.includes('Manager')) {
    return <ManagerDashboardView />;
  }
  return <EmployeeDashboardView user={user} />;
};

export default DashboardHome;
