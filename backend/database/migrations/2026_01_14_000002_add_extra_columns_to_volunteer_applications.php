<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('volunteer_applications', function (Blueprint $table) {
            if (!Schema::hasColumn('volunteer_applications', 'volunteer_phone')) {
                $table->string('volunteer_phone')->nullable();
            }
            if (!Schema::hasColumn('volunteer_applications', 'volunteer_email')) {
                $table->string('volunteer_email')->nullable();
            }
            if (!Schema::hasColumn('volunteer_applications', 'age')) {
                $table->integer('age')->nullable();
            }
            if (!Schema::hasColumn('volunteer_applications', 'emergency_contact')) {
                $table->string('emergency_contact')->nullable();
            }
            if (!Schema::hasColumn('volunteer_applications', 'emergency_phone')) {
                $table->string('emergency_phone')->nullable();
            }
            if (!Schema::hasColumn('volunteer_applications', 'has_vehicle')) {
                $table->boolean('has_vehicle')->default(false);
            }
            if (!Schema::hasColumn('volunteer_applications', 'vehicle_type')) {
                $table->string('vehicle_type')->nullable();
            }
            if (!Schema::hasColumn('volunteer_applications', 'available_dates')) {
                $table->json('available_dates')->nullable();
            }
            if (!Schema::hasColumn('volunteer_applications', 'preferred_time')) {
                $table->string('preferred_time')->nullable();
            }
            if (!Schema::hasColumn('volunteer_applications', 'duration')) {
                $table->string('duration')->nullable();
            }
            if (!Schema::hasColumn('volunteer_applications', 'estimated_hours')) {
                $table->integer('estimated_hours')->nullable();
            }
            if (!Schema::hasColumn('volunteer_applications', 'skill_details')) {
                $table->text('skill_details')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('volunteer_applications', function (Blueprint $table) {
            $columns = [
                'volunteer_phone', 'volunteer_email', 'age', 'emergency_contact', 'emergency_phone',
                'has_vehicle', 'vehicle_type', 'available_dates', 'preferred_time', 'duration',
                'estimated_hours', 'skill_details'
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('volunteer_applications', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
