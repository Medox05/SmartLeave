import React, { useState, useEffect } from 'react';
import { Sliders, Building2, Calendar, ShieldCheck, Mail, Save, CheckCircle, Server, Database, HardDrive, Cpu } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { settingService, type SystemSettingsMap, type SystemHealthResponse } from '../../../services/settingService';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../../context/LanguageContext';
import { timezoneOptions } from '../../../utils/timezones';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'general' | 'working_week' | 'leave_rules' | 'notifications' | 'health'>('general');
  const [settings, setSettings] = useState<SystemSettingsMap>({});
  const [healthData, setHealthData] = useState<SystemHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const settingsRes = await settingService.getSettings();
      setSettings(settingsRes.settings);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }

    try {
      const healthRes = await settingService.getSystemHealth();
      setHealthData(healthRes);
    } catch (err) {
      console.warn('System health check warning:', err);
    }
  };

  const refreshHealthStatus = async () => {
    try {
      const healthRes = await settingService.getSystemHealth();
      setHealthData(healthRes);
    } catch (err) {
      setHealthData((prev) =>
        prev
          ? {
              ...prev,
              services: {
                ...prev.services,
                database: {
                  ...prev.services.database,
                  status: 'disconnected',
                  latency_ms: 0,
                },
              },
            }
          : null
      );
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'health') {
      refreshHealthStatus();
    }
  }, [activeTab]);

  // Real-time automatic background polling every 3s when System Diagnostics tab is active
  useEffect(() => {
    if (activeTab === 'health') {
      const interval = setInterval(() => {
        refreshHealthStatus();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await settingService.updateSettings(settings);
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWorkingDayToggle = (day: string) => {
    const currentDays = (settings.working_days as string[]) || ['mon', 'tue', 'wed', 'thu', 'fri'];
    let updated: string[];
    if (currentDays.includes(day)) {
      updated = currentDays.filter((d) => d !== day);
    } else {
      updated = [...currentDays, day];
    }
    setSettings({ ...settings, working_days: updated });
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('set_title', 'System Settings & Control')}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{t('set_sub', 'Configure global company preferences, working week schedules, overdraft policies, and system diagnostics.')}</p>
          </div>
        </div>

        {activeTab === 'health' ? (
          <Button variant="secondary" onClick={refreshHealthStatus} className="flex items-center gap-2 border-slate-200 hover:border-slate-300">
            <Server className="w-4 h-4 text-brand-600" /> Real-time Refresh Status
          </Button>
        ) : (
          <Button onClick={handleSave} isLoading={isSaving} className="flex items-center gap-2">
            <Save className="w-4 h-4" /> {t('set_save_btn', 'Save Settings Configuration')}
          </Button>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" /> System settings configuration saved successfully!
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'general' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" /> {t('set_tab_general', 'General & Localization')}
        </button>

        <button
          onClick={() => setActiveTab('working_week')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'working_week' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" /> {t('set_tab_working_week', 'Working Week & Hours')}
        </button>

        <button
          onClick={() => setActiveTab('leave_rules')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'leave_rules' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> {t('set_tab_leave_rules', 'Leave Policy Rules')}
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'notifications' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4" /> {t('set_tab_notifications', 'Email & Notifications')}
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'health' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4" /> {t('set_tab_health', 'System Diagnostics')}
        </button>
      </div>

      {isLoading ? (
        <Card className="py-16 text-center text-xs text-slate-400">{t('loading_settings', 'Loading system settings...')}</Card>
      ) : (
        <form onSubmit={handleSave}>
          {/* General Tab */}
          {activeTab === 'general' && (
            <Card title={t('set_tab_general', 'General & Localization')} subtitle="Company identity, timezone, and fiscal calendar details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('set_comp_name', 'Official Company Name')}</label>
                  <input
                    type="text"
                    value={settings.company_name || ''}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('set_timezone', 'System Timezone')}</label>
                  <Select
                    options={timezoneOptions}
                    value={settings.timezone || 'Europe/Paris'}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('set_fiscal_start', 'Fiscal Year Starting Month')}</label>
                  <Select
                    options={[
                      { value: '1', label: 'January (Standard Calendar Year)' },
                      { value: '4', label: 'April (UK / Japan Fiscal)' },
                      { value: '7', label: 'July (Mid-Year Fiscal)' },
                      { value: '10', label: 'October (US Federal Fiscal)' },
                    ]}
                    value={String(settings.fiscal_year_start || '1')}
                    onChange={(e) => setSettings({ ...settings, fiscal_year_start: e.target.value })}
                    className="w-full text-xs"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Working Week Tab */}
          {activeTab === 'working_week' && (
            <Card title={t('set_tab_working_week', 'Working Week & Hours')} subtitle={t('set_working_days_sub', 'Configure active working days for duration calculations')}>
              <div className="flex flex-col gap-6 mt-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">{t('set_working_days', 'Configured Active Working Days')}</label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { code: 'mon', label: t('day_mon', 'Monday') },
                      { code: 'tue', label: t('day_tue', 'Tuesday') },
                      { code: 'wed', label: t('day_wed', 'Wednesday') },
                      { code: 'thu', label: t('day_thu', 'Thursday') },
                      { code: 'fri', label: t('day_fri', 'Friday') },
                      { code: 'sat', label: t('day_sat', 'Saturday') },
                      { code: 'sun', label: t('day_sun', 'Sunday') },
                    ].map((day) => {
                      const isActive = ((settings.working_days as string[]) || ['mon', 'tue', 'wed', 'thu', 'fri']).includes(day.code);
                      return (
                        <button
                          key={day.code}
                          type="button"
                          onClick={() => handleWorkingDayToggle(day.code)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                            isActive
                              ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="max-w-xs">
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('set_hours_day', 'Standard Hours per Working Day')}</label>
                  <input
                    type="number"
                    value={settings.standard_hours_per_day || 8}
                    onChange={(e) => setSettings({ ...settings, standard_hours_per_day: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Leave Policy Rules Tab */}
          {activeTab === 'leave_rules' && (
            <Card title={t('set_tab_leave_rules', 'Leave Policy Rules')} subtitle="Configure overdraft policies and balance limits">
              <div className="flex flex-col gap-6 mt-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{t('set_allow_overdraft', 'Allow Balance Overdraft')}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t('set_allow_overdraft_sub', 'Permit employees to request leaves exceeding allocated annual balance')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allow_overdraft ?? true}
                    onChange={(e) => setSettings({ ...settings, allow_overdraft: e.target.checked })}
                    className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Email & Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card title={t('set_tab_notifications', 'Email & Notifications')} subtitle="Automation triggers and pending approval reminders">
              <div className="flex flex-col gap-6 mt-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{t('set_email_enabled', 'Enable Email Notifications')}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t('set_email_enabled_sub', 'Trigger automated email notifications for submissions and approvals')}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.email_notifications_enabled ?? true}
                    onChange={(e) => setSettings({ ...settings, email_notifications_enabled: e.target.checked })}
                    className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
                  />
                </div>

                <div className="max-w-sm">
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('set_auto_reminder', 'Approval Reminder Frequency (Days)')}</label>
                  <p className="text-[11px] text-slate-500 mb-2">{t('set_auto_reminder_sub', 'Days before reminding managers of unreviewed pending requests')}</p>
                  <input
                    type="number"
                    value={settings.auto_reminder_days || 3}
                    onChange={(e) => setSettings({ ...settings, auto_reminder_days: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* System Health Tab */}
          {activeTab === 'health' && (!healthData ? (
            <div className="py-16 text-center text-xs text-slate-400 font-medium bg-white rounded-2xl border border-slate-200/80 p-8 flex flex-col items-center justify-center gap-3 shadow-xs">
              <Server className="w-6 h-6 text-brand-600 animate-pulse" />
              <span>Fetching live system health diagnostics...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Database */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{t('set_health_db', 'Database Status')}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${
                        healthData.services.database.status === 'healthy'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse'
                      }`}
                    >
                      {healthData.services.database.status === 'healthy' ? 'Connected' : 'Disconnected (MySQL Down)'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 flex flex-col gap-1 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <p><strong>Latency:</strong> <span className="font-mono text-slate-900 font-bold">{healthData.services.database.status === 'healthy' ? `${healthData.services.database.latency_ms} ms` : 'N/A'}</span></p>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Live 2.5s
                    </span>
                  </div>
                  <p><strong>Driver:</strong> {healthData.services.database.connection || 'mysql'}</p>
                </div>
              </Card>

              {/* Storage */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{t('set_health_storage', 'Storage Symlink')}</h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Linked & Writable
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 flex flex-col gap-1 border-t border-slate-100 pt-3">
                  <p><strong>Symlink:</strong> {healthData.services.storage.symlink_linked ? 'OK' : 'Missing'}</p>
                  <p><strong>Disk:</strong> {healthData.services.storage.disk}</p>
                </div>
              </Card>

              {/* Environment */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{t('set_health_env', 'Environment')}</h3>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                      {healthData.services.environment.app_env}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 flex flex-col gap-1 border-t border-slate-100 pt-3">
                  <p><strong>PHP:</strong> v{healthData.services.environment.php_version}</p>
                  <p><strong>Laravel:</strong> v{healthData.services.environment.laravel_version}</p>
                </div>
              </Card>
            </div>
          ))}
        </form>
      )}
    </div>
  );
};
