<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DeliveryOrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ✅ Skip jika data sudah ada
        if (DB::table('delivery_orders')->count() > 0) {
            $this->command->info('⚠️  Delivery Orders already seeded. Skipping...');
            return;
        }

        // ✅ Cek apakah ada customer, job order, manifest, dan admin
        $customersExist = DB::table('customers')->exists();
        $jobOrdersExist = DB::table('job_orders')->exists();
        $manifestsExist = DB::table('manifests')->exists();
        $adminExists = DB::table('admin')->where('user_id', 'ADM001')->exists();

        if (!$customersExist) {
            $this->command->error('❌ No customers found. Please seed CustomerSeeder first!');
            return;
        }

        if (!$jobOrdersExist && !$manifestsExist) {
            $this->command->error('❌ No job orders or manifests found. Please seed JobOrderSeeder and ManifestSeeder first!');
            return;
        }

        if (!$adminExists) {
            $this->command->error('❌ Admin ADM001 not found. Please seed ProfileSeeder first!');
            return;
        }

        // ✅ Get existing data
        $customers = DB::table('customers')->pluck('customer_id')->toArray();
        $jobOrders = DB::table('job_orders')->pluck('job_order_id')->toArray();
        $manifests = DB::table('manifests')->pluck('manifest_id')->toArray();

        // Data Delivery Orders - Campuran dari Job Order dan Manifest
        $deliveryOrders = [

            // ✅ Delivery Order dari Job Order (JO)
            [
                'do_id' => 'DO-20251110-001',
                'source_type' => 'JO',
                'source_id' => !empty($jobOrders) ? $jobOrders[0] : 'JO-20251109-001',
                'customer_id' => $customers[0] ?? 'CUST001',
                'status' => 'Pending',
                'do_date' => Carbon::now()->format('Y-m-d'),
                'departure_date' => Carbon::now()->addHours(2), // ✅ Kolom baru
                'eta' => Carbon::now()->addHours(6), // ✅ Kolom baru
                'delivered_date' => null,
                'goods_summary' => 'Elektronik - Laptop Dell 15 unit, Aksesoris IT',
                'priority' => 'Normal',
                'temperature' => 'Ambient',
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'do_id' => 'DO-20251110-002',
                'source_type' => 'JO',
                'source_id' => !empty($jobOrders) && isset($jobOrders[1]) ? $jobOrders[1] : 'JO-20251109-002',
                'customer_id' => $customers[1] ?? 'CUST002',
                'status' => 'In Progress',
                'do_date' => Carbon::now()->subDays(1)->format('Y-m-d'),
                'departure_date' => Carbon::now()->subDays(1)->addHours(3), // ✅ Kolom baru
                'eta' => Carbon::now()->subDays(1)->addHours(10), // ✅ Kolom baru
                'delivered_date' => null,
                'goods_summary' => 'Furniture - Meja Kantor 50 unit, Kursi 100 unit',
                'priority' => 'High',
                'temperature' => 'Ambient',
                'created_by' => 'ADM001',
                'created_at' => now()->subDays(1),
                'updated_at' => now(),
            ],

            [
                'do_id' => 'DO-20251110-003',
                'source_type' => 'JO',
                'source_id' => !empty($jobOrders) && isset($jobOrders[2]) ? $jobOrders[2] : 'JO-20251109-003',
                'customer_id' => $customers[2] ?? 'CUST003',
                'status' => 'Delivered',
                'do_date' => Carbon::now()->subDays(3)->format('Y-m-d'),
                'departure_date' => Carbon::now()->subDays(3)->addHours(4), // ✅ Kolom baru
                'eta' => Carbon::now()->subDays(2)->addHours(8), // ✅ Kolom baru
                'delivered_date' => Carbon::now()->subDays(1)->format('Y-m-d'),
                'goods_summary' => 'Pakaian - Fashion Items 500 pcs',
                'priority' => 'Normal',
                'temperature' => 'Ambient',
                'created_by' => 'ADM001',
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDays(1),
            ],

            // ✅ Delivery Order dari Manifest (MF)
            // ✅ Delivery Order dari Manifest (MF)
            [
                'do_id' => 'DO-20251110-004',
                'source_type' => 'MF',
                'source_id' => !empty($manifests) ? $manifests[0] : 'MF-20251109-001',
                'customer_id' => $customers[0] ?? 'CUST001',
                'status' => 'Pending',
                'do_date' => Carbon::now()->format('Y-m-d'),
                'departure_date' => Carbon::now()->addHours(4), // ✅ Kolom baru
                'eta' => Carbon::now()->addHours(12), // ✅ Kolom baru
                'delivered_date' => null,
                'goods_summary' => 'Makanan Beku - Frozen Food 100 kg',
                'priority' => 'High',
                'temperature' => 'Cold',
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'do_id' => 'DO-20251110-005',
                'source_type' => 'MF',
                'source_id' => !empty($manifests) && isset($manifests[1]) ? $manifests[1] : 'MF-20251109-002',
                'customer_id' => $customers[1] ?? 'CUST002',
                'status' => 'In Progress',
                'do_date' => Carbon::now()->subDays(2)->format('Y-m-d'),
                'departure_date' => Carbon::now()->subDays(2)->addHours(5), // ✅ Kolom baru
                'eta' => Carbon::now()->subDay()->addHours(3), // ✅ Kolom baru
                'delivered_date' => null,
                'goods_summary' => 'Buku - Educational Books 200 pcs',
                'priority' => 'Normal',
                'temperature' => 'Ambient',
                'created_by' => 'ADM001',
                'created_at' => now()->subDays(2),
                'updated_at' => now(),
            ],

            [
                'do_id' => 'DO-20251110-006',
                'source_type' => 'MF',
                'source_id' => !empty($manifests) && isset($manifests[2]) ? $manifests[2] : 'MF-20251109-003',
                'customer_id' => $customers[2] ?? 'CUST003',
                'status' => 'Delivered',
                'do_date' => Carbon::now()->subDays(4)->format('Y-m-d'),
                'departure_date' => Carbon::now()->subDays(4)->addHours(6), // ✅ Kolom baru
                'eta' => Carbon::now()->subDays(3)->addHours(2), // ✅ Kolom baru
                'delivered_date' => Carbon::now()->subDays(2)->format('Y-m-d'),
                'goods_summary' => 'Obat-obatan - Medical Supplies',
                'priority' => 'High',
                'temperature' => 'Cool',
                'created_by' => 'ADM001',
                'created_at' => now()->subDays(4),
                'updated_at' => now()->subDays(2),
            ],

            [
                'do_id' => 'DO-20251110-011',
                'source_type' => 'MF',
                'source_id' => !empty($manifests) && isset($manifests[1]) ? $manifests[1] : 'MAN-20251109-002',
                'customer_id' => $customers[1] ?? 'CUST002',
                'status' => 'Pending',
                'do_date' => Carbon::now()->addDay()->format('Y-m-d'),
                'departure_date' => Carbon::now()->addDay()->addHours(6), // ✅ Kolom baru
                'eta' => Carbon::now()->addDays(2)->addHours(8), // ✅ Kolom baru
                'delivered_date' => null,
                'goods_summary' => 'Manifest Grouping - Multiple Job Orders Jakarta-Surabaya',
                'priority' => 'Normal',
                'temperature' => 'Ambient',
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'do_id' => 'DO-20251109-001',
                'source_type' => 'MF',
                'source_id' => !empty($manifests) && isset($manifests[2]) ? $manifests[2] : 'MAN-20251109-003',
                'customer_id' => $customers[2] ?? 'CUST003',
                'status' => 'Delivered',
                'do_date' => Carbon::now()->subDays(5)->format('Y-m-d'),
                'departure_date' => Carbon::now()->subDays(5)->addHours(3), // ✅ Kolom baru
                'eta' => Carbon::now()->subDays(4)->addHours(6), // ✅ Kolom baru
                'delivered_date' => Carbon::now()->subDays(2)->format('Y-m-d'),
                'goods_summary' => 'Manifest Grouping - Multiple Job Orders Bandung-Yogyakarta',
                'priority' => 'High',
                'temperature' => 'Ambient',
                'created_by' => 'ADM001',
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(2),
            ],

            // ✅ Delivery Orders dengan Priority dan Temperature berbeda
            [
                'do_id' => 'DO-20251110-012',
                'source_type' => 'JO',
                'source_id' => !empty($jobOrders) && isset($jobOrders[3]) ? $jobOrders[3] : 'JO-20251109-004',
                'customer_id' => $customers[0] ?? 'CUST001',
                'status' => 'Pending',
                'do_date' => Carbon::now()->addDays(2)->format('Y-m-d'),
                'departure_date' => Carbon::now()->addDays(2)->addHours(4), // ✅ Kolom baru
                'eta' => Carbon::now()->addDays(2)->addHours(10), // ✅ Kolom baru
                'delivered_date' => null,
                'goods_summary' => 'Makanan Beku - Ice Cream 200 box, Frozen Food 150 box',
                'priority' => 'Urgent',
                'temperature' => 'Cold (-18°C)',
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Mix dari JO dan MF
            [
                'do_id' => 'DO-20251110-007',
                'source_type' => 'JO',
                'source_id' => !empty($jobOrders) && isset($jobOrders[3]) ? $jobOrders[3] : 'JO-20251109-004',
                'customer_id' => $customers[0] ?? 'CUST001',
                'status' => 'Cancelled',
                'do_date' => Carbon::now()->subDays(5)->format('Y-m-d'),
                'departure_date' => null, // ✅ Kolom baru - dibatalkan
                'eta' => null, // ✅ Kolom baru - dibatalkan
                'delivered_date' => null,
                'goods_summary' => 'Spare Parts - Automotive Parts',
                'priority' => 'Normal',
                'temperature' => 'Ambient',
                'created_by' => 'ADM001',
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(3),
            ],

            [
                'do_id' => 'DO-20251110-008',
                'source_type' => 'MF',
                'source_id' => !empty($manifests) && isset($manifests[3]) ? $manifests[3] : 'MF-20251109-004',
                'customer_id' => $customers[1] ?? 'CUST002',
                'status' => 'Pending',
                'do_date' => Carbon::now()->format('Y-m-d'),
                'departure_date' => Carbon::now()->addHours(8), // ✅ Kolom baru
                'eta' => Carbon::now()->addHours(16), // ✅ Kolom baru
                'delivered_date' => null,
                'goods_summary' => 'Alat Tulis - Stationery 300 pcs',
                'priority' => 'Low',
                'temperature' => 'Ambient',
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'do_id' => 'DO-20251110-009',
                'source_type' => 'JO',
                'source_id' => !empty($jobOrders) && isset($jobOrders[4]) ? $jobOrders[4] : 'JO-20251109-005',
                'customer_id' => $customers[2] ?? 'CUST003',
                'status' => 'Delivered',
                'do_date' => Carbon::now()->subDays(6)->format('Y-m-d'),
                'departure_date' => Carbon::now()->subDays(6)->addHours(5), // ✅ Kolom baru
                'eta' => Carbon::now()->subDays(5)->addHours(4), // ✅ Kolom baru
                'delivered_date' => Carbon::now()->subDays(3)->format('Y-m-d'),
                'goods_summary' => 'Kosmetik - Beauty Products 200 items',
                'priority' => 'High',
                'temperature' => 'Cool',
                'created_by' => 'ADM001',
                'created_at' => now()->subDays(6),
                'updated_at' => now()->subDays(3),
            ],

            [
                'do_id' => 'DO-20251110-010',
                'source_type' => 'MF',
                'source_id' => !empty($manifests) && isset($manifests[4]) ? $manifests[4] : 'MF-20251109-005',
                'customer_id' => $customers[0] ?? 'CUST001',
                'status' => 'In Progress',
                'do_date' => Carbon::now()->subDays(1)->format('Y-m-d'),
                'departure_date' => Carbon::now()->subDays(1)->addHours(4), // ✅ Kolom baru
                'eta' => Carbon::now()->addHours(2), // ✅ Kolom baru
                'delivered_date' => null,
                'goods_summary' => 'Peralatan Dapur - Kitchen Equipment',
                'priority' => 'Normal',
                'temperature' => 'Ambient',
                'created_by' => 'ADM001',
                'created_at' => now()->subDays(1),
                'updated_at' => now(),
            ],

            [
                'do_id' => 'DO-20251110-013',
                'source_type' => 'MF',
                'source_id' => !empty($manifests) && isset($manifests[3]) ? $manifests[3] : 'MAN-20251109-004',
                'customer_id' => $customers[2] ?? 'CUST003',
                'status' => 'Cancelled',
                'do_date' => Carbon::now()->subDays(2)->format('Y-m-d'),
                'departure_date' => null, // ✅ Kolom baru - dibatalkan
                'eta' => null, // ✅ Kolom baru - dibatalkan
                'delivered_date' => null,
                'goods_summary' => 'Manifest Cancelled - Customer Request',
                'priority' => 'Low',
                'temperature' => 'Ambient',
                'created_by' => 'ADM001',
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDay(),
            ],

            [
                'do_id' => 'DO-20251109-002',
                'source_type' => 'JO',
                'source_id' => !empty($jobOrders) && isset($jobOrders[5]) ? $jobOrders[5] : 'JO-20251109-006',
                'customer_id' => $customers[0] ?? 'CUST001',
                'status' => 'Delivered',
                'do_date' => Carbon::now()->subDays(7)->format('Y-m-d'),
                'departure_date' => Carbon::now()->subDays(7)->addHours(2), // ✅ Kolom baru
                'eta' => Carbon::now()->subDays(6)->addHours(10), // ✅ Kolom baru
                'delivered_date' => Carbon::now()->subDays(4)->format('Y-m-d'),
                'goods_summary' => 'Dokumen Penting - Kontrak & Legal Documents',
                'priority' => 'Urgent',
                'temperature' => 'Ambient',
                'created_by' => 'ADM001',
                'created_at' => now()->subDays(7),
                'updated_at' => now()->subDays(4),
            ],

            // ✅ Delivery Order dengan status "In Transit"
            [
                'do_id' => 'DO-20251110-014',
                'source_type' => 'JO',
                'source_id' => !empty($jobOrders) && isset($jobOrders[0]) ? $jobOrders[0] : 'JO-20251109-001',
                'customer_id' => $customers[1] ?? 'CUST002',
                'status' => 'In Transit',
                'do_date' => Carbon::now()->subHours(6)->format('Y-m-d'),
                'departure_date' => Carbon::now()->subHours(4), // ✅ Sudah berangkat 4 jam lalu
                'eta' => Carbon::now()->addHours(3), // ✅ Estimasi tiba 3 jam lagi
                'delivered_date' => null,
                'goods_summary' => 'Elektronik - Server Equipment & Network Devices',
                'priority' => 'High',
                'temperature' => 'Ambient',
                'created_by' => 'ADM001',
                'created_at' => now()->subHours(8),
                'updated_at' => now()->subHours(4),
            ],

        ];

        DB::table('delivery_orders')->insert($deliveryOrders);

        $this->command->info('✅ Delivery Orders seeded successfully: ' . count($deliveryOrders) . ' records added.');
    }
}
