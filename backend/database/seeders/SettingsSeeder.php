<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Setting::set('company_name', 'SmartLeave Enterprise', 'general', 'string', 'Official company organization name');
        Setting::set('timezone', 'Europe/Paris', 'general', 'string', 'Default application timezone');
        Setting::set('fiscal_year_start', '1', 'general', 'integer', 'Fiscal year starting month (1-12)');
        Setting::set('working_days', ['mon', 'tue', 'wed', 'thu', 'fri'], 'working_week', 'json', 'Configured active working days of the week');
        Setting::set('standard_hours_per_day', 8, 'working_week', 'integer', 'Standard daily working hours');
        Setting::set('allow_overdraft', true, 'leave_rules', 'boolean', 'Allow employees to submit requests over allocated entitlement balance');
        Setting::set('require_medical_attachment_days', 3, 'leave_rules', 'integer', 'Threshold days requiring medical doctor note attachment');
        Setting::set('email_notifications_enabled', true, 'notifications', 'boolean', 'Global email notification triggers');
        Setting::set('auto_reminder_days', 3, 'notifications', 'integer', 'Days before sending pending approval reminders to managers');
    }
}
