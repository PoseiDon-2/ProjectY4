<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('points_transactions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->uuid('user_id');
            $table->string('type');
            $table->integer('amount');
            $table->string('source');
            $table->text('description');
            $table->timestamp('date');
            $table->string('related_id')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('points_transactions');
    }
};