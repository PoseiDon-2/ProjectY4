<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Favorite extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'favorites';
    public $timestamps = false;

    protected $fillable = ['id', 'user_id', 'request_id', 'created_at'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(DonationRequest::class, 'request_id');
    }
}