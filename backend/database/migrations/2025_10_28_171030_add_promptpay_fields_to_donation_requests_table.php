<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('donation_requests', function (Blueprint $table) {
            $table->string('promptpay_number')->nullable()->after('payment_methods');
            $table->longText('promptpay_qr')->nullable()->after('promptpay_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('donation_requests', function (Blueprint $table) {
            $table->dropColumn(['promptpay_number', 'promptpay_qr']);
        });
    }
};
