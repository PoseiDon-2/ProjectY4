<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change type column from enum to string to support new values
        DB::statement('ALTER TABLE organizations MODIFY COLUMN type VARCHAR(50) DEFAULT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to old enum values
        DB::statement("ALTER TABLE organizations MODIFY COLUMN type ENUM('NGO','CHARITY','FOUNDATION','GOVERNMENT','TEMPLE','OTHER') DEFAULT 'OTHER'");
    }
};
