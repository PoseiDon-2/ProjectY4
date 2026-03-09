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

            $table->uuid('user_id')->nullable()->index();
            $table->string('session_id')->index();
            $table->uuid('donation_request_id');

            // --- [จุดที่แก้] ---
            // เปลี่ยนจาก string เป็น tinyInteger เพื่อเก็บเลข 1, 2, 3, 4 (ใช้พื้นที่แค่ 1 byte)
            // unsigned() เพื่อกันค่าติดลบ (เก็บได้ 0-255)
            $table->tinyInteger('action_type')->unsigned(); 
            // ------------------

            $table->integer('duration_ms')->default(0);
            $table->json('meta_data')->nullable();
            $table->timestamps();

            // แนะนำ: ถ้าตาราง donation_requests มีอยู่จริง ควรเปิดคอมเมนต์บรรทัดนี้เพื่อทำ FK ครับ
            // $table->foreign('donation_request_id')->references('id')->on('donation_requests')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_behaviors');
    }
};