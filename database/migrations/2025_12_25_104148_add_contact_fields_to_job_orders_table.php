<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add contact information fields:
     * - pickup_contact: Nama kontak di lokasi pickup
     * - pickup_phone: Nomor telepon kontak pickup
     * - recipient_name: Nama penerima di lokasi tujuan
     * - recipient_phone: Nomor telepon penerima
     */
    public function up(): void
    {
        Schema::table('job_orders', function (Blueprint $table) {
            // Pickup contact information
            $table->string('pickup_contact')->nullable()->after('pickup_lng');
            $table->string('pickup_phone')->nullable()->after('pickup_contact');
            
            // Recipient/Delivery contact information
            $table->string('recipient_name')->nullable()->after('delivery_lng');
            $table->string('recipient_phone')->nullable()->after('recipient_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_orders', function (Blueprint $table) {
            $table->dropColumn([
                'pickup_contact',
                'pickup_phone',
                'recipient_name',
                'recipient_phone'
            ]);
        });
    }
};
