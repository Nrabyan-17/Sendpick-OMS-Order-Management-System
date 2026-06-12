<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Menambahkan kolom departure_date (Tanggal Keberangkatan) dan eta (Estimasi Waktu Tiba)
     * pada tabel delivery_orders sesuai permintaan user.
     */
    public function up(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            // Tanggal Keberangkatan - waktu keberangkatan armada
            $table->timestamp('departure_date')->nullable()->after('do_date');
            
            // ETA - Estimasi Waktu Tiba
            $table->timestamp('eta')->nullable()->after('departure_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->dropColumn(['departure_date', 'eta']);
        });
    }
};
