<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Run the migrations.
     * 
     * Menambahkan kolom koordinat GPS untuk lokasi pickup dan delivery.
     * Kolom ini bersifat nullable karena data koordinat opsional.
     */
    public function up(): void
    {
        Schema::table('job_orders', function (Blueprint $table) {
            // Koordinat Pickup Location
            $table->decimal('pickup_lat', 10, 8)->nullable()->after('pickup_city');
            $table->decimal('pickup_lng', 11, 8)->nullable()->after('pickup_lat');
            
            // Koordinat Delivery Location
            $table->decimal('delivery_lat', 10, 8)->nullable()->after('delivery_city');
            $table->decimal('delivery_lng', 11, 8)->nullable()->after('delivery_lat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_orders', function (Blueprint $table) {
            $table->dropColumn([
                'pickup_lat',
                'pickup_lng',
                'delivery_lat',
                'delivery_lng'
            ]);
        });
    }
};
