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
        Schema::create('delivery_orders', function (Blueprint $table) {
            $table->string('do_id')->primary(); // do_id sebagai primary key string
            $table->string('source_type'); // Tipe Sumber (JO atau MF)
            $table->string('source_id'); // ID dari JO atau MF
            $table->string('customer_id'); // Foreign key ke customers
            $table->foreign('customer_id')->references('customer_id')->on('customers')->onDelete('cascade');
            $table->string('status')->default('Pending'); // Status
            $table->date('do_date'); // Tanggal DO
            $table->date('delivered_date')->nullable(); // Tanggal terkirim
            $table->text('goods_summary'); // Ringkasan barang
            $table->string('priority')->nullable(); // Prioritas
            $table->string('temperature')->nullable(); // Suhu
            $table->string('created_by'); // Dibuat oleh (menggunakan user_id dari admin)
            $table->foreign('created_by')->references('user_id')->on('admin')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_orders');
    }
};
