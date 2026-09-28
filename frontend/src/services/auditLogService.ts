import api from './api';

export interface AuditLogItem {
  id: number;
  user_id: number | null;
  actor_name: string | null;
  action: string;
  category: string;
  description?: string | null;
  ip_address: string | null;
  user_agent: string | null;
  payload: Record<string, any> | null;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface GetAuditLogsParams {
  category?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export interface GetAuditLogsResponse {
  data: AuditLogItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const auditLogService = {
  getAuditLogs: async (params?: GetAuditLogsParams): Promise<GetAuditLogsResponse> => {
    const response = await api.get<GetAuditLogsResponse>('/audit-logs', { params });
    return response.data;
  },
};
