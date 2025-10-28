<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\VolunteerStatus;

class VolunteerApplication extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'volunteer_applications';

    protected $fillable = [
        'id', 'message', 'skills', 'experience', 'availability', 'status',
        'hours_committed', 'start_date', 'end_date', 'approved_at',
        'completed_at', 'volunteer_id', 'request_id'
    ];

    protected $casts = [
        'status' => VolunteerStatus::class,
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'approved_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function volunteer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'volunteer_id');
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(DonationRequest::class, 'request_id');
    }
}