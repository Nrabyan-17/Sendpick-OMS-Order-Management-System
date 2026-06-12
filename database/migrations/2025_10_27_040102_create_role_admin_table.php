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
        Schema::create('role_admin', function (Blueprint $table) {
            $table->bigIncrements('id'); // id sebagai primary key
            $table->string('user_id'); // Foreign key ke admin
            $table->foreign('user_id')->references('user_id')->on('admin')->onDelete('cascade');
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade'); // Foreign key ke roles
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_admin');
    }
};
