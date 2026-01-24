<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserInterestedDonation extends Model
{
    use HasFactory;

    /**
     * ชื่อตารางในฐานข้อมูล
     */
    protected $table = 'user_interested_donations';

    /**
     * ข้อมูลที่อนุญาตให้บันทึกผ่าน Mass Assignment (create/update)
     */
    protected $fillable = [
        'user_id',
        'donation_request_id',
        'session_id',
        'notified',
        'liked_at'
    ];

    /**
     * แปลงข้อมูลให้เป็น Type ที่ถูกต้องอัตโนมัติ
     */
    protected $casts = [
        'notified' => 'boolean',
        'liked_at' => 'datetime',
    ];

    /**
     * ความสัมพันธ์กับ User (คนกดสนใจ)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * ความสัมพันธ์กับ DonationRequest (โครงการที่สนใจ)
     */
    public function donationRequest()
    {
        return $this->belongsTo(DonationRequest::class);
    }
}