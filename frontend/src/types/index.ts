export type UserStatus = 'pending' | 'active' | 'inactive';

export interface Department {
  id: number;
  name: string;
  code: string;
  manager_id?: number | null;
  manager?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  avatar_url: string | null;
  position: string | null;
  employment_type: 'Full-time' | 'Part-time' | 'Contractor' | 'Intern';
  hire_date: string | null;
  contract_end_date: string | null;
  status: UserStatus;
  department_id?: number | null;
  department: Department | null;
  manager_id?: number | null;
  manager: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    position?: string | null;
  } | null;
  roles: string[];
  permissions: string[];
}

export interface LeaveType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  default_days: number;
  is_paid: boolean;
  requires_attachment: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LeaveRequest {
  id: number;
  user_id: number;
  user?: User;
  leave_type_id: number;
  leave_type?: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: number | null;
  approver?: {
    id: number;
    name: string;
    email: string;
  } | null;
  rejection_reason: string | null;
  attachment_path: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CompanyHoliday {
  id: number;
  name: string;
  date: string;
  is_half_day: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  user?: User | null;
  action: string;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
