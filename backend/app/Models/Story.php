<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Enums\StoryStatus;

class Story extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    protected $table = 'stories';

    protected $fillable = [
        'id', 'title', 'content', 'slug', 'images', 'videos', 'status',
        'author_id', 'donation_request_id', 'published_at', 'views'
    ];

    protected $casts = [
        'status' => StoryStatus::class,
        'published_at' => 'datetime',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function donationRequest(): BelongsTo
    {
        return $this->belongsTo(DonationRequest::class, 'donation_request_id');
    }

    public function shares(): HasMany
    {
        return $this->hasMany(Share::class, 'story_id');
    }
}