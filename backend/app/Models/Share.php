<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Share extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'shares';
    public $timestamps = false;

    protected $fillable = ['id', 'user_id', 'request_id', 'story_id', 'platform', 'created_at'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(DonationRequest::class, 'request_id');
    }

    public function story(): BelongsTo
    {
        return $this->belongsTo(Story::class, 'story_id');
    }
}