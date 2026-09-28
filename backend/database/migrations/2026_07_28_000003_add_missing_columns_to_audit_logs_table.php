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
        Schema::table('audit_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('audit_logs', 'actor_name')) {
                $table->string('actor_name')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('audit_logs', 'category')) {
                $table->string('category')->default('general')->after('action');
            }
            if (!Schema::hasColumn('audit_logs', 'payload')) {
                $table->json('payload')->nullable()->after('user_agent');
            }
            if (!Schema::hasColumn('audit_logs', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            if (Schema::hasColumn('audit_logs', 'actor_name')) {
                $table->dropColumn('actor_name');
            }
            if (Schema::hasColumn('audit_logs', 'category')) {
                $table->dropColumn('category');
            }
            if (Schema::hasColumn('audit_logs', 'payload')) {
                $table->dropColumn('payload');
            }
            if (Schema::hasColumn('audit_logs', 'updated_at')) {
                $table->dropColumn('updated_at');
            }
        });
    }
};
