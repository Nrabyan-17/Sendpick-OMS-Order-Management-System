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
        Schema::create('invoices', function (Blueprint $table) {
            $table->string('invoice_id')->primary(); // invoice_id sebagai primary key string
            $table->string('source_type'); // Tipe sumber ('JO', 'MF', 'DO')
            $table->string('source_id'); // ID sumber
            $table->string('customer_id'); // Foreign key ke customers
            $table->foreign('customer_id')->references('customer_id')->on('customers')->onDelete('cascade');
            $table->date('invoice_date'); // Tanggal invoice
            $table->date('due_date'); // Tanggal jatuh tempo
            $table->decimal('subtotal', 10, 2); // Subtotal
            $table->decimal('tax_amount', 10, 2)->default(0); // Jumlah pajak
            $table->decimal('total_amount', 10, 2); // Total amount
            $table->string('status')->default('Pending'); // Status: 'Pending', 'Paid', 'Overdue'
            $table->text('notes')->nullable(); // Catatan
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
        Schema::dropIfExists('invoices');
    }
};