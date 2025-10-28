<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'audit_logs';
    public $timestamps = false;

    protected $fillable = ['id', 'user_id', 'action', 'entity_type', 'entity_id', 'created_at'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}