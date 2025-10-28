<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\DonationType;
use App\Enums\DonationStatus;

class Donation extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'donations';

    protected $fillable = [
        'id',
        'amount',
        'item_details',
        'type',
        'status',
        'donor_id',
        'request_id',
        'request_title',
        'transaction_id',
        'payment_method',
        'tracking_number',
        'completed_at'
    ];

    protected $casts = [
        'type' => DonationType::class,
        'status' => DonationStatus::class,
        'completed_at' => 'datetime',
    ];

    public function donor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'donor_id');
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(DonationRequest::class, 'request_id');
    }
}
