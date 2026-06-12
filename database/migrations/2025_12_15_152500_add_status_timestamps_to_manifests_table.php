<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds timestamp columns for tracking manifest status transitions:
     * - departed_at: When manifest status changed to 'In Transit'
     * - arrived_at: When manifest status changed to 'Arrived'
     * - completed_at: When manifest status changed to 'Completed'
     */
    public function up(): void
    {
        Schema::table('manifests', function (Blueprint $table) {
            $table->datetime('departed_at')->nullable()->after('status');
            $table->datetime('arrived_at')->nullable()->after('departed_at');
            $table->datetime('completed_at')->nullable()->after('arrived_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('manifests', function (Blueprint $table) {
            $table->dropColumn(['departed_at', 'arrived_at', 'completed_at']);
        });
    }
};