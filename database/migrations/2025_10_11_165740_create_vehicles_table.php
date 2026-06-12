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
        Schema::create('vehicles', function (Blueprint $table) {
            $table->string('vehicle_id')->primary(); // vehicle_id sebagai primary key string
            $table->string('plate_no')->unique(); // Nomor Plat
            $table->foreignId('vehicle_type_id')->constrained('vehicle_types')->onDelete('cascade'); // Foreign key ke vehicle_types
            $table->string('brand')->nullable(); // Merk (misal: Mitsubishi)
            $table->string('model')->nullable(); // Model Kendaraan
            $table->smallInteger('year')->nullable(); // Tahun
            $table->string('capacity_label')->nullable(); // Kapasitas
            $table->integer('odometer_km')->default(0); // Kilometer
            $table->string('status')->default('Aktif'); // Status
            $table->string('condition_label')->default('Baik'); // Kondisi Kendaraan
            $table->tinyInteger('fuel_level_pct')->default(0); // Fuel Level (%)
            $table->date('last_maintenance_date')->nullable(); // Tanggal maintenance terakhir
            $table->date('next_maintenance_date')->nullable(); // Tanggal maintenance berikutnya
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
