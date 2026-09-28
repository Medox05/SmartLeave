import api from './api';

export interface ReportSummary {
  year: number;
  metrics: {
    total_days_taken: number;
    approved_count: number;
    pending_count: number;
    rejected_count: number;
    avg_absence_days: number;
  };
  department_breakdown: Array<{
    department_id: number;
    name: string;
    code: string;
    staff_count: number;
    total_days_taken: number;
  }>;
  leave_type_breakdown: Array<{
    leave_type_id: number;
    name: string;
    code: string;
    color: string;
    total_days: number;
    request_count: number;
  }>;
}

export interface CompanyHoliday {
  id: number;
  name: string;
  date: string;
  end_date?: string | null;
  is_half_day: boolean;
}

export const reportService = {
  getSummary: async (year?: number) => {
    const response = await api.get('/reports/summary', { params: { year } });
    return response.data;
  },

  downloadCsv: async (params?: { year?: number; department_id?: string; leave_type_id?: string; status?: string }) => {
    const response = await api.get('/reports/export-csv', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smartleave_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getCompanyHolidays: async (year?: number) => {
    const response = await api.get('/company-holidays', { params: { year } });
    return response.data;
  },

  createCompanyHoliday: async (data: { name: string; date: string; end_date?: string; is_half_day?: boolean }) => {
    const response = await api.post('/company-holidays', data);
    return response.data;
  },

  deleteCompanyHoliday: async (id: number) => {
    await api.delete(`/company-holidays/${id}`);
  },
};
