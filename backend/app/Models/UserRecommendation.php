<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserRecommendation extends Model
{
    use HasFactory;

    protected $table = 'user_recommendations';

    protected $fillable = [
        'user_id',
        'session_id',
        'donation_request_id',
        'score',
        'base_tfidf_score',
        'behavior_adjust',
        'swipe_count',
        'like_count',
        'last_calculated_at',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array',
        'last_calculated_at' => 'datetime',
        'score' => 'float',
    ];

    public function donationRequest()
    {
        return $this->belongsTo(DonationRequest::class);
    }
}