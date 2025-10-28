<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\UserInteractionType;

class UserInteraction extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'user_interactions';
    public $timestamps = false;

    protected $fillable = [
        'id', 'user_id', 'interaction_type', 'interaction_value',
        'entity_type', 'entity_id', 'duration', 'weight', 'created_at'
    ];

    protected $casts = [
        'interaction_type' => UserInteractionType::class,
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}