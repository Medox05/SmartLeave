import api from './api';

export interface GetDepartmentsParams {
  page?: number;
  per_page?: number;
  search?: string;
  all?: boolean;
}

export const departmentService = {
  getDepartments: async (params?: GetDepartmentsParams) => {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  getDepartment: async (id: number) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  createDepartment: async (data: { name: string; code: string; manager_id?: number | null }) => {
    const response = await api.post('/departments', data);
    return response.data;
  },

  updateDepartment: async (id: number, data: { name: string; code: string; manager_id?: number | null }) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id: number) => {
    await api.delete(`/departments/${id}`);
  },

  assignMembers: async (id: number, userIds: number[]) => {
    const response = await api.post(`/departments/${id}/assign-members`, { user_ids: userIds });
    return response.data;
  },
};
