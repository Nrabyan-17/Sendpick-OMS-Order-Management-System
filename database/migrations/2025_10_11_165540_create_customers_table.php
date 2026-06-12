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
        Schema::create('customers', function (Blueprint $table) {
            $table->string('customer_id')->primary(); // customer_id sebagai primary key string
            $table->string('customer_code')->unique(); // Kode unik Pelanggan
            $table->string('customer_name'); // Nama perusahaan Pelanggan
            $table->string('customer_type')->nullable(); // Tipe Pelanggan
            $table->string('contact_name')->nullable(); // Nama Kontak
            $table->string('phone')->nullable(); // Nomor telepon
            $table->string('email')->nullable(); // Email
            $table->text('address')->nullable(); // Alamat
            $table->string('status')->default('Aktif'); // Status
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};