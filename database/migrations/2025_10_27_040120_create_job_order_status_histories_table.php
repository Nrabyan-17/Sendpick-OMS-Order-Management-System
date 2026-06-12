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
        Schema::create('job_order_status_histories', function (Blueprint $table) {
            $table->bigIncrements('history_id'); // history_id sebagai primary key
            $table->string('job_order_id'); // Foreign key ke job_orders
            $table->foreign('job_order_id')->references('job_order_id')->on('job_orders')->onDelete('cascade');
            $table->string('status'); // Status
            $table->string('changed_by'); // 'System', 'Admin', 'Driver'
            $table->datetime('changed_at'); // Waktu perubahan
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_order_status_histories');
    }
};
