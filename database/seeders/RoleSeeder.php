<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // ✅ Skip jika data sudah ada
        if (DB::table('roles')->count() > 0) {
            $this->command->info('⚠️  Roles already seeded. Skipping...');
            return;
        }

        $roles = [
            [
                'name' => 'Super Admin',
                'description' => 'Full system access - dapat melakukan CRUD pada semua data',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Admin',
                'description' => 'Akses terbatas - hanya dapat melihat data tanpa akses CRUD',
                'created_at' => now(),
                'updated_at' => now()
            ],
        ];

        DB::table('roles')->insert($roles);

        $this->command->info('✅ Roles seeded successfully: ' . count($roles) . ' records added.');
    }
}