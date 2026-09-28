<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            $table->string('color', 20)->default('#4F46E5')->after('requires_attachment');
            $table->boolean('is_active')->default(true)->after('color');
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->string('half_day_type', 20)->default('none')->after('total_days'); // none, morning, afternoon
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            $table->dropColumn(['color', 'is_active']);
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropColumn(['half_day_type']);
        });
    }
};
