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
        Schema::create('job_order_assignments', function (Blueprint $table) {
            $table->bigIncrements('assignment_id'); // assignment_id sebagai primary key
            $table->string('job_order_id'); // Foreign key ke tabel job_orders
            $table->foreign('job_order_id')->references('job_order_id')->on('job_orders')->onDelete('cascade');
            $table->string('driver_id'); // Foreign key ke tabel drivers
            $table->foreign('driver_id')->references('driver_id')->on('drivers')->onDelete('cascade');
            $table->string('vehicle_id'); // Foreign key ke tabel vehicles
            $table->foreign('vehicle_id')->references('vehicle_id')->on('vehicles')->onDelete('cascade');
            $table->string('status')->nullable(); // Status: "Active", "Standby"
            $table->text('notes')->nullable(); // Catatan
            $table->datetime('assigned_at'); // Waktu assignment
            $table->timestamps();

            // Indexes
            $table->index('job_order_id');
            $table->index('driver_id');
            $table->index('vehicle_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_order_assignments');
    }
};
