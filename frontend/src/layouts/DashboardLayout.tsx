import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../context/LanguageContext';
import { languageOptions } from '../i18n/translations';
import { notificationService, type AppNotification } from '../services/notificationService';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarRange,
  BarChart3,
  Settings,
  ShieldCheck,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronDown,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  PartyPopper,
  Check,
  Globe,
} from 'lucide-react';
import { Avatar } from '../components/ui';

export const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout, isAdmin, isHR, isManager } = useAuth();
  const { language, setLanguage, currentLanguageOption, t, tRole, isRtl } = useTranslation();
  const queryClient = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Live Notifications Query (Polls every 5s)
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });

  const notifications: AppNotification[] = notificationsData?.data || [];
  const unreadCount = notificationsData?.unread_count || 0;

  // Mark single notification read
  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all read
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.is_read) {
      markReadMutation.mutate(n.id);
    }
    setIsNotificationsOpen(false);

    if (n.type === 'leave_submitted') {
      if (isAdmin || isHR) {
        navigate('/leave/approvals');
      } else {
        navigate('/leave');
      }
    } else if (['leave_approved', 'leave_rejected', 'leave_cancelled'].includes(n.type)) {
      navigate('/leave');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 font-medium">{t('loading_session', 'Verifying session...')}</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Define navigation links based on roles & translated labels
  const getNavLinks = () => {
    const links = [
      {
        to: '/dashboard',
        label: t('nav_dashboard', 'Dashboard'),
        icon: LayoutDashboard,
        roles: ['Admin', 'HR', 'Manager', 'Employee'],
      },
    ];

    links.push({
      to: '/employees',
      label: t('nav_employees', 'Employees'),
      icon: Users,
      roles: ['Admin', 'HR', 'Manager', 'Employee'],
    });

    if (isAdmin || isHR) {
      links.push({
        to: '/departments',
        label: t('nav_departments', 'Departments'),
        icon: Building2,
        roles: ['Admin', 'HR'],
      });
    }

    links.push({
      to: '/leave',
      label: t('nav_my_leave', 'My Leave Hub'),
      icon: CalendarRange,
      roles: ['Admin', 'HR', 'Manager', 'Employee'],
    });

    if (isAdmin || isHR || isManager) {
      links.push({
        to: '/leave/approvals',
        label: t('nav_approvals', 'Leave Approvals'),
        icon: CheckCircle2,
        roles: ['Admin', 'HR', 'Manager'],
      });
    }

    links.push({
      to: '/calendar',
      label: t('nav_calendar', 'Holidays & Calendar'),
      icon: PartyPopper,
      roles: ['Admin', 'HR', 'Manager', 'Employee'],
    });

    if (isAdmin || isHR) {
      links.push({
        to: '/leave/types',
        label: t('nav_policies', 'Leave Policies'),
        icon: SlidersHorizontal,
        roles: ['Admin', 'HR'],
      });
    }

    if (isAdmin || isHR || isManager) {
      links.push({
        to: '/reports',
        label: t('nav_reports', 'Reports'),
        icon: BarChart3,
        roles: ['Admin', 'HR', 'Manager'],
      });
    }

    if (isAdmin) {
      links.push(
        {
          to: '/audit-logs',
          label: t('nav_audit_logs', 'Audit Logs'),
          icon: ShieldCheck,
          roles: ['Admin'],
        },
        {
          to: '/settings',
          label: t('nav_settings', 'System Settings'),
          icon: Settings,
          roles: ['Admin'],
        }
      );
    }

    return links;
  };

  const navLinks = getNavLinks();

  // Find active link label
  const activeLink = navLinks.find((link) => link.to === location.pathname) || { label: 'SmartLeave' };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave_approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'leave_rejected':
      case 'leave_cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'leave_submitted':
        return <CalendarRange className="w-4 h-4 text-brand-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className={`min-h-screen flex bg-slate-50 print:bg-white print:block ${isRtl ? 'font-sans' : ''}`}>
      {/* Sidebar - Desktop */}
      <aside
        className={`fixed top-0 bottom-0 z-40 bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between print:hidden ${
          isRtl ? 'right-0 border-l border-r-0' : 'left-0 border-r'
        } ${isSidebarOpen ? 'w-72' : 'w-20'} hidden md:flex`}
      >
        <div>
          {/* Sidebar Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
            <div className="bg-brand-600 p-2 rounded-xl text-white shadow-md flex-shrink-0">
              <CalendarRange className="w-5 h-5" />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-white tracking-tight animate-in fade-in duration-300">
                SmartLeave
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/10'
                      : 'hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isSidebarOpen && (
                    <span className="whitespace-nowrap animate-in fade-in duration-300">{link.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs sm:text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">{t('nav_sign_out', 'Sign Out')}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <div className={`md:hidden fixed inset-0 z-50 flex print:hidden ${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        <aside
          className={`relative bg-slate-900 text-slate-300 w-72 h-full flex flex-col justify-between p-4 shadow-xl transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2.5">
                <div className="bg-brand-600 p-1.5 rounded-lg text-white">
                  <CalendarRange className="w-5 h-5" />
                </div>
                <span className="font-bold text-white">SmartLeave</span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      isActive ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="whitespace-nowrap">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs sm:text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">{t('nav_sign_out', 'Sign Out')}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main Body */}
      <div
        className={`flex-1 min-h-screen flex flex-col transition-all duration-300 print:p-0 print:m-0 print:w-full ${
          isSidebarOpen
            ? isRtl ? 'md:pr-72' : 'md:pl-72'
            : isRtl ? 'md:pr-20' : 'md:pl-20'
        }`}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-slate-800 select-none hidden sm:block">
              {activeLink.label}
            </h1>
          </div>

          {/* Quick Actions & Profile */}
          <div className="flex items-center gap-3.5">
            {/* Multi-Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
              >
                <span className="text-sm">{currentLanguageOption.flag}</span>
                <span className="hidden sm:inline">{currentLanguageOption.name}</span>
                <Globe className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isLangOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-100 rounded-xl shadow-xl z-50 p-1 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {languageOptions.map((opt) => (
                      <button
                        key={opt.code}
                        onClick={() => {
                          setLanguage(opt.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                          language === opt.code
                            ? 'bg-brand-50 text-brand-700 font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{opt.flag}</span>
                          <span>{opt.name}</span>
                        </div>
                        {language === opt.code && <Check className="w-3.5 h-3.5 text-brand-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Live Notifications Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-50 relative cursor-pointer transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] font-extrabold bg-rose-500 text-white rounded-full ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-84 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{t('notifications_title', 'Live Notifications')}</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded-full">
                            {unreadCount} New
                          </span>
                        )}
                      </div>

                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllReadMutation.mutate()}
                          className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold cursor-pointer flex items-center gap-1 hover:underline"
                        >
                          <Check className="w-3 h-3" /> {t('btn_mark_all_read', 'Mark all read')}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5 max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors cursor-pointer border ${
                              n.is_read
                                ? 'bg-white border-transparent hover:bg-slate-50'
                                : 'bg-brand-50/50 border-brand-100/80 hover:bg-brand-50'
                            }`}
                          >
                            <div className="p-2 rounded-lg bg-white shadow-2xs border border-slate-100 mt-0.5 flex-shrink-0">
                              {getNotificationIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-slate-800 truncate">{n.title}</p>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 leading-normal mt-0.5 break-words">
                                {n.message}
                              </p>
                              <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                                {n.created_ago || 'Recently'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-400">
                          {t('notifications_empty', 'No notifications yet.')}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 hover:bg-slate-50 p-1.5 rounded-xl transition-all cursor-pointer"
              >
                <Avatar name={user.name} src={user.avatar_url} size="sm" />
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 leading-none mt-0.5">{tRole(user.roles[0])}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800">{user.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{user.email}</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <UserIcon className="w-4 h-4" />
                        {t('nav_profile', 'My Profile')}
                      </Link>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav_sign_out', 'Sign Out')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-in fade-in duration-300 print:p-0 print:max-w-none print:w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
