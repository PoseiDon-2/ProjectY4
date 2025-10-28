<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\DonationType;
use App\Enums\DonationStatus;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('donations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->decimal('amount', 12, 2)->default(0);
            $table->text('item_details')->nullable();
            $table->enum('type', array_column(DonationType::cases(), 'value'));
            $table->enum('status', array_column(DonationStatus::cases(), 'value'))->default('PENDING');
            $table->uuid('donor_id');
            $table->uuid('request_id');
            $table->string('request_title')->nullable();
            $table->string('transaction_id')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('tracking_number')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('donor_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('request_id')->references('id')->on('donation_requests')->onDelete('cascade');

            $table->index('status');
            $table->index('created_at');
            $table->index('donor_id');
            $table->index('request_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donations');
    }
};