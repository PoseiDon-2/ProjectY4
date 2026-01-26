<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DonationSlip extends Model
{
    protected $fillable = [
        'donation_request_id',
        'donor_id',
        'amount',
        'payment_method',
        'slip_path',
        'status',
        'client_verdict',
        'client_reasons',
        'verified_by',
        'verified_at',
        'rejection_reason',
    ];

    protected $casts = [
        'client_reasons' => 'array',
        'verified_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function donationRequest(): BelongsTo
    {
        return $this->belongsTo(DonationRequest::class, 'donation_request_id');
    }

    public function donor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'donor_id');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
