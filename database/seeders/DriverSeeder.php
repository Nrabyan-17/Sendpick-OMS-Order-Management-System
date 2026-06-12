<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Drivers;
use Illuminate\Support\Facades\DB;

class DriverSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Cek apakah data sudah ada
        if (Drivers::count() > 0) {
            $this->command->info('⚠️  Drivers already seeded. Skipping...');
            return;
        }

        // ✅ Data sesuai catatan arsitektur + kolom baru dari migration terpisah
        $drivers = [
            [
                'driver_id' => 'DRV001',
                'driver_name' => 'Budi Santoso',
                'phone' => '081234567890',
                'email' => 'budi.santoso@sendpick.com',
                'password' => bcrypt('password123'),
                'status' => 'Aktif',
                'shift' => 'Pagi',
                'last_lat' => -6.200000, // Jakarta Pusat
                'last_lng' => 106.816666,
                'last_location_city' => 'Jakarta Pusat', // ✅ Kolom baru
                'delivery_count' => 45, // ✅ Kolom baru
                'fcm_token' => null, // ✅ Kolom baru (diisi saat login dari mobile app)
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'driver_id' => 'DRV002',
                'driver_name' => 'Ahmad Hidayat',
                'phone' => '081234567891',
                'email' => 'ahmad.hidayat@sendpick.com',
                'password' => bcrypt('password123'),
                'status' => 'Aktif',
                'shift' => 'Siang',
                'last_lat' => -6.175110, // Jakarta Timur
                'last_lng' => 106.865036,
                'last_location_city' => 'Jakarta Timur', // ✅ Kolom baru
                'delivery_count' => 32, // ✅ Kolom baru
                'fcm_token' => null, // ✅ Kolom baru
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'driver_id' => 'DRV003',
                'driver_name' => 'Eko Prasetyo',
                'phone' => '081234567892',
                'email' => 'eko.prasetyo@sendpick.com',
                'password' => bcrypt('password123'),
                'status' => 'Aktif',
                'shift' => 'Pagi',
                'last_lat' => -6.121435, // Jakarta Barat
                'last_lng' => 106.774124,
                'last_location_city' => 'Jakarta Barat', // ✅ Kolom baru
                'delivery_count' => 28, // ✅ Kolom baru
                'fcm_token' => null, // ✅ Kolom baru
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'driver_id' => 'DRV004',
                'driver_name' => 'Dedi Kurniawan',
                'phone' => '081234567893',
                'email' => 'dedi.kurniawan@sendpick.com',
                'password' => bcrypt('password123'),
                'status' => 'Aktif',
                'shift' => 'Malam',
                'last_lat' => -6.238270, // Bekasi
                'last_lng' => 106.975571,
                'last_location_city' => 'Bekasi', // ✅ Kolom baru
                'delivery_count' => 51, // ✅ Kolom baru
                'fcm_token' => null, // ✅ Kolom baru
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'driver_id' => 'DRV005',
                'driver_name' => 'Slamet Riyadi',
                'phone' => '081234567894',
                'email' => 'slamet.riyadi@sendpick.com',
                'password' => bcrypt('password123'),
                'status' => 'Tidak Aktif',
                'shift' => null,
                'last_lat' => -6.597147, // Bogor
                'last_lng' => 106.806039,
                'last_location_city' => 'Bogor', // ✅ Kolom baru
                'delivery_count' => 15, // ✅ Kolom baru
                'fcm_token' => null, // ✅ Kolom baru
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert data
        DB::table('drivers')->insert($drivers);

        $this->command->info('✅ DriverSeeder seeded successfully: ' . count($drivers) . ' drivers');
    }
}
