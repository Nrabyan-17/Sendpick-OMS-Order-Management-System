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
        Schema::create('job_orders', function (Blueprint $table) {
            $table->string('job_order_id')->primary(); // job_order_id sebagai primary key string
            $table->string('customer_id'); // Foreign key ke tabel customers
            $table->foreign('customer_id')->references('customer_id')->on('customers')->onDelete('cascade');
            $table->string('order_type'); // Tipe Order (LTL/FTL)
            $table->string('status')->default('Created'); // Status: 
            $table->text('pickup_address'); // Alamat pickup
            $table->text('delivery_address'); // Alamat delivery
            $table->text('goods_desc'); // Deskripsi Barang
            $table->decimal('goods_weight', 8, 2)->default(0); // Berat barang
            $table->date('ship_date'); // Tanggal Kirim
            $table->decimal('order_value', 10, 2)->nullable(); // Nilai Order
            $table->string('created_by'); // Dibuat oleh (Admin user_id)
            $table->foreign('created_by')->references('user_id')->on('admin')->onDelete('cascade');
            $table->datetime('completed_at')->nullable(); // Tanggal selesai
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_orders');
    }
};