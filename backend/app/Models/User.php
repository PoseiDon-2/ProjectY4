<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Support\Str; 

class User extends Authenticatable
{
    use HasApiTokens, HasFactory;
    // UUID Settings
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'users';

    protected $fillable = [
    'id',
    'email',
    'password',
    'first_name',
    'last_name',
    'phone',
    'role',
    'avatar',
    'bio',
    'total_donated',
    'donation_count',
    'donor_trust_level',
    'donor_trust_score',
    'organizer_trust_level',
    'organizer_trust_score',
    'trust_calculated_at',
    'customization',
    
    'organization_name',
    'organization_type',
    'organization_id',
    
    'preferred_categories',
    'id_card_url',
    'is_email_verified',
    'organization_cert_url',
    'documents_verified',
    'location',
    'latitude',
    'longitude',
    'status'
];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['organizer_trust_level_name', 'donor_trust_level_name'];

    private const ORGANIZER_TRUST_NAMES = [
        1 => 'เริ่มต้น',
        2 => 'ได้รับความไว้วางใจ',
        3 => 'ผู้รับที่เชื่อถือได้',
        4 => 'พันธมิตรความดี',
        5 => 'มาตรฐานทอง',
    ];

    private const DONOR_TRUST_NAMES = [
        1 => 'เริ่มต้น',
        2 => 'ผู้ให้สม่ำเสมอ',
        3 => 'ผู้สนับสนุนที่น่าเชื่อถือ',
        4 => 'พันธมิตรผู้ให้',
        5 => 'มาตรฐานทอง',
    ];

    public function getOrganizerTrustLevelNameAttribute(): string
    {
        $level = (int) ($this->attributes['organizer_trust_level'] ?? 1);
        return self::ORGANIZER_TRUST_NAMES[$level] ?? 'เริ่มต้น';
    }

    public function getDonorTrustLevelNameAttribute(): string
    {
        $level = (int) ($this->attributes['donor_trust_level'] ?? 1);
        return self::DONOR_TRUST_NAMES[$level] ?? 'เริ่มต้น';
    }

    protected $casts = [
        'role' => UserRole::class,
        'status' => UserStatus::class,
        'is_email_verified' => 'boolean',
        'documents_verified' => 'boolean',
        'preferred_categories' => 'array',
        'email_verified_at' => 'datetime',
        'trust_calculated_at' => 'datetime',
    ];

    // สร้าง UUID อัตโนมัติตอนสร้างผู้ใช้ใหม่
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // Relations
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function donationRequests(): HasMany
    {
        return $this->hasMany(DonationRequest::class, 'organizer_id');
    }

    public function donations(): HasMany
    {
        return $this->hasMany(Donation::class, 'donor_id');
    }

    public function volunteerApplications(): HasMany
    {
        return $this->hasMany(VolunteerApplication::class, 'volunteer_id');
    }

    public function stories(): HasMany
    {
        return $this->hasMany(Story::class, 'author_id');
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class, 'user_id');
    }

    public function shares(): HasMany
    {
        return $this->hasMany(Share::class, 'user_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'user_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }

    public function pointsTransactions(): HasMany
    {
        return $this->hasMany(PointsTransaction::class, 'user_id');
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(Reward::class, 'user_id');
    }

    public function userInteractions(): HasMany
    {
        return $this->hasMany(UserInteraction::class, 'user_id');
    }

    public function userInterests(): HasMany
    {
        return $this->hasMany(UserInterest::class, 'user_id');
    }
}