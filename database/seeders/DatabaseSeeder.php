<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ⚠️ URUTAN SEEDER PENTING! Perhatikan dependency antar tabel:
        // 1. Master data dulu (Role, Admin, Profile, Customer, VehicleType)
        // 2. Driver sebelum Vehicle (karena vehicles.driver_id -> drivers.driver_id)
        // 3. Job Order sebelum Manifest (karena manifest_jobs.job_order_id -> job_orders)
        // 4. Manifest sebelum Delivery Order (karena DO bisa dari manifest)
        $this->call([
            // Master Data
            RoleSeeder::class,
            AdminSeeder::class,
            ProfileSeeder::class,
            CustomerSeeder::class,
            VehicleTypeSeeder::class,
            
            // ✅ Driver HARUS sebelum Vehicle (karena vehicles.driver_id FK ke drivers)
            // Berhasil karena DriverSeeder dibuat terlebih dahulu, sebelum VehicleSeeder
            DriverSeeder::class, //  DriverSeeder dibuat terlebih dahulu, sebelum VehicleSeeder
            VehicleSeeder::class, // Baru Vehicle bisa reference ke Driver
            
            // Transactional Data
            JobOrderSeeder::class,
            JobOrderAssignmentSeeder::class,
            ManifestSeeder::class,
            DeliveryOrderSeeder::class,
            InvoiceSeeder::class,
            GpsSeeder::class,
            
            // Dashboard & Report
            DashboardSeeder::class,
            ReportSeeder::class,
        ]);
    }
}