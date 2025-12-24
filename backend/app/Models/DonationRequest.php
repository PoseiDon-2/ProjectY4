<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Enums\DonationRequestStatus;
use App\Enums\UrgencyLevel;
use App\Enums\DonationType;

class DonationRequest extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'donation_requests';

    protected $fillable = [
        'id',
        'title',
        'slug',
        'description',
        'images',
        'category_id',
        'accepts_money',
        'accepts_items',
        'accepts_volunteer',
        'target_amount',
        'current_amount',
        'supporters',
        'documents',
        'status',
        'goal_amount',
        'organizer_id',
        'organization_id',
        'urgency',
        'approved_by',
        'approved_at',
        'volunteers_received',
        'item_details',
        'volunteer_details',
        'donation_type',
        'payment_methods',
        'promptpay_number',
        'promptpay_qr',
        'view_count',
        'expires_at',
        'volunteers_needed',
        'volunteer_skills',
        'volunteer_duration',
        'items_needed',
        'recommendation_score',
        'location',
        'latitude',
        'longitude'
    ];

    protected $casts = [
        'status' => DonationRequestStatus::class,
        'urgency' => UrgencyLevel::class,
        'donation_type' => DonationType::class,
        'expires_at' => 'datetime',
        'approved_at' => 'datetime',
        'images' => 'array',
        'payment_methods' => 'array',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function donations(): HasMany
    {
        return $this->hasMany(Donation::class, 'request_id');
    }

    public function volunteerApplications(): HasMany
    {
        return $this->hasMany(VolunteerApplication::class, 'request_id');
    }

    public function stories(): HasMany
    {
        return $this->hasMany(Story::class, 'donation_request_id');
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class, 'request_id');
    }

    public function shares(): HasMany
    {
        return $this->hasMany(Share::class, 'request_id');
    }
}
