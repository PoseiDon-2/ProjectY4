<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Enums\UserInteractionType; // <-- เพิ่ม import นี้

class UserBehavior extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'user_behaviors';

    protected $fillable = [
        'session_id',
        'user_id',
        'donation_request_id',
        'action_type',
        'duration_ms',
        'meta_data'
    ];

    protected $casts = [
        'meta_data' => 'array',
        'action_type' => UserInteractionType::class // <-- เพิ่ม casting นี้
    ];
    
    // Optional: ถ้าต้องการให้ id เป็น string (เมื่อใช้ UUID)
    protected $keyType = 'string';
    public $incrementing = false;
}