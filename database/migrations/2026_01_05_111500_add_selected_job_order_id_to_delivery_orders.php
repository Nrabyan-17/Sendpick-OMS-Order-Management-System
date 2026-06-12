<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Menambahkan kolom selected_job_order_id untuk skenario LTL
     * dimana DO dibuat dari Manifest tapi untuk Job Order spesifik.
     */
    public function up(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            // Kolom untuk menyimpan Job Order ID yang dipilih dari Manifest (untuk LTL)
            $table->string('selected_job_order_id')->nullable()->after('source_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->dropColumn('selected_job_order_id');
        });
    }
};
