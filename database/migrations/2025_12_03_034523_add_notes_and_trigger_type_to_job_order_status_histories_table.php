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
        Schema::table('job_order_status_histories', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('status');
            $table->string('trigger_type')->default('user')->after('notes'); // user, system
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_order_status_histories', function (Blueprint $table) {
            $table->dropColumn(['notes', 'trigger_type']);
        });
    }
};
