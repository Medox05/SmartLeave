<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Department;
use App\Models\LeaveType;
use App\Models\CompanyHoliday;
use App\Models\LeaveRequest;
use App\Models\LeaveEntitlement;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Permissions
        $permissions = [
            'users.create',
            'users.edit',
            'users.delete',
            'departments.manage',
            'leave.approve',
            'leave.reject',
            'reports.view',
            'settings.manage',
        ];

        foreach ($permissions as $permissionName) {
            Permission::findOrCreate($permissionName);
        }

        // 2. Create Roles and Assign Permissions
        $adminRole = Role::findOrCreate('Admin');
        $adminRole->givePermissionTo(Permission::all());

        $hrRole = Role::findOrCreate('HR');
        $hrRole->givePermissionTo([
            'users.create',
            'users.edit',
            'users.delete',
            'departments.manage',
            'leave.approve',
            'leave.reject',
            'reports.view',
        ]);

        $managerRole = Role::findOrCreate('Manager');
        $managerRole->givePermissionTo([
            'users.create',
            'leave.approve',
            'leave.reject',
            'reports.view',
        ]);

        $employeeRole = Role::findOrCreate('Employee');

        // 3. Create Core Departments
        $eng = Department::create(['name' => 'Engineering', 'code' => 'ENG']);
        $hrd = Department::create(['name' => 'Human Resources', 'code' => 'HRD']);
        $mkt = Department::create(['name' => 'Marketing', 'code' => 'MKT']);
        $sls = Department::create(['name' => 'Sales', 'code' => 'SLS']);
        $fin = Department::create(['name' => 'Finance', 'code' => 'FIN']);
        $ops = Department::create(['name' => 'Operations', 'code' => 'OPS']);

        // 4. Create Default Leave Types
        $al = LeaveType::create([
            'name' => 'Paid Annual Leave',
            'code' => 'AL',
            'description' => 'Standard paid vacation and personal time off.',
            'default_days' => 25,
            'is_paid' => true,
            'requires_attachment' => false,
            'color' => '#4F46E5', // Indigo
            'is_active' => true,
        ]);

        $sl = LeaveType::create([
            'name' => 'Sick Leave',
            'code' => 'SL',
            'description' => 'Medical absence requiring doctor note.',
            'default_days' => 10,
            'is_paid' => true,
            'requires_attachment' => true,
            'color' => '#EF4444', // Red
            'is_active' => true,
        ]);

        $ul = LeaveType::create([
            'name' => 'Unpaid Leave',
            'code' => 'UL',
            'description' => 'Absence without pay.',
            'default_days' => 30,
            'is_paid' => false,
            'requires_attachment' => false,
            'color' => '#F59E0B', // Amber
            'is_active' => true,
        ]);

        $mpl = LeaveType::create([
            'name' => 'Maternity / Paternity Leave',
            'code' => 'MPL',
            'description' => 'Parental leave.',
            'default_days' => 60,
            'is_paid' => true,
            'requires_attachment' => true,
            'color' => '#10B981', // Emerald
            'is_active' => true,
        ]);

        // 5. Create Default French Holidays (2026)
        CompanyHoliday::create(['name' => "New Year's Day", 'date' => '2026-01-01', 'is_half_day' => false]);
        CompanyHoliday::create(['name' => 'Easter Monday', 'date' => '2026-04-06', 'is_half_day' => false]);
        CompanyHoliday::create(['name' => 'Labour Day', 'date' => '2026-05-01', 'is_half_day' => false]);
        CompanyHoliday::create(['name' => 'Victory in Europe Day', 'date' => '2026-05-08', 'is_half_day' => false]);
        CompanyHoliday::create(['name' => 'Ascension Day', 'date' => '2026-05-14', 'is_half_day' => false]);
        CompanyHoliday::create(['name' => 'Whit Monday', 'date' => '2026-05-25', 'is_half_day' => false]);
        CompanyHoliday::create(['name' => 'Bastille Day', 'date' => '2026-07-14', 'is_half_day' => false]);
        CompanyHoliday::create(['name' => 'Assumption of Mary', 'date' => '2026-08-15', 'is_half_day' => false]);
        CompanyHoliday::create(['name' => 'All Saints\' Day', 'date' => '2026-11-01', 'is_half_day' => false]);
        CompanyHoliday::create(['name' => 'Armistice Day', 'date' => '2026-11-11', 'is_half_day' => false]);
        CompanyHoliday::create(['name' => 'Christmas Day', 'date' => '2026-12-25', 'is_half_day' => false]);

        // 6. Create Users across all 4 roles
        $admin = User::create([
            'employee_number' => 'EMP-00001',
            'first_name' => 'System',
            'last_name' => 'Admin',
            'email' => 'admin@smartleave.com',
            'password' => 'Password123!',
            'position' => 'System Administrator',
            'status' => 'active',
            'department_id' => $hrd->id,
            'hire_date' => '2026-01-01',
            'email_verified_at' => now(),
        ]);
        $admin->assignRole($adminRole);
        $hrd->update(['manager_id' => $admin->id]);

        $hrUser = User::create([
            'employee_number' => 'EMP-00002',
            'first_name' => 'Sarah',
            'last_name' => 'Connor',
            'email' => 'hr@smartleave.com',
            'password' => 'Password123!',
            'position' => 'HR Director',
            'status' => 'active',
            'department_id' => $hrd->id,
            'hire_date' => '2026-01-15',
            'email_verified_at' => now(),
        ]);
        $hrUser->assignRole($hrRole);

        $managerUser = User::create([
            'employee_number' => 'EMP-00003',
            'first_name' => 'Thomas',
            'last_name' => 'Anderson',
            'email' => 'manager@smartleave.com',
            'password' => 'Password123!',
            'position' => 'Engineering Lead',
            'status' => 'active',
            'department_id' => $eng->id,
            'hire_date' => '2026-02-01',
            'email_verified_at' => now(),
        ]);
        $managerUser->assignRole($managerRole);
        $eng->update(['manager_id' => $managerUser->id]);

        $employeeUser = User::create([
            'employee_number' => 'EMP-00004',
            'first_name' => 'Lucas',
            'last_name' => 'Martin',
            'email' => 'employee@smartleave.com',
            'password' => 'Password123!',
            'position' => 'Software Engineer',
            'status' => 'active',
            'department_id' => $eng->id,
            'manager_id' => $managerUser->id,
            'hire_date' => '2026-03-01',
            'email_verified_at' => now(),
        ]);
        $employeeUser->assignRole($employeeRole);

        // Seed Entitlements for all users
        $allUsers = [$admin, $hrUser, $managerUser, $employeeUser];
        $allTypes = [$al, $sl, $ul, $mpl];

        foreach ($allUsers as $u) {
            foreach ($allTypes as $t) {
                LeaveEntitlement::create([
                    'user_id' => $u->id,
                    'leave_type_id' => $t->id,
                    'year' => 2026,
                    'allocated_days' => $t->default_days,
                    'carried_over_days' => $t->id === $al->id ? 3 : 0,
                    'manual_adjustment_days' => 0,
                ]);
            }
        }

        // Seed Initial Leave Requests
        LeaveRequest::create([
            'user_id' => $employeeUser->id,
            'leave_type_id' => $al->id,
            'start_date' => '2026-08-10',
            'end_date' => '2026-08-14',
            'total_days' => 5.0,
            'half_day_type' => 'none',
            'reason' => 'Summer family vacation.',
            'status' => 'pending',
        ]);

        LeaveRequest::create([
            'user_id' => $employeeUser->id,
            'leave_type_id' => $sl->id,
            'start_date' => '2026-05-11',
            'end_date' => '2026-05-12',
            'total_days' => 2.0,
            'half_day_type' => 'none',
            'reason' => 'Flu recovery.',
            'status' => 'approved',
            'approved_by' => $managerUser->id,
        ]);

        // 7. Seed Default System Settings
        \App\Models\Setting::set('company_name', 'SmartLeave Enterprise', 'general', 'string', 'Official company organization name');
        \App\Models\Setting::set('timezone', 'Europe/Paris', 'general', 'string', 'Default application timezone');
        \App\Models\Setting::set('fiscal_year_start', '1', 'general', 'integer', 'Fiscal year starting month (1-12)');
        \App\Models\Setting::set('working_days', ['mon', 'tue', 'wed', 'thu', 'fri'], 'working_week', 'json', 'Configured active working days of the week');
        \App\Models\Setting::set('standard_hours_per_day', 8, 'working_week', 'integer', 'Standard daily working hours');
        \App\Models\Setting::set('allow_overdraft', true, 'leave_rules', 'boolean', 'Allow employees to submit requests over allocated entitlement balance');
        \App\Models\Setting::set('require_medical_attachment_days', 3, 'leave_rules', 'integer', 'Threshold days requiring medical doctor note attachment');
        \App\Models\Setting::set('email_notifications_enabled', true, 'notifications', 'boolean', 'Global email notification triggers');
        \App\Models\Setting::set('auto_reminder_days', 3, 'notifications', 'integer', 'Days before sending pending approval reminders to managers');
    }
}
