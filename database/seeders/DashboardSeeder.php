<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * DashboardSeeder - Seeder untuk data Dashboard/Testing
 * 
 * Seeder ini TIDAK membuat data baru, melainkan memanggil seeder lain
 * untuk memastikan semua data yang dibutuhkan dashboard sudah tersedia.
 * 
 * Data yang dibutuhkan:
 * - Customers (untuk relasi Job Order, Delivery Order, Invoice)
 * - Drivers (untuk relasi Delivery Order)
 * - Vehicles (untuk fleet status)
 * - Vehicle Types (untuk vehicles)
 * - Job Orders (untuk KPI orders, charts orders_trend)
 * - Delivery Orders (untuk KPI deliveries, charts delivery_status, widgets)
 * - Invoices (untuk KPI revenue, widgets recent_activities)
 * - Manifests (optional, untuk data lengkap)
 */
class DashboardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Seeder ini akan memanggil seeder lain dalam urutan yang benar
     * untuk memastikan referential integrity terjaga.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting Dashboard Data Seeding...');

        // 1. Profile/Admin (untuk created_by)
        $this->command->info('  ✅ Seeding Profiles/Admin...');
        $this->call(ProfileSeeder::class);

        // 2. Customers (untuk Job Orders, Delivery Orders, Invoices)
        $this->command->info('  ✅ Seeding Customers...');
        $this->call(CustomerSeeder::class);

        // 3. Drivers (untuk Delivery Orders)
        $this->command->info('  ✅ Seeding Drivers...');
        $this->call(DriverSeeder::class);

        // 4. Vehicle Types (untuk Vehicles)
        $this->command->info('  ✅ Seeding Vehicle Types...');
        $this->call(VehicleTypeSeeder::class);

        // 5. Vehicles (untuk fleet status)
        $this->command->info('  ✅ Seeding Vehicles...');
        $this->call(VehicleSeeder::class);

        // 6. Job Orders (untuk KPI orders, charts)
        $this->command->info('  ✅ Seeding Job Orders...');
        $this->call(JobOrderSeeder::class);

        // 7. Manifests (optional, untuk data lengkap)
        $this->command->info('  ✅ Seeding Manifests...');
        $this->call(ManifestSeeder::class);

        // 8. Delivery Orders (untuk KPI deliveries, charts, widgets)
        $this->command->info('  ✅ Seeding Delivery Orders...');
        $this->call(DeliveryOrderSeeder::class);

        // 9. Invoices (untuk KPI revenue, widgets)
        $this->command->info('  ✅ Seeding Invoices...');
        $this->call(InvoiceSeeder::class);

        $this->command->info('✅ Dashboard Data Seeding Complete!');
        $this->command->newLine();
        $this->command->info('📊 Dashboard siap di-test di: http://127.0.0.1:8000/api/dashboard');
    }
}
