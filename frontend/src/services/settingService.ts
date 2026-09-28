import api from './api';

export interface SystemSettingsMap {
  company_name?: string;
  timezone?: string;
  fiscal_year_start?: number | string;
  working_days?: string[];
  standard_hours_per_day?: number;
  allow_overdraft?: boolean;
  require_medical_attachment_days?: number;
  email_notifications_enabled?: boolean;
  auto_reminder_days?: number;
  [key: string]: any;
}

export interface GetSettingsResponse {
  settings: SystemSettingsMap;
  raw: any[];
}

export interface SystemHealthService {
  status: 'healthy' | 'degraded' | 'critical' | 'disconnected';
  latency_ms?: number;
  connection?: string;
  symlink_linked?: boolean;
  writable?: boolean;
  disk?: string;
}

export interface SystemHealthResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  services: {
    database: SystemHealthService;
    storage: SystemHealthService;
    environment: {
      php_version: string;
      laravel_version: string;
      app_env: string;
      debug_mode: boolean;
    };
  };
}

export const settingService = {
  getSettings: async (): Promise<GetSettingsResponse> => {
    const response = await api.get<GetSettingsResponse>('/settings');
    return response.data;
  },

  updateSettings: async (settings: SystemSettingsMap): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>('/settings', { settings });
    return response.data;
  },

  getSystemHealth: async (): Promise<SystemHealthResponse> => {
    const response = await api.get<SystemHealthResponse>('/system/health');
    return response.data;
  },
};
