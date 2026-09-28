<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Seeder;

class AuditLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::role('Admin')->first() ?? User::first();
        if (!$admin) {
            return;
        }

        $logs = [
            [
                'user_id' => $admin->id,
                'actor_name' => $admin->name,
                'action' => 'system.initialized',
                'category' => 'system',
                'description' => 'System environment and database initialized.',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'payload' => ['version' => '1.0.0', 'environment' => 'production'],
                'created_at' => now()->subDays(5),
            ],
            [
                'user_id' => $admin->id,
                'actor_name' => $admin->name,
                'action' => 'department.created',
                'category' => 'department',
                'description' => 'Created Engineering department.',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'payload' => ['department_name' => 'Engineering', 'code' => 'ENG'],
                'created_at' => now()->subDays(4),
            ],
            [
                'user_id' => $admin->id,
                'actor_name' => $admin->name,
                'action' => 'policy.updated',
                'category' => 'policy',
                'description' => 'Updated Paid Annual Leave default days to 28.',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'payload' => ['policy' => 'Paid Annual Leave', 'default_days' => 28],
                'created_at' => now()->subDays(3),
            ],
            [
                'user_id' => $admin->id,
                'actor_name' => $admin->name,
                'action' => 'leave.approved',
                'category' => 'leave',
                'description' => 'Approved Annual Leave request for employee.',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'payload' => ['request_id' => 1, 'status' => 'approved', 'days' => 3],
                'created_at' => now()->subDays(2),
            ],
            [
                'user_id' => $admin->id,
                'actor_name' => $admin->name,
                'action' => 'settings.updated',
                'category' => 'policy',
                'description' => 'Updated system timezone to Europe/Paris.',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'payload' => ['timezone' => 'Europe/Paris', 'allow_overdraft' => false],
                'created_at' => now()->subHours(6),
            ],
            [
                'user_id' => $admin->id,
                'actor_name' => $admin->name,
                'action' => 'leave.submitted',
                'category' => 'leave',
                'description' => 'Submitted Sick Leave request.',
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'payload' => ['leave_type' => 'Sick Leave', 'days' => 2],
                'created_at' => now()->subMinutes(30),
            ],
        ];

        foreach ($logs as $log) {
            AuditLog::create($log);
        }
    }
}
