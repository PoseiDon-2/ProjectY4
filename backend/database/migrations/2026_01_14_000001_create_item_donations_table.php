<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('item_donations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('donation_request_id');
            $table->uuid('donor_id');
            $table->text('items_needed');
            $table->json('evidence_images')->nullable(); // paths or base64
            $table->integer('quantity_approved')->nullable();
            $table->string('delivery_method')->nullable();
            $table->date('delivery_date')->nullable();
            $table->string('delivery_time')->nullable();
            $table->string('tracking_number')->nullable();
            $table->text('message')->nullable();
            $table->string('status')->default('PENDING_REVIEW');
            $table->integer('points_earned')->default(0);
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->foreign('donation_request_id')->references('id')->on('donation_requests')->onDelete('cascade');
            $table->foreign('donor_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['donation_request_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_donations');
    }
};
