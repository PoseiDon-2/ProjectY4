<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedTinyInteger('donor_trust_level')->default(1)->after('donation_count');
            $table->unsignedInteger('donor_trust_score')->default(0)->after('donor_trust_level');
            $table->unsignedTinyInteger('organizer_trust_level')->default(1)->after('donor_trust_score');
            $table->unsignedInteger('organizer_trust_score')->default(0)->after('organizer_trust_level');
            $table->timestamp('trust_calculated_at')->nullable()->after('organizer_trust_score');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'donor_trust_level',
                'donor_trust_score',
                'organizer_trust_level',
                'organizer_trust_score',
                'trust_calculated_at',
            ]);
        });
    }
};
