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
        Schema::create('proof_of_deliveries', function (Blueprint $table) {
            $table->bigIncrements('pod_id'); // pod_id sebagai primary key
            $table->string('job_order_id'); // Foreign key ke job_orders
            $table->foreign('job_order_id')->references('job_order_id')->on('job_orders')->onDelete('cascade');
            $table->string('photo_url')->nullable(); // URL foto bukti kirim
            $table->string('signature_url')->nullable(); // URL tanda tangan
            $table->datetime('uploaded_at'); // Waktu upload
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proof_of_deliveries');
    }
};
