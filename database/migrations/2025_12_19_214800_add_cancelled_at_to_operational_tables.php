<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration untuk menambahkan kolom cancelled_at ke tabel operasional
 * 
 * Tujuan: Tracking waktu pembatalan untuk audit trail
 * Tabel yang diupdate:
 * - job_orders: cancelled_at untuk tracking kapan JO dibatalkan
 * - manifests: cancelled_at untuk tracking kapan Manifest dibatalkan
 * - delivery_orders: cancelled_at untuk tracking kapan DO dibatalkan
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add cancelled_at to job_orders
        Schema::table('job_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('job_orders', 'cancelled_at')) {
                $table->datetime('cancelled_at')->nullable();
            }
            if (!Schema::hasColumn('job_orders', 'cancellation_reason')) {
                $table->string('cancellation_reason')->nullable();
            }
        });

        // Add cancelled_at to manifests
        Schema::table('manifests', function (Blueprint $table) {
            if (!Schema::hasColumn('manifests', 'cancelled_at')) {
                $table->datetime('cancelled_at')->nullable();
            }
            if (!Schema::hasColumn('manifests', 'cancellation_reason')) {
                $table->string('cancellation_reason')->nullable();
            }
        });

        // Add cancelled_at to delivery_orders
        Schema::table('delivery_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('delivery_orders', 'cancelled_at')) {
                $table->datetime('cancelled_at')->nullable();
            }
            if (!Schema::hasColumn('delivery_orders', 'cancellation_reason')) {
                $table->string('cancellation_reason')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_orders', function (Blueprint $table) {
            $table->dropColumn(['cancelled_at', 'cancellation_reason']);
        });

        Schema::table('manifests', function (Blueprint $table) {
            $table->dropColumn(['cancelled_at', 'cancellation_reason']);
        });

        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->dropColumn(['cancelled_at', 'cancellation_reason']);
        });
    }
};
