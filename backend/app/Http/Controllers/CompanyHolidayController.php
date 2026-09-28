<?php

namespace App\Http\Controllers;

use App\Models\CompanyHoliday;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CompanyHolidayController extends Controller
{
    /**
     * Display a listing of company holidays.
     */
    public function index(Request $request): JsonResponse
    {
        $year = (int) $request->input('year', date('Y'));
        $holidays = CompanyHoliday::where(function ($q) use ($year) {
            $q->whereYear('date', $year)->orWhereYear('end_date', $year);
        })->orderBy('date')->get()->map(function ($h) {
            return [
                'id' => $h->id,
                'name' => $h->name,
                'date' => $h->date ? $h->date->format('Y-m-d') : null,
                'start_date' => $h->date ? $h->date->format('Y-m-d') : null,
                'end_date' => $h->end_date ? $h->end_date->format('Y-m-d') : ($h->date ? $h->date->format('Y-m-d') : null),
                'is_half_day' => (bool) $h->is_half_day,
            ];
        });

        return response()->json([
            'year' => $year,
            'data' => $holidays,
        ]);
    }

    /**
     * Store a newly created company holiday.
     */
    public function store(Request $request): JsonResponse
    {
        if (! $request->user()->hasAnyRole(['Admin', 'HR'])) {
            abort(403, 'Unauthorized action.');
        }

        $startDate = $request->input('start_date') ?? $request->input('date');
        $endDate = $request->input('end_date') ?? $startDate;

        if ($endDate < $startDate) {
            return response()->json([
                'message' => 'End date cannot be earlier than start date.',
                'errors' => [
                    'end_date' => ['The end date must be a date after or equal to start date.'],
                ],
            ], 422);
        }

        $holiday = CompanyHoliday::create([
            'name' => $request->input('name'),
            'date' => $startDate,
            'end_date' => $endDate,
            'is_half_day' => (bool) $request->input('is_half_day', false),
        ]);

        \App\Models\AuditLog::log($request->user(), 'holiday.created', 'system', [
            'holiday_name' => $holiday->name,
            'date' => $holiday->date,
            'end_date' => $holiday->end_date,
            'description' => "Added company holiday {$holiday->name} ({$holiday->date}).",
        ]);

        return response()->json([
            'message' => 'Company holiday added successfully.',
            'data' => [
                'id' => $holiday->id,
                'name' => $holiday->name,
                'date' => $holiday->date ? $holiday->date->format('Y-m-d') : null,
                'start_date' => $holiday->date ? $holiday->date->format('Y-m-d') : null,
                'end_date' => $holiday->end_date ? $holiday->end_date->format('Y-m-d') : null,
                'is_half_day' => (bool) $holiday->is_half_day,
            ],
        ], 201);
    }

    /**
     * Remove the specified company holiday.
     */
    public function destroy(Request $request, CompanyHoliday $companyHoliday): Response
    {
        if (! $request->user()->hasAnyRole(['Admin', 'HR'])) {
            abort(403, 'Unauthorized action.');
        }

        $hName = $companyHoliday->name;
        $hDate = $companyHoliday->date;
        $companyHoliday->delete();

        \App\Models\AuditLog::log($request->user(), 'holiday.deleted', 'system', [
            'holiday_name' => $hName,
            'date' => $hDate,
            'description' => "Deleted company holiday {$hName}.",
        ]);

        return response()->noContent();
    }
}
