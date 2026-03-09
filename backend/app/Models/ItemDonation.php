<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use App\Enums\ItemDonationStatus;

class ItemDonation extends Model
{
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'item_donations';

    protected $fillable = [
        'id',
        'donation_request_id',
        'donor_id',
        'items_needed',
        'estimated_value',
        'evidence_images',
        'quantity_approved',
        'delivery_method',
        'delivery_date',
        'delivery_time',
        'tracking_number',
        'message',
        'status',
        'points_earned',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'status' => ItemDonationStatus::class,
        'evidence_images' => 'array',
        'delivery_date' => 'date',
        'approved_at' => 'datetime',
    ];

    public function donationRequest(): BelongsTo
    {
        return $this->belongsTo(DonationRequest::class, 'donation_request_id');
    }

    public function donor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'donor_id');
    }
}
