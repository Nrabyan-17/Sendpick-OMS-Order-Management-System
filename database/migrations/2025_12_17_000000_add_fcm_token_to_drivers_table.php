<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan kolom fcm_token untuk Firebase Cloud Messaging (Push Notification)
     */
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->string('fcm_token', 500)->nullable()->after('last_location_city');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn('fcm_token');
        });
    }
};