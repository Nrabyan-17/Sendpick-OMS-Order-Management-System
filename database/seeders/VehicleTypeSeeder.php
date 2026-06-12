<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VehicleTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Cek apakah data sudah ada
        if (DB::table('vehicle_types')->count() > 0) {
            $this->command->info('⚠️  Vehicle types already seeded. Skipping...');
            return;
        }

        // ✅ Data sesuai dengan migration vehicle_types
        $vehicleTypes = [
            [
                // 'id' => 1,
                'name' => 'Truk Engkel',
                'description' => 'Truk ringan untuk muatan sedang, ideal untuk distribusi lokal',
                'capacity_min_kg' => 3000.00,
                'capacity_max_kg' => 5000.00,
                'volume_min_m3' => 10.00,
                'volume_max_m3' => 15.00,
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                // 'id' => 2,
                'name' => 'Truk Tronton',
                'description' => 'Truk berat dengan kapasitas besar untuk muatan industri',
                'capacity_min_kg' => 12000.00,
                'capacity_max_kg' => 20000.00,
                'volume_min_m3' => 30.00,
                'volume_max_m3' => 50.00,
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                // 'id' => 3,
                'name' => 'Pick Up',
                'description' => 'Kendaraan pick up untuk muatan ringan dan cepat',
                'capacity_min_kg' => 500.00,
                'capacity_max_kg' => 1000.00,
                'volume_min_m3' => 2.00,
                'volume_max_m3' => 5.00,
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                // 'id' => 4,
                'name' => 'Blind Van',
                'description' => 'Van tertutup untuk kargo yang membutuhkan perlindungan',
                'capacity_min_kg' => 1000.00,
                'capacity_max_kg' => 2000.00,
                'volume_min_m3' => 5.00,
                'volume_max_m3' => 10.00,
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                // 'id' => 5,
                'name' => 'Truk Fuso',
                'description' => 'Truk Mitsubishi Fuso untuk muatan menengah-berat',
                'capacity_min_kg' => 6000.00,
                'capacity_max_kg' => 10000.00,
                'volume_min_m3' => 20.00,
                'volume_max_m3' => 30.00,
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert data ke tabel vehicle_types di database
        DB::table('vehicle_types')->insert($vehicleTypes);

        $this->command->info('✅ VehicleTypeSeeder seeded successfully: ' . count($vehicleTypes) . ' types');
    }
}