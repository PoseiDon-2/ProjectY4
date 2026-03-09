<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('donation_requests', function (Blueprint $table) {
            $table->json('pending_updates')->nullable()->after('status');
            // เก็บข้อมูล JSON ของฟิลด์ที่จะแก้ไข
        });
    }

    public function down()
    {
        Schema::table('donation_requests', function (Blueprint $table) {
            $table->dropColumn('pending_updates');
        });
    }
};
