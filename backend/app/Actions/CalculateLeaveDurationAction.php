<?php

namespace App\Actions;

use App\Models\CompanyHoliday;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class CalculateLeaveDurationAction
{
    /**
     * Calculate net working leave days between start and end dates.
     * Excludes weekends (Saturday/Sunday) and multi-day company holidays.
     */
    public function execute(string $startDate, string $endDate, string $halfDayType = 'none'): float
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->startOfDay();

        if ($start->gt($end)) {
            return 0.0;
        }

        // Half day single-day request check
        if ($start->isSameDay($end) && in_array($halfDayType, ['morning', 'afternoon'])) {
            return 0.5;
        }

        // Fetch company holidays that overlap with date range [$start, $end]
        $holidays = CompanyHoliday::where(function ($q) use ($start, $end) {
            $startDateStr = $start->toDateString();
            $endDateStr = $end->toDateString();

            $q->whereBetween('date', [$startDateStr, $endDateStr])
              ->orWhereBetween('end_date', [$startDateStr, $endDateStr])
              ->orWhere(function ($sub) use ($startDateStr, $endDateStr) {
                  $sub->where('date', '<=', $startDateStr)
                      ->where('end_date', '>=', $endDateStr);
              });
        })->get();

        // Map all individual holiday dates to their half-day status
        $holidayDates = [];
        foreach ($holidays as $holiday) {
            $hStart = Carbon::parse($holiday->date);
            $hEnd = $holiday->end_date ? Carbon::parse($holiday->end_date) : $hStart;
            $hPeriod = CarbonPeriod::create($hStart, $hEnd);
            foreach ($hPeriod as $hDate) {
                $holidayDates[$hDate->toDateString()] = $holiday->is_half_day;
            }
        }

        $workingDays = 0.0;
        $period = CarbonPeriod::create($start, $end);

        $configuredDays = \App\Models\Setting::get('working_days', ['mon', 'tue', 'wed', 'thu', 'fri']);
        if (! is_array($configuredDays)) {
            $configuredDays = ['mon', 'tue', 'wed', 'thu', 'fri'];
        }

        foreach ($period as $date) {
            // Skip non-configured working days (e.g. weekends or custom days off)
            $dayCode = strtolower(substr($date->format('D'), 0, 3));
            if (! in_array($dayCode, $configuredDays)) {
                continue;
            }

            $dateStr = $date->toDateString();

            // Check company holiday
            if (array_key_exists($dateStr, $holidayDates)) {
                $isHalfDayHoliday = $holidayDates[$dateStr];
                if ($isHalfDayHoliday) {
                    $workingDays += 0.5;
                }
                continue; // Full holiday day skipped
            }

            $workingDays += 1.0;
        }

        // Subtract 0.5 if half-day specified on multi-day range start/end
        if ($halfDayType !== 'none' && $workingDays > 0.5) {
            $workingDays -= 0.5;
        }

        return max(0.5, $workingDays);
    }
}
