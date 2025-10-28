<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\StoryStatus;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('content');
            $table->string('slug')->unique();
            $table->longText('images')->nullable();
            $table->longText('videos')->nullable();
            $table->enum('status', array_column(StoryStatus::cases(), 'value'))->default('DRAFT');
            $table->uuid('author_id');
            $table->uuid('donation_request_id')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->integer('views')->default(0);
            $table->timestamps();

            $table->foreign('author_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('donation_request_id')->references('id')->on('donation_requests')->onDelete('cascade');

            $table->index('status');
            $table->index('created_at');
            $table->index('donation_request_id');
            $table->index('author_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stories');
    }
};