<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration to upgrade decimal precision for payment-related columns.
 * 
 * Why: Using Decimal(15,2) instead of Decimal(10,2) ensures:
 * - Support for larger amounts (up to ~10 trillion IDR)
 * - Accurate decimal calculations without floating-point errors
 * - PostgreSQL NUMERIC type preserves exact precision for financial data
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Upgrade invoices table columns
        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('subtotal', 15, 2)->change();
            $table->decimal('tax_amount', 15, 2)->default(0)->change();
            $table->decimal('total_amount', 15, 2)->change();
            $table->decimal('paid_amount', 15, 2)->default(0)->change();
        });

        // Upgrade payments table column
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('amount', 15, 2)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert invoices table columns
        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('subtotal', 10, 2)->change();
            $table->decimal('tax_amount', 10, 2)->default(0)->change();
            $table->decimal('total_amount', 10, 2)->change();
            $table->decimal('paid_amount', 12, 2)->default(0)->change();
        });

        // Revert payments table column
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('amount', 10, 2)->change();
        });
    }
};
