<?php

namespace App\Services;

use App\Models\LeaveEntitlement;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\User;

class LeaveBalanceService
{
    /**
     * Get employee leave balances breakdown for a given year.
     */
    public function getBalancesForUser(User $user, int $year): array
    {
        $leaveTypes = LeaveType::where('is_active', true)->get();

        $balances = [];

        foreach ($leaveTypes as $leaveType) {
            // Get or create entitlement
            $entitlement = LeaveEntitlement::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'leave_type_id' => $leaveType->id,
                    'year' => $year,
                ],
                [
                    'allocated_days' => $leaveType->default_days,
                    'carried_over_days' => 0,
                    'manual_adjustment_days' => 0,
                ]
            );

            $totalAllocated = (float) ($entitlement->allocated_days + $entitlement->carried_over_days + $entitlement->manual_adjustment_days);

            // Calculate used days (approved requests starting in target year)
            $usedDays = (float) LeaveRequest::where('user_id', $user->id)
                ->where('leave_type_id', $leaveType->id)
                ->where('status', 'approved')
                ->whereYear('start_date', $year)
                ->sum('total_days');

            // Calculate pending days (pending requests starting in target year)
            $pendingDays = (float) LeaveRequest::where('user_id', $user->id)
                ->where('leave_type_id', $leaveType->id)
                ->where('status', 'pending')
                ->whereYear('start_date', $year)
                ->sum('total_days');

            $remainingDays = max(0, $totalAllocated - $usedDays);

            $balances[] = [
                'leave_type_id' => $leaveType->id,
                'leave_type_name' => $leaveType->name,
                'leave_type_code' => $leaveType->code,
                'color' => $leaveType->color,
                'is_paid' => $leaveType->is_paid,
                'requires_attachment' => $leaveType->requires_attachment,
                'allocated_days' => $totalAllocated,
                'used_days' => $usedDays,
                'pending_days' => $pendingDays,
                'remaining_days' => $remainingDays,
            ];
        }

        return $balances;
    }
}
