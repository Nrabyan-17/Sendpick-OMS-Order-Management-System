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
        Schema::create('admin', function (Blueprint $table) {
            $table->string('user_id')->primary(); // user_id sebagai primary key string
            $table->string('name'); // Nama admin
            $table->string('email')->unique(); // Email
            $table->string('password'); // Password
            $table->timestamp('email_verified_at')->nullable(); // Email verification timestamp
            $table->rememberToken(); // Remember token for "remember me" functionality

            $table->string('phone', 20)->nullable(); // Nomor telepon
            $table->string('address')->nullable(); // Alamat
            $table->string('photo')->nullable(); // Foto profil

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin');
    }
};