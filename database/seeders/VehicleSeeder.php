<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vehicles;
use Illuminate\Support\Facades\DB;

class VehicleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Cek apakah data sudah ada
        if (Vehicles::count() > 0) {
            $this->command->info('⚠️  Vehicles already seeded. Skipping...');
            return;
        }

        // ✅ Data sesuai dengan migration vehicles + kolom baru dari migration terpisah
        $vehicles = [
            [
                'vehicle_id' => 'VEH001',
                'plate_no' => 'B 1234 ABC',
                'vehicle_type_id' => 1, // Truk Engkel
                'brand' => 'Mitsubishi',
                'model' => 'Colt Diesel FE 74',
                'year' => 2020,
                'capacity_label' => '5 Ton',
                'odometer_km' => 15000,
                'status' => 'Aktif',
                'condition_label' => 'Baik',
                'driver_id' => 'DRV001', // ✅ Kolom baru - terhubung ke Budi Santoso
                'fuel_level_pct' => 80,
                'last_maintenance_date' => '2025-10-15',
                'next_maintenance_date' => '2025-12-15',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vehicle_id' => 'VEH002',
                'plate_no' => 'B 5678 DEF',
                'vehicle_type_id' => 2, // Truk Tronton
                'brand' => 'Hino',
                'model' => 'Ranger FL 235',
                'year' => 2021,
                'capacity_label' => '15 Ton',
                'odometer_km' => 8000,
                'status' => 'Aktif',
                'condition_label' => 'Sangat Baik',
                'driver_id' => 'DRV002', // ✅ Kolom baru - terhubung ke Ahmad Hidayat
                'fuel_level_pct' => 90,
                'last_maintenance_date' => '2025-10-20',
                'next_maintenance_date' => '2025-12-20',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vehicle_id' => 'VEH003',
                'plate_no' => 'B 9012 GHI',
                'vehicle_type_id' => 3, // Pick Up
                'brand' => 'Toyota',
                'model' => 'Hilux Double Cabin',
                'year' => 2019,
                'capacity_label' => '1 Ton',
                'odometer_km' => 45000,
                'status' => 'Aktif',
                'condition_label' => 'Baik',
                'driver_id' => 'DRV003', // ✅ Kolom baru - terhubung ke Eko Prasetyo
                'fuel_level_pct' => 60,
                'last_maintenance_date' => '2025-09-10',
                'next_maintenance_date' => '2025-11-10',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vehicle_id' => 'VEH004',
                'plate_no' => 'B 3456 JKL',
                'vehicle_type_id' => 5, // Truk Fuso
                'brand' => 'Mitsubishi',
                'model' => 'Fuso Fighter FM 517',
                'year' => 2022,
                'capacity_label' => '8 Ton',
                'odometer_km' => 5000,
                'status' => 'Aktif',
                'condition_label' => 'Sangat Baik',
                'driver_id' => 'DRV004', // ✅ Kolom baru - terhubung ke Dedi Kurniawan
                'fuel_level_pct' => 100,
                'last_maintenance_date' => '2025-10-25',
                'next_maintenance_date' => '2025-12-25',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vehicle_id' => 'VEH005',
                'plate_no' => 'B 7890 MNO',
                'vehicle_type_id' => 4, // Blind Van
                'brand' => 'Daihatsu',
                'model' => 'Gran Max Blind Van',
                'year' => 2021,
                'capacity_label' => '1.5 Ton',
                'odometer_km' => 20000,
                'status' => 'Tidak Aktif',
                'condition_label' => 'Perlu Perbaikan',
                'driver_id' => null, // ✅ Kolom baru - kendaraan tidak aktif, tidak ada driver
                'fuel_level_pct' => 30,
                'last_maintenance_date' => '2025-08-01',
                'next_maintenance_date' => '2025-10-01',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert data
        DB::table('vehicles')->insert($vehicles);

        $this->command->info('✅ VehicleSeeder seeded successfully: ' . count($vehicles) . ' vehicles');
    }
}