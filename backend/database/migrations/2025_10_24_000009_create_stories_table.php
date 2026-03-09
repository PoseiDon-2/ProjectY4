<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stories', function (Blueprint $table) {
            $table->id(); // id ของ stories จะเป็นตัวเลข (unsignedBigInteger)

            // เชื่อมกับตาราง users และ donation_requests ด้วย UUID
            $table->foreignUuid('organizer_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('donation_request_id')->constrained('donation_requests')->onDelete('cascade');

            $table->string('title');
            $table->text('content');
            $table->enum('type', ['progress', 'milestone', 'thank_you', 'completion'])->default('progress');

            $table->enum('media_type', ['image', 'video'])->default('image');
            $table->string('media_path')->nullable();

            $table->integer('duration')->default(5)->comment('วินาที');
            $table->enum('show_time', ['immediately', '24_hours', '3_days', '1_week'])->default('immediately');

            $table->boolean('is_scheduled')->default(false);
            $table->timestamp('scheduled_time')->nullable();

            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            $table->unsignedInteger('views')->default(0);
            $table->unsignedInteger('likes')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['organizer_id', 'is_published']);
            $table->index(['donation_request_id', 'is_published']);
            $table->index('scheduled_time');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stories');
    }
};
