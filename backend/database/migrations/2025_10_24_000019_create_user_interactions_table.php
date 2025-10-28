<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\UserInteractionType;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_interactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->enum('interaction_type', array_column(UserInteractionType::cases(), 'value'));
            $table->integer('interaction_value')->default(1);
            $table->string('entity_type');
            $table->string('entity_id');
            $table->integer('duration')->nullable();
            $table->double('weight')->default(1);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            $table->index(['entity_type', 'entity_id']);
            $table->index('interaction_type');
            $table->index(['user_id', 'entity_id', 'interaction_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_interactions');
    }
};