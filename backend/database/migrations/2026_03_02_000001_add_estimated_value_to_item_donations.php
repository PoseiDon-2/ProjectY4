<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('item_donations', function (Blueprint $table) {
            $table->decimal('estimated_value', 12, 2)->nullable()->after('items_needed');
        });
    }

    public function down(): void
    {
        Schema::table('item_donations', function (Blueprint $table) {
            $table->dropColumn('estimated_value');
        });
    }
};
