<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('trust_level_config', function (Blueprint $table) {
            $table->id();
            $table->string('role', 20); // donor | organizer
            $table->unsignedTinyInteger('level');
            $table->string('name', 100);
            $table->unsignedInteger('min_score')->default(0);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['role', 'level']);
            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trust_level_config');
    }
};
