import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import LoginPage from './features/auth/pages/LoginPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import InviteSetupPage from './features/auth/pages/InviteSetupPage';

// Feature Pages
import DashboardHome from './features/dashboard/pages/DashboardHome';
import EmployeeListPage from './features/employees/pages/EmployeeListPage';
import EmployeeProfilePage from './features/employees/pages/EmployeeProfilePage';
import DepartmentListPage from './features/departments/pages/DepartmentListPage';
import DepartmentDetailPage from './features/departments/pages/DepartmentDetailPage';

// Sprint 3 & 4 Leave & Reports Pages
import MyLeavePage from './features/leave/pages/MyLeavePage';
import LeaveApprovalsPage from './features/leave/pages/LeaveApprovalsPage';
import LeaveTypesPage from './features/leave/pages/LeaveTypesPage';
import HolidaysCalendarPage from './features/leave/pages/HolidaysCalendarPage';
import ReportsPage from './features/reports/pages/ReportsPage';

import { AuditLogsPage } from './features/audit/pages/AuditLogsPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import ProfilePage from './features/settings/pages/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// Root Redirect component to route based on auth status
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const tokenExists = !!localStorage.getItem('auth_token');

  // If no auth token in storage, redirect to login instantly
  if (!tokenExists) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated user exists, go to dashboard
  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Navigate to="/login" replace />;
};

import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root Route */}
            <Route path="/" element={<RootRedirect />} />

            {/* Guest/Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/setup-password" element={<InviteSetupPage />} />
            </Route>

            {/* Authenticated Dashboard routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardHome />} />

              {/* Employees & Departments */}
              <Route path="/employees" element={<EmployeeListPage />} />
              <Route path="/employees/:id" element={<EmployeeProfilePage />} />
              <Route path="/departments" element={<DepartmentListPage />} />
              <Route path="/departments/:id" element={<DepartmentDetailPage />} />

              {/* Leave & Calendar */}
              <Route path="/leave" element={<MyLeavePage />} />
              <Route path="/leave/approvals" element={<LeaveApprovalsPage />} />
              <Route path="/leave/types" element={<LeaveTypesPage />} />
              <Route path="/calendar" element={<HolidaysCalendarPage />} />
              <Route path="/leaves" element={<Navigate to="/leave" replace />} />

              {/* HR Analytics & Reports */}
              <Route path="/reports" element={<ReportsPage />} />

              {/* System Settings */}
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>

        {/* Toast alerts system */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
      </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
