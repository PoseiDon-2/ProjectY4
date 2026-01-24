<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_behaviors', function (Blueprint $table) {
            $table->uuid('id')->primary(); // ใช้ UUID เป็น Primary Key

            // User ID (Nullable เพราะคนทั่วไปที่ยังไม่ Login ก็เล่นได้)
            $table->uuid('user_id')->nullable()->index();

            // Session ID (สำคัญสำหรับคนไม่ Login)
            $table->string('session_id')->index();

            // เชื่อมกับตาราง donation_requests (ต้องมั่นใจว่าตารางนั้นใช้ UUID เหมือนกัน)
            $table->uuid('donation_request_id');

            // ประเภทการกระทำ: swipe_like, swipe_pass, click_detail, view_story
            $table->string('action_type');

            // ระยะเวลาที่ดู (ms)
            $table->integer('duration_ms')->default(0);

            // ข้อมูลเพิ่มเติม (เก็บเป็น JSON)
            $table->json('meta_data')->nullable();

            $table->timestamps();

            // Optional: ถ้าอยากทำ Foreign Key (ถ้าตาราง users หรือ donation_requests ใช้ ID แบบอื่น ให้แก้ตรงนี้)
            // $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            // $table->foreign('donation_request_id')->references('id')->on('donation_requests')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_behaviors');
    }
};
