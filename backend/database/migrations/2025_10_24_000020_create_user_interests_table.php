<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_interests', function (Blueprint $table) {
            $table->uuid('user_id');
            $table->string('interest_id');
            $table->uuid('category_id')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('interest_id')->references('id')->on('interests')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');

            $table->primary(['user_id', 'interest_id']);
            $table->index('category_id');
            $table->index('interest_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_interests');
    }
};