<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reward extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'rewards';
    public $timestamps = false;

    protected $fillable = ['id', 'user_id', 'reward_id', 'is_active', 'created_at', 'expires_at'];

    protected $casts = [
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}