import api from './api';

export interface GetEmployeesParams {
  page?: number;
  per_page?: number;
  search?: string;
  department_id?: number | string;
  employment_type?: string;
  status?: string;
  role?: string;
}

export interface InviteEmployeeData {
  first_name: string;
  last_name: string;
  email: string;
  department_id?: number | null;
  manager_id?: number | null;
  position?: string;
  employment_type: string;
  hire_date?: string | null;
  contract_end_date?: string | null;
  role: string;
}

export const employeeService = {
  getEmployees: async (params?: GetEmployeesParams) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  getManagers: async () => {
    const response = await api.get('/employees/managers');
    return response.data.data;
  },

  getEmployee: async (id: number) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  updateEmployee: async (id: number, data: any) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  uploadAvatar: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post(`/employees/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  toggleStatus: async (id: number, status: 'active' | 'inactive') => {
    const response = await api.patch(`/employees/${id}/status`, { status });
    return response.data;
  },

  setPassword: async (id: number, password: string) => {
    const response = await api.post(`/employees/${id}/set-password`, { password });
    return response.data;
  },

  getInvitationUrl: async (userId: number) => {
    const response = await api.get(`/employees/invitation-url/${userId}`);
    return response.data.invitation_url as string;
  },

  deleteEmployee: async (id: number) => {
    await api.delete(`/employees/${id}`);
  },

  inviteEmployee: async (data: InviteEmployeeData) => {
    const response = await api.post('/employees/invite', data);
    return response.data;
  },
};
