<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Migrate old status values to new standardized values:
     * 
     * DRIVERS:
     * - 'Aktif' -> 'Available' (or 'Off Duty' depending on business logic)
     * - 'aktif' -> 'Available'
     * - 'active' -> 'Available'
     * 
     * VEHICLES:
     * - 'Aktif' -> 'Available'
     * - 'aktif' -> 'Available'
     */
    public function up(): void
    {
        // Update Driver statuses
        DB::table('drivers')
            ->whereIn('status', ['Aktif', 'aktif', 'active'])
            ->update(['status' => 'Available']);

        // Log the update
        $driversUpdated = DB::table('drivers')
            ->where('status', 'Available')
            ->count();
        
        // Update Vehicle statuses
        DB::table('vehicles')
            ->whereIn('status', ['Aktif', 'aktif', 'active'])
            ->update(['status' => 'Available']);

        // Log the update
        $vehiclesUpdated = DB::table('vehicles')
            ->where('status', 'Available')
            ->count();

        \Log::info("[MIGRATION] Updated driver/vehicle statuses. Drivers with 'Available': {$driversUpdated}, Vehicles with 'Available': {$vehiclesUpdated}");
    }

    /**
     * Reverse the migrations.
     * 
     * Note: This rollback will convert all 'Available' statuses back to 'Aktif'.
     * This may not be accurate if some records were already 'Available' before migration.
     */
    public function down(): void
    {
        // Rollback Driver statuses
        DB::table('drivers')
            ->where('status', 'Available')
            ->update(['status' => 'Aktif']);

        // Rollback Vehicle statuses
        DB::table('vehicles')
            ->where('status', 'Available')
            ->update(['status' => 'Aktif']);

        \Log::info("[MIGRATION ROLLBACK] Reverted driver/vehicle statuses back to 'Aktif'");
    }
};
