<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyHoliday extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'date',
        'end_date',
        'is_half_day',
    ];

    protected $casts = [
        'date' => 'date',
        'end_date' => 'date',
        'is_half_day' => 'boolean',
    ];
}
