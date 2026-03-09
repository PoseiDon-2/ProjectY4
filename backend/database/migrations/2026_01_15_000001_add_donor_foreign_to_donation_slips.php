<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('donation_slips', function (Blueprint $table) {
            $table->foreign('donor_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('donation_slips', function (Blueprint $table) {
            $table->dropForeign(['donor_id']);
        });
    }
};
