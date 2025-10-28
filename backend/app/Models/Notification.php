<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'notifications';
    public $timestamps = false;

    protected $fillable = ['id', 'user_id', 'message', 'type', 'is_read', 'created_at'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}