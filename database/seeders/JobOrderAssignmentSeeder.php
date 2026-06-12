<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JobOrderAssignmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Cek apakah data sudah ada
        if (DB::table('job_order_assignments')->count() > 0) {
            $this->command->info('⚠️  Job Order Assignments already seeded. Skipping...');
            return;
        }

        // ✅ Ambil data yang benar dari database
        $jobOrders = DB::table('job_orders')->pluck('job_order_id')->toArray();
        $drivers = DB::table('drivers')->pluck('driver_id')->toArray();
        $vehicles = DB::table('vehicles')->pluck('vehicle_id')->toArray();

        if (empty($jobOrders) || empty($drivers) || empty($vehicles)) {
            $this->command->error('❌ Job Orders, Drivers, atau Vehicles belum ada! Jalankan seeder lain terlebih dahulu.');
            return;
        }

        // ✅ Sample assignments menggunakan data yang ada di database
        $assignments = [
            [
                'job_order_id' => $jobOrders[0] ?? 'JO-20251109-001',
                'driver_id' => $drivers[0] ?? 'DRV-001',
                'vehicle_id' => $vehicles[0] ?? 'VEH-001',
                'status' => 'Active',
                'notes' => 'Pengiriman rutin ke Jakarta Pusat',
                'assigned_at' => now()->subDays(2),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'job_order_id' => $jobOrders[1] ?? 'JO-20251109-002',
                'driver_id' => $drivers[1] ?? 'DRV-002',
                'vehicle_id' => $vehicles[1] ?? 'VEH-002',
                'status' => 'Active',
                'notes' => 'Pengiriman besar ke Tangerang',
                'assigned_at' => now()->subDays(1),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'job_order_id' => $jobOrders[2] ?? 'JO-20251109-003',
                'driver_id' => $drivers[2] ?? 'DRV-003',
                'vehicle_id' => $vehicles[2] ?? 'VEH-003',
                'status' => 'Completed',
                'notes' => 'Pengiriman ekspres selesai',
                'assigned_at' => now()->subDays(3),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert data
        DB::table('job_order_assignments')->insert($assignments);

        $this->command->info('✅ JobOrderAssignmentSeeder seeded successfully: ' . count($assignments) . ' assignments');
    }
}