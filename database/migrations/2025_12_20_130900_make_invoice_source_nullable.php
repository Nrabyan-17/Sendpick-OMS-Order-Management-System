<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Make source_type and source_id nullable in invoices table
 * 
 * Reason: When an invoice is cancelled, we clear these fields to
 * "release" the Job Order/Manifest/DO so it can be used for a new invoice.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('source_type')->nullable()->change();
            $table->string('source_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('source_type')->nullable(false)->change();
            $table->string('source_id')->nullable(false)->change();
        });
    }
};
