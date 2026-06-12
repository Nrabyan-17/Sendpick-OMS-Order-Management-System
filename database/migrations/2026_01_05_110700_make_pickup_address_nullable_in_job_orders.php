<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Mengubah kolom pickup_address menjadi nullable karena
     * Job Order hanya memerlukan delivery address (alamat tujuan).
     */
    public function up(): void
    {
        Schema::table('job_orders', function (Blueprint $table) {
            $table->text('pickup_address')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_orders', function (Blueprint $table) {
            $table->text('pickup_address')->nullable(false)->change();
        });
    }
};
