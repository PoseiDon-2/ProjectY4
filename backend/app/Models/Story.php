<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;

class Story extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organizer_id',
        'donation_request_id',
        'title',
        'content',
        'type',
        'media_type',
        'media_path',
        'duration',
        'show_time',
        'is_scheduled',
        'scheduled_time',
        'is_published',
        'published_at',
        'expires_at',
        'views',
        'likes',
    ];

    protected $casts = [
        'is_scheduled'  => 'boolean',
        'is_published'  => 'boolean',
        'scheduled_time' => 'datetime',
        'published_at'  => 'datetime',
        'expires_at'    => 'datetime',
        'duration'      => 'integer',
        'views'         => 'integer',
        'likes'         => 'integer',
    ];

    protected $appends = ['image_url'];

    // ─── Relations ───────────────────────────────────────────────

    /** organizer (user) ที่สร้าง story */
    public function organizer()
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    public function donationRequest()
    {
        return $this->belongsTo(DonationRequest::class);
    }

    // ─── Accessors ───────────────────────────────────────────────

    /**
     * image_url — ใช้ใน getOrganizerRequestsWithStories()
     * เพื่อ map เป็น 'image_url' ตามที่ frontend คาดหวัง
     */
    public function getImageUrlAttribute(): ?string
    {
        if ($this->media_path) {
            return Storage::disk('public')->url($this->media_path);
        }
        return null;
    }

    // ─── Scopes ──────────────────────────────────────────────────

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeForOrganizer($query, string $organizerId)
    {
        return $query->where('organizer_id', $organizerId);
    }

    // ─── Business Logic ──────────────────────────────────────────

    /** คำนวณ expires_at จาก show_time */
    public function computeExpiresAt(\Carbon\Carbon $from = null): ?\Carbon\Carbon
    {
        $base = $from ?? now();

        return match ($this->show_time) {
            '24_hours' => $base->copy()->addHours(24),
            '3_days'   => $base->copy()->addDays(3),
            '1_week'   => $base->copy()->addWeek(),
            default    => null,
        };
    }
}
