<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('donation_slips', function (Blueprint $table) {
            $table->id();
            $table->uuid('donation_request_id');
            $table->uuid('donor_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->enum('payment_method', ['promptpay','bank','credit'])->default('promptpay');
            $table->string('slip_path');
            $table->enum('status', ['pending','verified','rejected'])->default('pending');
            $table->string('client_verdict')->nullable();
            $table->json('client_reasons')->nullable();
            $table->uuid('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->string('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['donation_request_id', 'status']);
            $table->index('donor_id');
        });
    }

    public function down(): void {
        Schema::dropIfExists('donation_slips');
    }
};
