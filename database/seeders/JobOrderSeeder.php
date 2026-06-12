<?php

namespace Database\Seeders;

use App\Models\JobOrder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class JobOrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        // ✅ Cek apakah data sudah ada
        if (DB::table('job_orders')->count() > 0) {
            $this->command->info('⚠️  Job Orders already seeded. Skipping...');
            return;
        }

        // ✅ Pastikan master data sudah ada
        $customerExists = DB::table('customers')->where('customer_id', 'CUST001')->exists();
        $adminExists = DB::table('admin')->where('user_id', 'ADM001')->exists();

        if (!$customerExists) {
            $this->command->error('❌ Customer CUST001 not found. Please seed CustomerSeeder first!');

            $this->command->warn('Available Customers:');
            $customers = DB::table('customers')->select('customer_id', 'customer_code', 'customer_name')->get();
            foreach ($customers as $customer) {
                $this->command->line("- ID: {$customer->customer_id}, Code: {$customer->customer_code}, Name: {$customer->customer_name}");
            }

            return;
        }

        if (!$adminExists) {
            $this->command->error('❌ Admin ADM001 not found. Please seed AdminSeeder/ProfileSeeder first!');
            return;
        }

        // ✅ Data job orders SESUAI MIGRATION + kolom baru dari migration terpisah
        $jobOrders = [
            // Job Order 1 - Created (Order Type: LTL)
            [
                'job_order_id' => 'JO-20251109-001',
                'customer_id' => 'CUST001',
                'order_type' => 'LTL', // ✅ Less Than Truckload
                'status' => 'Created',
                'pickup_address' => 'Jl. Sudirman No. 123, Blok A, Jakarta Pusat, DKI Jakarta 10220',
                'pickup_city' => 'Jakarta Pusat', // ✅ Kolom baru
                'pickup_lat' => -6.2088, // ✅ Kolom baru
                'pickup_lng' => 106.8456, // ✅ Kolom baru
                'pickup_contact' => 'Pak Agus', // ✅ Kolom baru
                'pickup_phone' => '081234567001', // ✅ Kolom baru
                'delivery_address' => 'Jl. Gatot Subroto No. 456, Gedung B Lt. 3, Jakarta Selatan, DKI Jakarta 12930',
                'delivery_city' => 'Jakarta Selatan', // ✅ Kolom baru
                'delivery_lat' => -6.2297, // ✅ Kolom baru
                'delivery_lng' => 106.8295, // ✅ Kolom baru
                'recipient_name' => 'Ibu Sari', // ✅ Kolom baru
                'recipient_phone' => '081234567101', // ✅ Kolom baru
                'goods_desc' => 'Elektronik - Laptop Dell 15 unit, Monitor LG 10 unit, Keyboard & Mouse 25 set',
                'goods_qty' => 50, // ✅ Kolom baru
                'goods_weight' => 500.00, // kg
                'goods_volume' => 2.5, // ✅ Kolom baru (m³)
                'ship_date' => Carbon::now()->addDay()->format('Y-m-d'),
                'order_value' => 15000000.00, // Rp 15 juta
                'created_by' => 'ADM001',
                'completed_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Job Order 2 - Assigned (Order Type: FTL)
            [
                'job_order_id' => 'JO-20251109-002',
                'customer_id' => 'CUST002',
                'order_type' => 'FTL', // ✅ Full Truckload
                'status' => 'Assigned',
                'pickup_address' => 'Jl. Thamrin No. 789, Warehouse B, Jakarta Pusat, DKI Jakarta 10230',
                'pickup_city' => 'Jakarta Pusat', // ✅ Kolom baru
                'pickup_lat' => -6.1954, // ✅ Kolom baru
                'pickup_lng' => 106.8233, // ✅ Kolom baru
                'pickup_contact' => 'Pak Budi', // ✅ Kolom baru
                'pickup_phone' => '081234567002', // ✅ Kolom baru
                'delivery_address' => 'Jl. Kuningan No. 321, Office Tower 25th Floor, Jakarta Selatan, DKI Jakarta 12950',
                'delivery_city' => 'Jakarta Selatan', // ✅ Kolom baru
                'delivery_lat' => -6.2274, // ✅ Kolom baru
                'delivery_lng' => 106.8317, // ✅ Kolom baru
                'recipient_name' => 'Pak Darmawan', // ✅ Kolom baru
                'recipient_phone' => '081234567102', // ✅ Kolom baru
                'goods_desc' => 'Dokumen Penting - Kontrak & Proposal 50 Box, File Legal 30 Box',
                'goods_qty' => 80, // ✅ Kolom baru
                'goods_weight' => 250.00, // kg
                'goods_volume' => 1.2, // ✅ Kolom baru (m³)
                'ship_date' => Carbon::now()->format('Y-m-d'),
                'order_value' => 5000000.00, // Rp 5 juta
                'created_by' => 'ADM001',
                'completed_at' => null,
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(1),
            ],

            // Job Order 3 - Picked Up (Order Type: LTL)
            [
                'job_order_id' => 'JO-20251109-003',
                'customer_id' => 'CUST003',
                'order_type' => 'LTL',
                'status' => 'Picked Up',
                'pickup_address' => 'Jl. Merdeka No. 111, Ruko Makmur, Jakarta Barat, DKI Jakarta 11220',
                'pickup_city' => 'Jakarta Barat', // ✅ Kolom baru
                'pickup_lat' => -6.1667, // ✅ Kolom baru
                'pickup_lng' => 106.7833, // ✅ Kolom baru
                'pickup_contact' => 'Ibu Rina', // ✅ Kolom baru
                'pickup_phone' => '081234567003', // ✅ Kolom baru
                'delivery_address' => 'Jl. Asia Afrika No. 222, Toko Buku Gramedia, Jakarta Timur, DKI Jakarta 13330',
                'delivery_city' => 'Jakarta Timur', // ✅ Kolom baru
                'delivery_lat' => -6.2146, // ✅ Kolom baru
                'delivery_lng' => 106.9022, // ✅ Kolom baru
                'recipient_name' => 'Pak Hendra', // ✅ Kolom baru
                'recipient_phone' => '081234567103', // ✅ Kolom baru
                'goods_desc' => 'Buku - Novel 200 pcs, Majalah 150 pcs, Komik 100 pcs',
                'goods_qty' => 450, // ✅ Kolom baru
                'goods_weight' => 300.00, // kg
                'goods_volume' => 1.8, // ✅ Kolom baru (m³)
                'ship_date' => Carbon::now()->format('Y-m-d'),
                'order_value' => 8000000.00, // Rp 8 juta
                'created_by' => 'ADM001',
                'completed_at' => null,
                'created_at' => now()->subHours(3),
                'updated_at' => now()->subMinutes(30),
            ],

            // Job Order 4 - In Transit (Order Type: FTL)
            [
                'job_order_id' => 'JO-20251109-004',
                'customer_id' => 'CUST001',
                'order_type' => 'FTL',
                'status' => 'In Transit',
                'pickup_address' => 'Jl. Kebon Jeruk No. 333, Pabrik Tekstil ABC, Jakarta Barat, DKI Jakarta 11530',
                'pickup_city' => 'Jakarta Barat', // ✅ Kolom baru
                'pickup_lat' => -6.1879, // ✅ Kolom baru
                'pickup_lng' => 106.7653, // ✅ Kolom baru
                'pickup_contact' => 'Pak Wahyu', // ✅ Kolom baru
                'pickup_phone' => '081234567004', // ✅ Kolom baru
                'delivery_address' => 'Jl. Cikini No. 444, Mall Fashion Center, Jakarta Pusat, DKI Jakarta 10330',
                'delivery_city' => 'Jakarta Pusat', // ✅ Kolom baru
                'delivery_lat' => -6.1871, // ✅ Kolom baru
                'delivery_lng' => 106.8413, // ✅ Kolom baru
                'recipient_name' => 'Ibu Dewi', // ✅ Kolom baru
                'recipient_phone' => '081234567104', // ✅ Kolom baru
                'goods_desc' => 'Fashion - Kaos 500 pcs, Celana Jeans 300 pcs, Jaket 200 pcs',
                'goods_qty' => 1000, // ✅ Kolom baru
                'goods_weight' => 450.00, // kg
                'goods_volume' => 3.5, // ✅ Kolom baru (m³)
                'ship_date' => Carbon::now()->format('Y-m-d'),
                'order_value' => 25000000.00, // Rp 25 juta
                'created_by' => 'ADM001',
                'completed_at' => null,
                'created_at' => now()->subHours(5),
                'updated_at' => now()->subHour(),
            ],

            // Job Order 5 - Delivered (Order Type: LTL)
            [
                'job_order_id' => 'JO-20251109-005',
                'customer_id' => 'CUST002',
                'order_type' => 'LTL',
                'status' => 'Delivered',
                'pickup_address' => 'Jl. Raya Bogor No. 555, Pabrik Makanan XYZ, Jakarta Timur, DKI Jakarta 13750',
                'pickup_city' => 'Jakarta Timur', // ✅ Kolom baru
                'pickup_lat' => -6.2812, // ✅ Kolom baru
                'pickup_lng' => 106.8455, // ✅ Kolom baru
                'pickup_contact' => 'Pak Joko', // ✅ Kolom baru
                'pickup_phone' => '081234567005', // ✅ Kolom baru
                'delivery_address' => 'Jl. Pancoran No. 666, Supermarket ABC, Jakarta Selatan, DKI Jakarta 12780',
                'delivery_city' => 'Jakarta Selatan', // ✅ Kolom baru
                'delivery_lat' => -6.2505, // ✅ Kolom baru
                'delivery_lng' => 106.8445, // ✅ Kolom baru
                'recipient_name' => 'Pak Santoso', // ✅ Kolom baru
                'recipient_phone' => '081234567105', // ✅ Kolom baru
                'goods_desc' => 'Makanan - Snack 100 box, Minuman 200 box, Mie Instan 150 box',
                'goods_qty' => 450, // ✅ Kolom baru
                'goods_weight' => 600.00, // kg
                'goods_volume' => 4.2, // ✅ Kolom baru (m³)
                'ship_date' => Carbon::now()->subDay()->format('Y-m-d'),
                'order_value' => 12000000.00, // Rp 12 juta
                'created_by' => 'ADM001',
                'completed_at' => null,
                'created_at' => now()->subHours(6),
                'updated_at' => now()->subMinutes(15),
            ],

            // Job Order 6 - Completed (Order Type: FTL)
            [
                'job_order_id' => 'JO-20251108-001',
                'customer_id' => 'CUST003',
                'order_type' => 'FTL',
                'status' => 'Completed',
                'pickup_address' => 'Surabaya - Jl. Basuki Rahmat No. 100, Gudang Central',
                'pickup_city' => 'Surabaya', // ✅ Kolom baru
                'pickup_lat' => -7.2575, // ✅ Kolom baru
                'pickup_lng' => 112.7521, // ✅ Kolom baru
                'pickup_contact' => 'Pak Hartono', // ✅ Kolom baru
                'pickup_phone' => '081234567006', // ✅ Kolom baru
                'delivery_address' => 'Jakarta Selatan - Jl. TB Simatupang No. 200, Office Park',
                'delivery_city' => 'Jakarta Selatan', // ✅ Kolom baru
                'delivery_lat' => -6.2931, // ✅ Kolom baru
                'delivery_lng' => 106.8296, // ✅ Kolom baru
                'recipient_name' => 'Ibu Maya', // ✅ Kolom baru
                'recipient_phone' => '081234567106', // ✅ Kolom baru
                'goods_desc' => 'Furniture - Meja Kantor 50 unit, Kursi 100 unit, Lemari 30 unit',
                'goods_qty' => 180, // ✅ Kolom baru
                'goods_weight' => 1500.00, // kg
                'goods_volume' => 12.5, // ✅ Kolom baru (m³)
                'ship_date' => Carbon::now()->subDays(3)->format('Y-m-d'),
                'order_value' => 45000000.00, // Rp 45 juta
                'created_by' => 'ADM001',
                'completed_at' => now()->subDay(), // ✅ Completed date
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDay(),
            ],

            // Job Order 7 - Cancelled (Order Type: LTL)
            [
                'job_order_id' => 'JO-20251108-002',
                'customer_id' => 'CUST001',
                'order_type' => 'LTL',
                'status' => 'Cancelled',
                'pickup_address' => 'Bandung - Jl. Dago No. 77, Toko Fashion',
                'pickup_city' => 'Bandung', // ✅ Kolom baru
                'pickup_lat' => -6.8892, // ✅ Kolom baru
                'pickup_lng' => 107.6101, // ✅ Kolom baru
                'pickup_contact' => 'Ibu Ani', // ✅ Kolom baru
                'pickup_phone' => '081234567007', // ✅ Kolom baru
                'delivery_address' => 'Yogyakarta - Jl. Malioboro No. 88, Boutique',
                'delivery_city' => 'Yogyakarta', // ✅ Kolom baru
                'delivery_lat' => -7.7956, // ✅ Kolom baru
                'delivery_lng' => 110.3695, // ✅ Kolom baru
                'recipient_name' => 'Ibu Kartini', // ✅ Kolom baru
                'recipient_phone' => '081234567107', // ✅ Kolom baru
                'goods_desc' => 'Pakaian - Dress 100 pcs, Kemeja 80 pcs, Rok 60 pcs',
                'goods_qty' => 240, // ✅ Kolom baru
                'goods_weight' => 180.00, // kg
                'goods_volume' => 1.5, // ✅ Kolom baru (m³)
                'ship_date' => Carbon::now()->addDay()->format('Y-m-d'),
                'order_value' => 9000000.00, // Rp 9 juta
                'created_by' => 'ADM001',
                'completed_at' => null,
                'created_at' => now()->subHours(12),
                'updated_at' => now()->subHours(10),
            ],

            // Job Order 8 - Created (Order Type: FTL) - High Value
            [
                'job_order_id' => 'JO-20251109-006',
                'customer_id' => 'CUST002',
                'order_type' => 'FTL',
                'status' => 'Created',
                'pickup_address' => 'Tangerang - Jl. BSD Raya No. 999, Warehouse Tech',
                'pickup_city' => 'Tangerang', // ✅ Kolom baru
                'pickup_lat' => -6.3014, // ✅ Kolom baru
                'pickup_lng' => 106.6524, // ✅ Kolom baru
                'pickup_contact' => 'Pak IT Support', // ✅ Kolom baru
                'pickup_phone' => '081234567008', // ✅ Kolom baru
                'delivery_address' => 'Bekasi - Jl. Kalimalang No. 888, IT Center',
                'delivery_city' => 'Bekasi', // ✅ Kolom baru
                'delivery_lat' => -6.2349, // ✅ Kolom baru
                'delivery_lng' => 106.9896, // ✅ Kolom baru
                'recipient_name' => 'Pak Server Admin', // ✅ Kolom baru
                'recipient_phone' => '081234567108', // ✅ Kolom baru
                'goods_desc' => 'Peralatan IT - Server 10 unit, Network Equipment 50 box, Kabel & Aksesoris',
                'goods_qty' => 60, // ✅ Kolom baru
                'goods_weight' => 800.00, // kg
                'goods_volume' => 5.0, // ✅ Kolom baru (m³)
                'ship_date' => Carbon::now()->addDays(2)->format('Y-m-d'),
                'order_value' => 75000000.00, // Rp 75 juta (High value)
                'created_by' => 'ADM001',
                'completed_at' => null,
                'created_at' => now()->subMinutes(30),
                'updated_at' => now()->subMinutes(30),
            ],

        ];

        // ✅ Insert data
        DB::table('job_orders')->insert($jobOrders);

        $this->command->info('✅ JobOrderSeeder seeded successfully: ' . count($jobOrders) . ' job orders');

    }
}