<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\DonationRequestStatus;
use App\Enums\UrgencyLevel;
use App\Enums\DonationType;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('donation_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->longText('images')->nullable();
            $table->string('title');
            $table->text('description');
            $table->string('slug')->unique();
            $table->uuid('category_id');
            $table->boolean('accepts_money')->default(false);
            $table->boolean('accepts_items')->default(false);
            $table->boolean('accepts_volunteer')->default(false);
            $table->decimal('target_amount', 12, 2)->default(0);
            $table->decimal('current_amount', 12, 2)->default(0);
            $table->integer('supporters')->default(0);
            $table->longText('documents')->nullable();
            $table->enum('status', array_column(DonationRequestStatus::cases(), 'value'))->default('DRAFT');
            $table->double('goal_amount')->nullable();
            $table->uuid('organizer_id');
            $table->uuid('organization_id')->nullable();
            $table->enum('urgency', array_column(UrgencyLevel::cases(), 'value'))->default('LOW')->nullable();
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->integer('volunteers_received')->default(0);
            $table->longText('item_details')->nullable();
            $table->longText('volunteer_details')->nullable();
            $table->enum('donation_type', array_column(DonationType::cases(), 'value'))->nullable();
            $table->longText('payment_methods')->nullable();
            $table->integer('view_count')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->integer('volunteers_needed')->default(0);
            $table->longText('volunteer_skills')->nullable();
            $table->string('volunteer_duration')->nullable();
            $table->longText('items_needed')->nullable();
            $table->double('recommendation_score')->default(0);
            $table->string('location')->nullable();
            $table->double('latitude')->nullable();
            $table->double('longitude')->nullable();
            $table->timestamps();

            $table->foreign('category_id')->references('id')->on('categories')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('organizer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approved_by')->references('id')->on('users')->onDelete('set null');

            $table->index('slug');
            $table->index('status');
            $table->index('created_at');
            $table->index(['category_id', 'status', 'expires_at']);
            $table->index('organization_id');
            $table->index('organizer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donation_requests');
    }
};