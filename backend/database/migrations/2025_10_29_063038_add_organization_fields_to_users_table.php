<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('organization_name')->nullable()->after('role');
            $table->string('organization_type')->nullable()->after('organization_name');
            // organization_id มีอยู่แล้ว ไม่ต้องเพิ่ม
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['organization_name', 'organization_type']);
        });
    }
};
