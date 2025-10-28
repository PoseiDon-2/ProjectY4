<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\VolunteerStatus;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('volunteer_applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('message');
            $table->longText('skills')->nullable();
            $table->text('experience')->nullable();
            $table->text('availability')->nullable();
            $table->enum('status', array_column(VolunteerStatus::cases(), 'value'))->default('APPLIED');
            $table->integer('hours_committed')->nullable();
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->uuid('volunteer_id');
            $table->uuid('request_id');
            $table->timestamps();

            $table->foreign('volunteer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('request_id')->references('id')->on('donation_requests')->onDelete('cascade');

            $table->index('status');
            $table->index('request_id');
            $table->index('volunteer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('volunteer_applications');
    }
};