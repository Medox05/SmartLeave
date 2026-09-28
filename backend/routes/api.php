<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyHolidayController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\LeaveEntitlementController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SystemHealthController;
use Illuminate\Support\Facades\Route;

// Guest Authentication Routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Invitation Verification & Completion (Signed URLs)
Route::get('/invitation/verify', [InvitationController::class, 'verify'])->name('api.invitation.verify');
Route::post('/invitation/accept', [InvitationController::class, 'accept']);

// Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/user/avatar', [AuthController::class, 'uploadAvatar']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);
    
    // HR & Admin Onboarding Invitation
    Route::post('/employees/invite', [InvitationController::class, 'invite'])
        ->middleware('can:users.create');
    Route::get('/employees/invitation-url/{user}', [InvitationController::class, 'getInvitationUrl']);

    // Departments API
    Route::get('/departments', [DepartmentController::class, 'index']);
    Route::get('/departments/{department}', [DepartmentController::class, 'show']);
    Route::post('/departments', [DepartmentController::class, 'store'])
        ->middleware('can:departments.manage');
    Route::put('/departments/{department}', [DepartmentController::class, 'update'])
        ->middleware('can:departments.manage');
    Route::delete('/departments/{department}', [DepartmentController::class, 'destroy'])
        ->middleware('can:departments.manage');
    Route::post('/departments/{department}/assign-members', [DepartmentController::class, 'assignMembers'])
        ->middleware('can:departments.manage');

    // Employees API
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::get('/employees/managers', [EmployeeController::class, 'managers']);
    Route::get('/employees/{employee}', [EmployeeController::class, 'show']);
    Route::put('/employees/{employee}', [EmployeeController::class, 'update']);
    Route::post('/employees/{employee}/avatar', [EmployeeController::class, 'uploadAvatar']);
    Route::patch('/employees/{employee}/status', [EmployeeController::class, 'toggleStatus']);
    Route::post('/employees/{employee}/set-password', [EmployeeController::class, 'setPassword']);
    Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])
        ->middleware('can:users.delete');

    // Leave Types Policy API
    Route::get('/leave-types', [LeaveTypeController::class, 'index']);
    Route::post('/leave-types', [LeaveTypeController::class, 'store']);
    Route::put('/leave-types/{leaveType}', [LeaveTypeController::class, 'update']);
    Route::delete('/leave-types/{leaveType}', [LeaveTypeController::class, 'destroy']);

    // Leave Entitlements & Balances API
    Route::get('/leave-balances/my', [LeaveEntitlementController::class, 'myBalances']);
    Route::get('/leave-balances/user/{user}', [LeaveEntitlementController::class, 'userBalances']);
    Route::post('/leave-entitlements/adjust', [LeaveEntitlementController::class, 'updateEntitlement']);

    // Leave Requests API
    Route::get('/leave-requests', [LeaveRequestController::class, 'index']);
    Route::get('/leave-requests/calendar', [LeaveRequestController::class, 'calendar']);
    Route::get('/leave-requests/approved-schedule', [LeaveRequestController::class, 'calendar']);
    Route::post('/leave-requests', [LeaveRequestController::class, 'store']);
    Route::post('/leave-requests/calculate-duration', [LeaveRequestController::class, 'calculateDuration']);
    Route::patch('/leave-requests/{leaveRequest}/approve', [LeaveRequestController::class, 'approve']);
    Route::patch('/leave-requests/{leaveRequest}/reject', [LeaveRequestController::class, 'reject']);
    Route::patch('/leave-requests/{leaveRequest}/cancel', [LeaveRequestController::class, 'cancel']);

    // HR Analytics & Reports API
    Route::get('/reports/summary', [ReportController::class, 'summary']);
    Route::get('/reports/export-csv', [ReportController::class, 'exportCsv']);

    // Company Holidays API
    Route::get('/holidays', [CompanyHolidayController::class, 'index']);
    Route::post('/holidays', [CompanyHolidayController::class, 'store']);
    Route::delete('/holidays/{companyHoliday}', [CompanyHolidayController::class, 'destroy']);
    Route::get('/company-holidays', [CompanyHolidayController::class, 'index']);
    Route::post('/company-holidays', [CompanyHolidayController::class, 'store']);
    Route::delete('/company-holidays/{companyHoliday}', [CompanyHolidayController::class, 'destroy']);

    // App Notifications API
    Route::get('/notifications', [\App\Http\Controllers\AppNotificationController::class, 'index']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\AppNotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{notification}/read', [\App\Http\Controllers\AppNotificationController::class, 'markAsRead']);

    // Audit Logs API
    Route::get('/audit-logs', [AuditLogController::class, 'index']);

    // System Settings API
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);

    // System Diagnostics API
    Route::get('/system/health', [SystemHealthController::class, 'check']);
});
