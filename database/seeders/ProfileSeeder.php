<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProfileSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Cek apakah data sudah ada
        if (DB::table('admin')->count() > 0) {
            $this->command->info('⚠️  Admin/Profiles already seeded. Skipping...');
            return;
        }

        // Data admin dengan profile lengkap
        $admins = [
            [
                'user_id' => 'ADM001',
                'name' => 'Super Admin System',
                'email' => 'admin@sendpick.com',
                'password' => bcrypt('password123'),
                'email_verified_at' => now(),
                'remember_token' => null,
                'phone' => '081234567890',
                'address' => 'Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10220',
                'photo' => null, // Atau 'profiles/admin001.jpg'
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert data
        DB::table('admin')->insert($admins);

        $this->command->info('✅ ProfileSeeder (Admin) seeded successfully: ' . count($admins) . ' users');
    }
}
