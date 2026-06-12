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
        Schema::create('payments', function (Blueprint $table) {
                $table->id();
                // Foreign Key:
                $table->string('invoice_id');
                $table->foreign('invoice_id')
                    ->references('invoice_id')->on('invoices')
                    ->onDelete('cascade'); // Jika invoice dihapus, payment ikut terhapus (aman)

                // 3. Data Utama Pembayaran (Sesuai Screenshot Tabel UI Anda)
                $table->decimal('amount', 10, 2); // Nominal yang dibayar kali ini
                $table->date('payment_date');     // Tampil di kolom 'Payment' pada UI
                $table->string('payment_method'); // Contoh: 'Bank Transfer', 'Cash' (Tampil di UI)
                
                // 5. Audit Trail (Siapa yang input?)
                $table->string('created_by'); 
                // Asumsi tabel admin menggunakan user_id string
                $table->foreign('created_by')->references('user_id')->on('admin'); 
                
                $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};