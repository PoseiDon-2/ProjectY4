<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reward_catalog', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category', 50); // profile | badge | feature | physical
            $table->unsignedInteger('points_cost')->default(0);
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_limited')->default(false);
            $table->unsignedInteger('limit_quantity')->nullable();
            $table->unsignedInteger('remaining_quantity')->nullable();
            $table->json('requirements')->nullable(); // min_level, min_donations, etc.
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reward_catalog');
    }
};
