<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\UserRole;
use App\Enums\UserStatus;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            // 1. สร้าง id เป็น uuid ก่อน
            $table->uuid('id')->primary();

            // 2. คอลัมน์อื่น ๆ
            $table->string('email')->unique();
            $table->string('avatar')->nullable();
            $table->string('password');
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('phone')->nullable();
            $table->text('bio')->nullable();
            $table->enum('role', ['DONOR', 'ORGANIZER', 'ADMIN'])->default('DONOR');
            $table->enum('status', ['ACTIVE', 'INACTIVE', 'SUSPENDED'])->default('ACTIVE');
            $table->double('total_donated')->default(0);
            $table->integer('donation_count')->default(0);
            $table->longText('customization')->nullable();
            $table->uuid('organization_id')->nullable();
            $table->longText('preferred_categories')->nullable();
            $table->string('id_card_url')->nullable();
            $table->boolean('is_email_verified')->default(false);
            $table->string('organization_cert_url')->nullable();
            $table->boolean('documents_verified')->default(false);
            $table->string('location')->nullable();
            $table->double('latitude')->nullable();
            $table->double('longitude')->nullable();
            $table->timestamps();

            // 3. Foreign key
            $table->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('set null');

            // 4. Indexes
            $table->index('email');
            $table->index('organization_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
