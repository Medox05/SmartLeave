import api from './api';

export interface LeaveType {
  id: number;
  name: string;
  code: string;
  description?: string;
  default_days: number;
  is_paid: boolean;
  requires_attachment: boolean;
  color: string;
  is_active: boolean;
}

export interface LeaveBalance {
  leave_type_id: number;
  leave_type_name: string;
  leave_type_code: string;
  color: string;
  is_paid: boolean;
  requires_attachment: boolean;
  allocated_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
}

export interface LeaveRequest {
  id: number;
  user_id: number;
  user?: {
    id: number;
    employee_number?: string;
    name: string;
    email: string;
    avatar_url?: string;
    department?: string;
    position?: string;
  };
  leave_type_id: number;
  leave_type?: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  half_day_type: 'none' | 'morning' | 'afternoon';
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: number;
  approver?: {
    id: number;
    name: string;
  };
  rejection_reason?: string;
  attachment_url?: string;
  created_at?: string;
  submitted_at?: string;
  submitted_ago?: string;
  is_overdraft?: boolean;
  overdraft_days?: number;
}

export interface GetLeaveRequestsParams {
  page?: number;
  per_page?: number;
  all?: boolean;
  year?: number;
  scope?: 'auto' | 'mine' | 'subordinates' | 'all';
  status?: string;
  leave_type_id?: number;
  department_id?: number | string;
  user_id?: number;
}

export const leaveService = {
  // Leave Types API
  getLeaveTypes: async (activeOnly: boolean = true) => {
    const response = await api.get('/leave-types', { params: { active_only: activeOnly } });
    return response.data;
  },

  createLeaveType: async (data: Partial<LeaveType>) => {
    const response = await api.post('/leave-types', data);
    return response.data;
  },

  updateLeaveType: async (id: number, data: Partial<LeaveType>) => {
    const response = await api.put(`/leave-types/${id}`, data);
    return response.data;
  },

  deleteLeaveType: async (id: number) => {
    await api.delete(`/leave-types/${id}`);
  },

  // Balances & Entitlements API
  getMyBalances: async (year?: number) => {
    const response = await api.get('/leave-balances/my', { params: { year } });
    return response.data;
  },

  getUserBalances: async (userId: number, year?: number) => {
    const response = await api.get(`/leave-balances/user/${userId}`, { params: { year } });
    return response.data;
  },

  adjustEntitlement: async (data: {
    user_id: number;
    leave_type_id: number;
    year: number;
    allocated_days: number;
    carried_over_days?: number;
    manual_adjustment_days?: number;
  }) => {
    const response = await api.post('/leave-entitlements/adjust', data);
    return response.data;
  },

  // Leave Requests API
  getLeaveRequests: async (params?: GetLeaveRequestsParams) => {
    const response = await api.get('/leave-requests', { params });
    return response.data;
  },

  calculateDuration: async (startDate: string, endDate: string, halfDayType: string = 'none') => {
    const response = await api.post('/leave-requests/calculate-duration', {
      start_date: startDate,
      end_date: endDate,
      half_day_type: halfDayType,
    });
    return response.data;
  },

  submitLeaveRequest: async (formData: FormData) => {
    const response = await api.post('/leave-requests', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  approveLeaveRequest: async (id: number) => {
    const response = await api.patch(`/leave-requests/${id}/approve`);
    return response.data;
  },

  rejectLeaveRequest: async (id: number, rejectionReason: string) => {
    const response = await api.patch(`/leave-requests/${id}/reject`, {
      rejection_reason: rejectionReason,
    });
    return response.data;
  },

  cancelLeaveRequest: async (id: number) => {
    const response = await api.patch(`/leave-requests/${id}/cancel`);
    return response.data;
  },
};
