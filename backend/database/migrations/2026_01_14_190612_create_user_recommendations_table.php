<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_recommendations', function (Blueprint $table) {
            $table->id();

            // 1. ปรับให้ user_id เป็น nullable เพื่อรองรับ Guest
            $table->foreignUuid('user_id')
                ->nullable()
                ->constrained('users')
                ->onDelete('cascade');

            // 2. เพิ่ม session_id สำหรับ Guest User
            $table->string('session_id')->nullable()->index();

            $table->foreignUuid('donation_request_id')
                ->constrained('donation_requests')
                ->onDelete('cascade');

            // Score รวม (ใช้ในการ Sort เพื่อแสดงผล)
            $table->float('score', 8, 4)->default(0)->index();

            // --- ส่วนประกอบคะแนน (Feature Store) ---
            $table->float('base_tfidf_score', 8, 4)->nullable()
                ->comment('คะแนนความเหมือนจาก Content (เช่น ชอบหมา เจอโครงการหมา)');

            $table->float('behavior_adjust', 8, 4)->default(0)
                ->comment('คะแนนปรับแต่งจากพฤติกรรม (เช่น เคยกด Like +0.5)');

            // --- Cache ข้อมูลสถิติ (Optional: มีไว้ query เร็วขึ้น ไม่ต้อง join user_swipes บ่อยๆ) ---
            $table->integer('swipe_count')->default(0);
            $table->integer('like_count')->default(0);
            $table->integer('skip_count')->default(0);

            $table->timestamp('last_interaction_at')->nullable();
            $table->timestamp('last_calculated_at')->nullable()
                ->comment('เวลาที่ AI คำนวณล่าสุด');

            $table->json('metadata')->nullable();

            $table->timestamps();

            // Index: ค้นหา Recommendation ของ User คนหนึ่ง เรียงตามคะแนน
            $table->index(['user_id', 'score']);
            $table->index(['session_id', 'score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_recommendations');
    }
};
