<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Request;

class AuditLog extends Model
{
    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'actor_name',
        'action',
        'category',
        'description',
        'ip_address',
        'user_agent',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who triggered the audit event.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Helper static method to record an audit entry.
     */
    public static function log($user, string $action, string $category = 'general', ?array $payload = null): self
    {
        return static::create([
            'user_id' => is_object($user) ? $user->id : (is_numeric($user) ? $user : null),
            'actor_name' => is_object($user) ? $user->name : 'System',
            'action' => $action,
            'category' => $category,
            'description' => $payload['description'] ?? null,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'payload' => $payload,
        ]);
    }
}
