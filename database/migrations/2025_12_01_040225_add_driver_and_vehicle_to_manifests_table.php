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
        Schema::table('manifests', function (Blueprint $table) {
            if (!Schema::hasColumn('manifests', 'driver_id')) {
                $table->string('driver_id')->nullable()->after('planned_arrival');
                $table->foreign('driver_id')->references('driver_id')->on('drivers')->onDelete('set null');
            }
            if (!Schema::hasColumn('manifests', 'vehicle_id')) {
                $table->string('vehicle_id')->nullable()->after('driver_id');
                $table->foreign('vehicle_id')->references('vehicle_id')->on('vehicles')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('manifests', function (Blueprint $table) {
            $table->dropForeign(['driver_id']);
            $table->dropForeign(['vehicle_id']);
            $table->dropColumn(['driver_id', 'vehicle_id']);
        });
    }
};