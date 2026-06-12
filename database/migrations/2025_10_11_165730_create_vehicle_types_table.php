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
        Schema::create('vehicle_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Nama Tipe
            $table->text('description')->nullable(); // Deskripsi
            $table->decimal('capacity_min_kg', 8, 2)->nullable(); // Kapasitas minimum (kg)
            $table->decimal('capacity_max_kg', 8, 2)->nullable(); // Kapasitas maksimum (kg)
            $table->decimal('volume_min_m3', 8, 2)->nullable(); // Volume minimum (m³)
            $table->decimal('volume_max_m3', 8, 2)->nullable(); // Volume maksimum (m³)
            $table->string('status')->default('Aktif'); // Status
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_types');
    }
};