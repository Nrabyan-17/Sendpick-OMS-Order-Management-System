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
        Schema::create('manifests', function (Blueprint $table) {
            $table->string('manifest_id')->primary(); // manifest_id sebagai primary key string
            $table->string('origin_city'); // Kota asal
            $table->string('dest_city'); // Kota tujuan

            // 3. Data Operasional (Driver & Kendaraan)
            // PENTING: Harus nullable karena assignment bisa menyusul
            $table->string('driver_id')->nullable(); 
            $table->foreign('driver_id')->references('driver_id')->on('drivers');

            $table->string('vehicle_id')->nullable(); 
            $table->foreign('vehicle_id')->references('vehicle_id')->on('vehicles');

            $table->text('cargo_summary')->nullable(); // Ringkasan kargo (Packages)
            $table->decimal('cargo_weight', 8, 2)->nullable(); // Total berat (Total Weight)
            $table->datetime('planned_departure')->nullable(); // Tanggal berangkat (Shipment Date)
            $table->datetime('planned_arrival')->nullable(); // Tanggal tiba
            $table->string('status')->default('Pending'); // Status
            $table->string('created_by'); // Dibuat oleh (admin user_id string format)
            $table->foreign('created_by')->references('user_id')->on('admin')->onDelete('cascade');
            $table->timestamps();
            // Kurang Manifest Value
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manifests');
    }
};