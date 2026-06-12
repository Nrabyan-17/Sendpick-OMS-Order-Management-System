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
        Schema::table('job_orders', function (Blueprint $table) {
            $table->string('pickup_city')->nullable()->after('pickup_address');
            $table->string('delivery_city')->nullable()->after('delivery_address');
            $table->decimal('goods_volume', 10, 2)->nullable()->after('goods_weight');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_orders', function (Blueprint $table) {
            $table->dropColumn(['pickup_city', 'delivery_city', 'goods_volume']);
        });
    }
};
