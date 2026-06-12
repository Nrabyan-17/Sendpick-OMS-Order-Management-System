<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * ReportSeeder - Populate sample data untuk testing Report API
 * 
 * Data yang di-generate:
 * - Job Orders dengan variasi order_value (untuk Sales Report)
 * - Invoices dengan status Paid/Pending/Overdue (untuk Financial Report)
 * - Delivery Orders dengan status berbeda (untuk Operational Report)
 * - Customer dengan variasi frekuensi order (untuk Customer Analytics)
 */
class ReportSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ✅ Skip jika sudah ada data report (untuk menghindari duplikasi)
        $reportJobOrdersExist = DB::table('job_orders')
            ->where('job_order_id', 'LIKE', 'JO-%-01%')
            ->exists();

        if ($reportJobOrdersExist) {
            $this->command->info('⚠️  Report test data already exists. Skipping...');
            return;
        }

        // Ambil data reference dari tabel lain
        $customers = DB::table('customers')->pluck('customer_id')->toArray();
        $drivers = DB::table('drivers')->pluck('driver_id')->toArray();
        $vehicles = DB::table('vehicles')->pluck('vehicle_id')->toArray();
        $admins = DB::table('admin')->pluck('user_id')->toArray();

        if (empty($customers) || empty($drivers) || empty($vehicles) || empty($admins)) {
            $this->command->error('⚠️  Data customers, drivers, vehicles, atau admin belum ada! Jalankan seeder lain terlebih dahulu.');
            return;
        }

        $this->command->info('🚀 Mulai generate sample data untuk Report Testing...');

        // ========================================
        // 1. Generate Additional Job Orders (untuk Sales Report)
        // ========================================
        $this->command->info('📦 Generating Job Orders...');
        $jobOrders = [];
        $baseDate = Carbon::now()->subDays(60); // Data 60 hari ke belakang

        for ($i = 0; $i < 50; $i++) {
            $randomDate = $baseDate->copy()->addDays(rand(0, 60));
            $orderValue = rand(500000, 5000000); // 500k - 5jt
            $status = $this->getRandomStatus(['Pending', 'Processing', 'Completed', 'Cancelled'], [10, 20, 60, 10]);

            $jobOrders[] = [
                'job_order_id' => 'JO-' . $randomDate->format('Ymd') . '-' . str_pad($i + 100, 4, '0', STR_PAD_LEFT),
                'customer_id' => $customers[array_rand($customers)], // ✅ Gunakan customer yang ada
                'order_type' => $this->getRandomStatus(['LTL', 'FTL'], [60, 40]),
                'status' => $status,
                'pickup_address' => 'Warehouse ' . chr(65 + rand(0, 5)) . ', Jakarta',
                'delivery_address' => 'Customer Location ' . rand(1, 20) . ', ' . ['Surabaya', 'Bandung', 'Medan', 'Semarang'][array_rand(['Surabaya', 'Bandung', 'Medan', 'Semarang'])],
                'goods_desc' => 'Sample goods: ' . ['Electronics', 'Food Products', 'Furniture', 'Clothing', 'Building Materials'][array_rand(['Electronics', 'Food Products', 'Furniture', 'Clothing', 'Building Materials'])],
                'goods_weight' => rand(100, 5000) / 10, // 10kg - 500kg
                'ship_date' => $randomDate->toDateString(),
                'order_value' => $orderValue,
                'created_by' => $admins[array_rand($admins)],
                'completed_at' => $status === 'Completed' ? $randomDate->copy()->addDays(rand(2, 5))->toDateTimeString() : null,
                'created_at' => $randomDate,
                'updated_at' => $randomDate,
            ];
        }

        DB::table('job_orders')->insert($jobOrders);
        $this->command->info('✅ Created ' . count($jobOrders) . ' Job Orders');

        // ========================================
        // 2. Generate Invoices (untuk Financial Report)
        // ========================================
        $this->command->info('💰 Generating Invoices...');
        $invoices = [];
        $insertedJobOrders = DB::table('job_orders')
            ->whereIn('job_order_id', array_column($jobOrders, 'job_order_id'))
            ->get();

        foreach ($insertedJobOrders as $index => $job) {
            $invoiceDate = Carbon::parse($job->created_at);
            $dueDate = $invoiceDate->copy()->addDays(30);
            $status = $this->getRandomStatus(['Paid', 'Pending', 'Overdue'], [60, 25, 15]);
            
            $subtotal = $job->order_value;
            $tax = $subtotal * 0.11; // PPN 11%

            $invoices[] = [
                'invoice_id' => 'INV-' . $invoiceDate->format('Ymd') . '-' . str_pad($index + 100, 4, '0', STR_PAD_LEFT),
                'customer_id' => $job->customer_id,
                'source_type' => 'JO',
                'source_id' => $job->job_order_id,
                'invoice_date' => $invoiceDate->toDateString(),
                'due_date' => $dueDate->toDateString(),
                'subtotal' => $subtotal,
                'tax_amount' => $tax,
                'total_amount' => $subtotal + $tax,
                'status' => $status,
                'notes' => 'Auto-generated invoice for ' . $job->job_order_id,
                'created_by' => $job->created_by,
                'created_at' => $invoiceDate,
                'updated_at' => $invoiceDate,
            ];
        }

        DB::table('invoices')->insert($invoices);
        $this->command->info('✅ Created ' . count($invoices) . ' Invoices');

        // ========================================
        // 3. Generate Delivery Orders (untuk Operational Report)
        // ========================================
        $this->command->info('🚚 Generating Delivery Orders...');
        $deliveryOrders = [];
        
        foreach ($insertedJobOrders->take(40) as $index => $job) {
            $doDate = Carbon::parse($job->ship_date);
            $status = $this->getRandomStatus(['Pending', 'In Progress', 'Delivered', 'Cancelled'], [15, 20, 60, 5]);

            // ✅ Sesuaikan dengan schema delivery_orders yang benar
            $deliveryOrders[] = [
                'do_id' => 'DO-' . $doDate->format('Ymd') . '-' . str_pad($index + 100, 3, '0', STR_PAD_LEFT),
                'source_type' => 'JO',
                'source_id' => $job->job_order_id,
                'customer_id' => $job->customer_id,
                'status' => $status,
                'do_date' => $doDate->toDateString(),
                'delivered_date' => $status === 'Delivered' ? $doDate->copy()->addDays(rand(1, 3))->toDateString() : null,
                'goods_summary' => $job->goods_desc,
                'priority' => $this->getRandomStatus(['Low', 'Normal', 'High', 'Urgent'], [10, 50, 30, 10]),
                'temperature' => $this->getRandomStatus(['Ambient', 'Cold', 'Cool'], [70, 20, 10]),
                'created_by' => $job->created_by,
                'created_at' => $doDate,
                'updated_at' => $doDate,
            ];
        }

        DB::table('delivery_orders')->insert($deliveryOrders);
        $this->command->info('✅ Created ' . count($deliveryOrders) . ' Delivery Orders');

        // ========================================
        // 4. Generate Assignments (untuk Driver Performance)
        // ========================================
        $this->command->info('👷 Generating Assignments...');
        $assignments = [];
        
        foreach ($deliveryOrders as $index => $do) {
            $assignments[] = [
                'job_order_id' => $do['source_id'],
                'driver_id' => $drivers[array_rand($drivers)],
                'vehicle_id' => $vehicles[array_rand($vehicles)],
                'status' => $do['status'] === 'Delivered' ? 'Completed' : 'Active',
                'assigned_at' => $do['created_at'],
                'notes' => 'Auto-assignment for ' . $do['do_id'],
                'created_at' => $do['created_at'],
                'updated_at' => $do['updated_at'],
            ];
        }

        DB::table('job_order_assignments')->insert($assignments);
        $this->command->info('✅ Created ' . count($assignments) . ' Assignments');

        $this->command->info('🎉 Report Seeder selesai! Total data:');
        $this->command->line('   - Job Orders: ' . count($jobOrders));
        $this->command->line('   - Invoices: ' . count($invoices));
        $this->command->line('   - Delivery Orders: ' . count($deliveryOrders));
        $this->command->line('   - Assignments: ' . count($assignments));
    }

    /**
     * Get random status based on weight distribution
     */
    private function getRandomStatus(array $statuses, array $weights): string
    {
        $totalWeight = array_sum($weights);
        $random = rand(1, $totalWeight);
        
        $cumulativeWeight = 0;
        foreach ($statuses as $index => $status) {
            $cumulativeWeight += $weights[$index];
            if ($random <= $cumulativeWeight) {
                return $status;
            }
        }
        
        return $statuses[0]; // Fallback
    }
}
