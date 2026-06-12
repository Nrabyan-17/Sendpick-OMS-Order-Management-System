<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * GpsSeeder - Populate sample GPS tracking data untuk testing
 * 
 * Data yang di-generate:
 * - GPS logs untuk active drivers (status Available/On Duty)
 * - Tracking points dengan variasi lokasi
 * - Data recent (1-2 jam terakhir) untuk real-time testing
 */
class GpsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ✅ Skip jika data sudah ada
        if (DB::table('gps_tracking_logs')->count() > 0) {
            $this->command->info('⚠️  GPS Tracking Logs already seeded. Skipping...');
            return;
        }

        // Ambil data reference drivers dan vehicles yang aktif
        $drivers = DB::table('drivers')
            ->whereIn('status', ['Available', 'On Duty'])
            ->get();

        if ($drivers->isEmpty()) {
            $this->command->error('⚠️  Tidak ada driver dengan status Available/On Duty! Jalankan DriverSeeder terlebih dahulu.');
            return;
        }

        // Ambil vehicles untuk random assignment
        $vehicles = DB::table('vehicles')->pluck('vehicle_id')->toArray();

        if (empty($vehicles)) {
            $this->command->error('⚠️  Tidak ada data vehicles! Jalankan VehicleSeeder terlebih dahulu.');
            return;
        }

        // Ambil delivery orders yang active (optional untuk order_id)
        $activeDeliveryOrders = DB::table('delivery_orders')
            ->whereIn('status', ['Assigned', 'In Transit', 'At Destination'])
            ->get()
            ->keyBy('driver_id'); // Group by driver untuk faster lookup

        $this->command->info('🛰️  Generating GPS Tracking Logs...');
        
        $gpsLogs = [];
        $baseTime = Carbon::now()->subHours(2); // Data 2 jam ke belakang

        // Jakarta coordinate ranges (for realistic data)
        $jakartaLatBase = -6.2088;
        $jakartaLngBase = 106.8456;

        foreach ($drivers as $driver) {
            // Generate 20-30 tracking points per driver
            $pointsCount = rand(20, 30);
            $currentTime = $baseTime->copy();
            
            // Random starting point around Jakarta
            $currentLat = $jakartaLatBase + (rand(-100, 100) / 1000); // ±0.1 degree variance
            $currentLng = $jakartaLngBase + (rand(-100, 100) / 1000);

            // Assign random vehicle to this driver
            $assignedVehicle = $vehicles[array_rand($vehicles)];
            
            // Check if driver has active delivery order
            $activeOrder = $activeDeliveryOrders->get($driver->driver_id);

            for ($i = 0; $i < $pointsCount; $i++) {
                // Simulate movement (small increments)
                $currentLat += (rand(-10, 10) / 10000); // ±0.001 degree movement
                $currentLng += (rand(-10, 10) / 10000);
                
                // Time increment: 3-7 minutes between points
                $currentTime->addMinutes(rand(3, 7));

                $gpsLogs[] = [
                    'driver_id' => $driver->driver_id,
                    'vehicle_id' => $assignedVehicle,
                    'order_id' => $activeOrder ? $activeOrder->do_id : null,
                    'lat' => round($currentLat, 8),
                    'lng' => round($currentLng, 8),
                    'sent_at' => $currentTime->toDateTimeString(),
                    'received_at' => $currentTime->copy()->addSeconds(rand(1, 3))->toDateTimeString(),
                    'created_at' => $currentTime->toDateTimeString(),
                    'updated_at' => $currentTime->toDateTimeString(),
                ];
            }
        }

        DB::table('gps_tracking_logs')->insert($gpsLogs);
        
        $this->command->info('✅ Created ' . count($gpsLogs) . ' GPS Tracking Logs');
        $this->command->line('   - Drivers tracked: ' . $drivers->count());
        $this->command->line('   - Avg points per driver: ' . round(count($gpsLogs) / $drivers->count()));
        $this->command->line('   - Time range: ' . $baseTime->format('Y-m-d H:i') . ' to ' . Carbon::now()->format('Y-m-d H:i'));
    }
}
