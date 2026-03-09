<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_interested_donations', function (Blueprint $table) {
            $table->id();
            
            // 1. user_id ต้อง nullable() เพื่อให้ Guest กด Like ได้
            $table->foreignUuid('user_id')
                  ->nullable() // <--- สำคัญมาก!
                  ->constrained('users')
                  ->onDelete('cascade');

            // 2. donation_requests
            $table->foreignUuid('donation_request_id')
                  ->constrained('donation_requests')
                  ->onDelete('cascade');

            // 3. เพิ่ม session_id สำหรับ Guest
            $table->string('session_id')->nullable()->index();

            $table->timestamp('liked_at')->useCurrent();
            $table->boolean('notified')->default(false);

            $table->timestamps();

            // Index ป้องกันการกดสนใจซ้ำ (สำหรับคนที่ Login แล้ว)
            // MySQL ยอมให้ Unique Index มีค่า NULL ซ้ำกันได้ (Guest จะไม่ติด Error นี้)
            $table->unique(['user_id', 'donation_request_id'], 'user_interest_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_interested_donations');
    }
};