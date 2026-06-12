<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ManifestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ✅ Skip jika data sudah ada
        if (DB::table('manifests')->count() > 0) {
            $this->command->info('⚠️  Manifests already seeded. Skipping...');
            return;
        }

        // ✅ Cek apakah admin sudah ada
        $adminExists = DB::table('admin')->where('user_id', 'ADM001')->exists();

        if (!$adminExists) {
            $this->command->error('❌ Admin ADM001 not found. Please seed ProfileSeeder first!');
            
            // Show available admins
            $this->command->warn('Available admins:');
            $admins = DB::table('admin')->select('user_id', 'name')->get();
            foreach ($admins as $admin) {
                $this->command->line("  - user_id: {$admin->user_id}, name: {$admin->name}");
            }
            
            return;
        }

        // Data Manifests - Grouping beberapa Job Order jadi satu Manifest + kolom baru
        $manifests = [

            [
                'manifest_id' => 'MAN-20251109-001',
                'origin_city' => 'Jakarta',
                'dest_city' => 'Bandung',
                'cargo_summary' => 'Elektronik - Laptop Dell 15 unit, Monitor LG 10 unit, Keyboard & Mouse 25 set',
                'cargo_weight' => 500.00,
                'planned_departure' => Carbon::now()->addHours(2),
                'planned_arrival' => Carbon::now()->addHours(6),
                'driver_id' => 'DRV001', // ✅ Kolom baru - terhubung ke Budi Santoso
                'vehicle_id' => 'VEH001', // ✅ Kolom baru - terhubung ke Mitsubishi Colt Diesel
                'status' => 'Pending',
                'departed_at' => null, // ✅ Kolom baru
                'arrived_at' => null, // ✅ Kolom baru
                'completed_at' => null, // ✅ Kolom baru
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'manifest_id' => 'MAN-20251109-002',
                'origin_city' => 'Jakarta',
                'dest_city' => 'Surabaya',
                'cargo_summary' => 'Dokumen Penting - Kontrak & Proposal 50 Box, File Legal 30 Box',
                'cargo_weight' => 250.00,
                'planned_departure' => Carbon::now()->addHours(4),
                'planned_arrival' => Carbon::now()->addHours(12),
                'driver_id' => 'DRV002', // ✅ Kolom baru - terhubung ke Ahmad Hidayat
                'vehicle_id' => 'VEH002', // ✅ Kolom baru - terhubung ke Hino Ranger
                'status' => 'In Transit',
                'departed_at' => Carbon::now()->subHours(1), // ✅ Kolom baru - sudah berangkat
                'arrived_at' => null, // ✅ Kolom baru
                'completed_at' => null, // ✅ Kolom baru
                'created_by' => 'ADM001',
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(1),
            ],

            [
                'manifest_id' => 'MAN-20251109-003',
                'origin_city' => 'Bandung',
                'dest_city' => 'Yogyakarta',
                'cargo_summary' => 'Buku - Novel 200 pcs, Majalah 150 pcs, Komik 100 pcs',
                'cargo_weight' => 300.00,
                'planned_departure' => Carbon::now()->addDay(),
                'planned_arrival' => Carbon::now()->addDays(2),
                'driver_id' => null, // ✅ Kolom baru - belum assign driver
                'vehicle_id' => null, // ✅ Kolom baru - belum assign vehicle
                'status' => 'Pending',
                'departed_at' => null, // ✅ Kolom baru
                'arrived_at' => null, // ✅ Kolom baru
                'completed_at' => null, // ✅ Kolom baru
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'manifest_id' => 'MAN-20251109-004',
                'origin_city' => 'Jakarta',
                'dest_city' => 'Semarang',
                'cargo_summary' => 'Fashion - Kaos 500 pcs, Celana Jeans 300 pcs, Jaket 200 pcs',
                'cargo_weight' => 450.00,
                'planned_departure' => Carbon::now(),
                'planned_arrival' => Carbon::now()->addHours(8),
                'driver_id' => 'DRV003', // ✅ Kolom baru - terhubung ke Eko Prasetyo
                'vehicle_id' => 'VEH003', // ✅ Kolom baru - terhubung ke Toyota Hilux
                'status' => 'In Transit',
                'departed_at' => Carbon::now()->subHours(2), // ✅ Kolom baru - sudah berangkat
                'arrived_at' => null, // ✅ Kolom baru
                'completed_at' => null, // ✅ Kolom baru
                'created_by' => 'ADM001',
                'created_at' => now()->subHours(3),
                'updated_at' => now()->subHour(),
            ],

            [
                'manifest_id' => 'MAN-20251109-005',
                'origin_city' => 'Surabaya',
                'dest_city' => 'Bali',
                'cargo_summary' => 'Makanan - Snack 100 box, Minuman 200 box, Mie Instan 150 box',
                'cargo_weight' => 600.00,
                'planned_departure' => Carbon::now()->subDay(),
                'planned_arrival' => Carbon::now()->subHours(6),
                'driver_id' => 'DRV004', // ✅ Kolom baru - terhubung ke Dedi Kurniawan
                'vehicle_id' => 'VEH004', // ✅ Kolom baru - terhubung ke Mitsubishi Fuso
                'status' => 'Delivered',
                'departed_at' => Carbon::now()->subDay(), // ✅ Kolom baru
                'arrived_at' => Carbon::now()->subHours(8), // ✅ Kolom baru
                'completed_at' => Carbon::now()->subHours(6), // ✅ Kolom baru
                'created_by' => 'ADM001',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subHours(6),
            ],

            [
                'manifest_id' => 'MAN-20251108-001',
                'origin_city' => 'Jakarta',
                'dest_city' => 'Medan',
                'cargo_summary' => 'Furniture - Meja Kantor 50 unit, Kursi 100 unit, Lemari 30 unit',
                'cargo_weight' => 1500.00,
                'planned_departure' => Carbon::now()->subDays(3),
                'planned_arrival' => Carbon::now()->subDay(),
                'driver_id' => 'DRV001', // ✅ Kolom baru
                'vehicle_id' => 'VEH001', // ✅ Kolom baru
                'status' => 'Delivered',
                'departed_at' => Carbon::now()->subDays(3), // ✅ Kolom baru
                'arrived_at' => Carbon::now()->subDays(2), // ✅ Kolom baru
                'completed_at' => Carbon::now()->subDay(), // ✅ Kolom baru
                'created_by' => 'ADM001',
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDay(),
            ],

            [
                'manifest_id' => 'MAN-20251108-002',
                'origin_city' => 'Bandung',
                'dest_city' => 'Jakarta',
                'cargo_summary' => 'Pakaian - Dress 100 pcs, Kemeja 80 pcs, Rok 60 pcs',
                'cargo_weight' => 180.00,
                'planned_departure' => Carbon::now()->addDay(),
                'planned_arrival' => Carbon::now()->addDays(2),
                'driver_id' => null, // ✅ Kolom baru - dibatalkan, tidak ada driver
                'vehicle_id' => null, // ✅ Kolom baru
                'status' => 'Cancelled',
                'departed_at' => null, // ✅ Kolom baru
                'arrived_at' => null, // ✅ Kolom baru
                'completed_at' => null, // ✅ Kolom baru
                'created_by' => 'ADM001',
                'created_at' => now()->subHours(12),
                'updated_at' => now()->subHours(10),
            ],

            [
                'manifest_id' => 'MAN-20251109-006',
                'origin_city' => 'Jakarta',
                'dest_city' => 'Makassar',
                'cargo_summary' => 'Peralatan IT - Server 10 unit, Network Equipment 50 box, Kabel & Aksesoris',
                'cargo_weight' => 800.00,
                'planned_departure' => Carbon::now()->addDays(2),
                'planned_arrival' => Carbon::now()->addDays(4),
                'driver_id' => null, // ✅ Kolom baru - belum assign
                'vehicle_id' => null, // ✅ Kolom baru
                'status' => 'Pending',
                'departed_at' => null, // ✅ Kolom baru
                'arrived_at' => null, // ✅ Kolom baru
                'completed_at' => null, // ✅ Kolom baru
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'manifest_id' => 'MAN-20251109-007',
                'origin_city' => 'Surabaya',
                'dest_city' => 'Jakarta',
                'cargo_summary' => 'Spare Parts - Komponen Mobil 200 pcs, Aki 50 unit, Ban 30 unit',
                'cargo_weight' => 950.00,
                'planned_departure' => Carbon::now()->addHours(6),
                'planned_arrival' => Carbon::now()->addHours(14),
                'driver_id' => 'DRV002', // ✅ Kolom baru
                'vehicle_id' => 'VEH002', // ✅ Kolom baru
                'status' => 'Pending',
                'departed_at' => null, // ✅ Kolom baru
                'arrived_at' => null, // ✅ Kolom baru
                'completed_at' => null, // ✅ Kolom baru
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'manifest_id' => 'MAN-20251109-008',
                'origin_city' => 'Jakarta',
                'dest_city' => 'Palembang',
                'cargo_summary' => 'Material Bangunan - Semen 100 sak, Cat 50 kaleng, Paku 200 box',
                'cargo_weight' => 2500.00,
                'planned_departure' => Carbon::now()->addHours(3),
                'planned_arrival' => Carbon::now()->addHours(10),
                'driver_id' => 'DRV004', // ✅ Kolom baru
                'vehicle_id' => 'VEH004', // ✅ Kolom baru
                'status' => 'Loading',
                'departed_at' => null, // ✅ Kolom baru
                'arrived_at' => null, // ✅ Kolom baru
                'completed_at' => null, // ✅ Kolom baru
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now(),
            ],

        ];

        DB::table('manifests')->insert($manifests);

        $this->command->info('✅ Manifests seeded successfully.');

    }
}