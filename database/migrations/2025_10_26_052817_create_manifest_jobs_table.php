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
        Schema::create('manifest_jobs', function (Blueprint $table) {
            $table->bigIncrements('id'); // id sebagai primary key
            $table->string('manifest_id'); // Foreign key ke manifests
            $table->foreign('manifest_id')->references('manifest_id')->on('manifests')->onDelete('cascade');
            $table->string('job_order_id'); // Foreign key ke job_orders
            $table->foreign('job_order_id')->references('job_order_id')->on('job_orders')->onDelete('cascade');

            // Mencegah Duplikasi: Satu JO tidak boleh masuk 2x di manifest yg sama
    $table->unique(['manifest_id', 'job_order_id']);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manifest_jobs');
    }
};
