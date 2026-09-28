<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SettingController extends Controller
{
    /**
     * Get all settings grouped or flat.
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all();
        $formatted = [];

        foreach ($settings as $s) {
            $formatted[$s->key] = Setting::get($s->key);
        }

        return response()->json([
            'settings' => $formatted,
            'raw' => $settings,
        ]);
    }

    /**
     * Batch update system settings.
     */
    public function update(Request $request): JsonResponse
    {
        if (! $request->user()->hasRole('Admin')) {
            abort(403, 'Unauthorized action. Only administrators can update system settings.');
        }

        $request->validate([
            'settings' => 'required|array',
        ]);

        $user = Auth::user();
        $updatedKeys = [];

        foreach ($request->settings as $key => $value) {
            $existing = Setting::where('key', $key)->first();
            $group = $existing ? $existing->group : 'general';
            $type = $existing ? $existing->type : 'string';
            $description = $existing ? $existing->description : null;

            Setting::set($key, $value, $group, $type, $description);
            $updatedKeys[] = $key;
        }

        // Record Audit Log
        AuditLog::log($user, 'settings.updated', 'system', [
            'updated_keys' => $updatedKeys,
        ]);

        return response()->json([
            'message' => 'System settings updated successfully',
        ]);
    }
}
