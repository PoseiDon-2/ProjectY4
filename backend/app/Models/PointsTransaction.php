<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PointsTransaction extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'points_transactions';
    public $timestamps = false;

    protected $fillable = ['id', 'user_id', 'type', 'amount', 'source', 'description', 'date', 'related_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}