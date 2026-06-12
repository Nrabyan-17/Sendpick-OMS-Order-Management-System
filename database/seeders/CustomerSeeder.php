<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customers;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        // ✅ TAMBAHKAN CEK INI - Skip jika data sudah ada
        if (DB::table('customers')->count() > 0) {
            $this->command->info('⚠️  Customers already seeded. Skipping...');
            return;
        }

        // Data customers
        $customers = [
            [
                'customer_id' => 'CUST001',
                'customer_code' => 'CUST-001',
                'customer_name' => 'PT. Maju Jaya Indonesia',
                'customer_type' => 'Retail',
                'contact_name' => 'Budi Santoso',
                'phone' => '081234567890',
                'email' => 'budi@majujaya.com',
                'address' => 'Jl. Sudirman No. 100, Kav 52-53, Jakarta Pusat 10220',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'customer_id' => 'CUST002',
                'customer_code' => 'CUST-002',
                'customer_name' => 'CV Sejahtera Abadi',
                'customer_type' => 'Wholesale',
                'contact_name' => 'Siti Nurhaliza',
                'phone' => '081234567891',
                'email' => 'siti@sejahtera.com',
                'address' => 'Jl. Gatot Subroto No. 200, Jakarta Selatan 12950',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'customer_id' => 'CUST003',
                'customer_code' => 'CUST-003',
                'customer_name' => 'Toko Elektronik Jaya',
                'customer_type' => 'Retail',
                'contact_name' => 'Ahmad Fauzi',
                'phone' => '081234567892',
                'email' => 'ahmad@elektronikjaya.com',
                'address' => 'Jl. Thamrin No. 300, Jakarta Pusat 10230',
                'status' => 'Aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('customers')->insert($customers);

        $this->command->info('✅ Customer seeded successfully: ' . count($customers) . ' records added.');
    }
}