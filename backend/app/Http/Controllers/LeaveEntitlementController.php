<?php

namespace App\Http\Controllers;

use App\Models\LeaveEntitlement;
use App\Models\User;
use App\Services\LeaveBalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveEntitlementController extends Controller
{
    /**
     * Get current user's leave balances for target year.
     */
    public function myBalances(Request $request, LeaveBalanceService $balanceService): JsonResponse
    {
        $year = (int) $request->input('year', date('Y'));
        $balances = $balanceService->getBalancesForUser($request->user(), $year);

        return response()->json([
            'year' => $year,
            'data' => $balances,
        ]);
    }

    /**
     * Get a specific employee's leave balances.
     */
    public function userBalances(Request $request, User $user, LeaveBalanceService $balanceService): JsonResponse
    {
        $currentUser = $request->user();

        if ($currentUser->id !== $user->id && ! $currentUser->hasAnyRole(['Admin', 'HR', 'Manager'])) {
            abort(403, 'Unauthorized action.');
        }

        $year = (int) $request->input('year', date('Y'));
        $balances = $balanceService->getBalancesForUser($user, $year);

        return response()->json([
            'year' => $year,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
            ],
            'data' => $balances,
        ]);
    }

    /**
     * Manually update/adjust an employee's leave entitlement.
     */
    public function updateEntitlement(Request $request): JsonResponse
    {
        if (! $request->user()->hasAnyRole(['Admin', 'HR'])) {
            abort(403, 'Unauthorized action.');
        }

        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'leave_type_id' => ['required', 'integer', 'exists:leave_types,id'],
            'year' => ['required', 'integer', 'min:2020', 'max:2035'],
            'allocated_days' => ['required', 'numeric', 'min:0'],
            'carried_over_days' => ['nullable', 'numeric', 'min:0'],
            'manual_adjustment_days' => ['nullable', 'numeric'],
        ]);

        $entitlement = LeaveEntitlement::updateOrCreate(
            [
                'user_id' => $data['user_id'],
                'leave_type_id' => $data['leave_type_id'],
                'year' => $data['year'],
            ],
            [
                'allocated_days' => $data['allocated_days'],
                'carried_over_days' => $data['carried_over_days'] ?? 0,
                'manual_adjustment_days' => $data['manual_adjustment_days'] ?? 0,
            ]
        );

        \App\Models\AuditLog::log($request->user(), 'entitlement.updated', 'policy', [
            'target_user_id' => $data['user_id'],
            'leave_type_id' => $data['leave_type_id'],
            'year' => $data['year'],
            'allocated_days' => $data['allocated_days'],
            'description' => "Adjusted leave entitlement balance for user ID {$data['user_id']} ({$data['allocated_days']} days for {$data['year']}).",
        ]);

        return response()->json([
            'message' => 'Leave entitlement updated successfully.',
            'data' => $entitlement,
        ]);
    }
}
