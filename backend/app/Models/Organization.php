<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Enums\OrganizationType;

class Organization extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'organizations';

    protected $fillable = [
        'id', 'name', 'type', 'phone', 'address', 'website',
        'registration_number', 'temple_id'
    ];

    protected $casts = [
        'type' => OrganizationType::class,
    ];

    public function donationRequests(): HasMany
    {
        return $this->hasMany(DonationRequest::class, 'organization_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'organization_id');
    }
}