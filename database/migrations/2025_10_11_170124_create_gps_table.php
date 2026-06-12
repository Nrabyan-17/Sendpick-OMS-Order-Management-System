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
        Schema::create('gps_tracking_logs', function (Blueprint $table) {
            $table->id();
            $table->string('driver_id'); // Foreign key ke drivers
            $table->foreign('driver_id')->references('driver_id')->on('drivers')->onDelete('cascade');
            $table->string('vehicle_id')->nullable(); // FK ke vehicles.vehicle_id
            $table->foreign('vehicle_id')->references('vehicle_id')->on('vehicles')->onDelete('set null');
            $table->string('order_id')->nullable(); // ID JO atau DO yang sedang aktif
            $table->decimal('lat', 10, 8); // Latitude
            $table->decimal('lng', 11, 8); // Longitude
            $table->datetime('sent_at'); // Waktu dari HP driver
            $table->timestamp('received_at')->useCurrent(); // Waktu diterima server
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gps_tracking_logs');
    }
};
