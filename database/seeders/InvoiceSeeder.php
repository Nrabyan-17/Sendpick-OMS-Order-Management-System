<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InvoiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ✅ Skip jika data sudah ada
        if (DB::table('invoices')->count() > 0) {
            $this->command->info('⚠️  Invoices already seeded. Skipping...');
            return;
        }

        // ✅ Pastikan customer sudah ada
        $customerExists = DB::table('customers')->where('customer_id', 'CUST001')->exists();
        if (!$customerExists) {
            $this->command->error('❌ Customer CUST001 not found. Please seed CustomerSeeder first!');
            return;
        }

        $invoices = [
            // Invoice 1: Pending (belum ada pembayaran)
            [
                'invoice_id' => 'INV-20251108-001',
                'source_type' => 'JO',
                'source_id' => 'JO-20251108-001',
                'customer_id' => 'CUST001',
                'invoice_date' => '2025-11-08',
                'due_date' => '2025-11-22',
                'subtotal' => 5000000.00,
                'tax_amount' => 500000.00,
                'total_amount' => 5500000.00,
                'paid_amount' => 0.00,
                'payment_date' => null,
                'payment_notes' => null,
                'status' => 'Pending',
                'notes' => 'Invoice untuk Job Order JO-20251108-001 - Pengiriman Jakarta ke Surabaya',
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now()
            ],
            
            // Invoice 2: Partial (sudah ada pembayaran partial)
            [
                'invoice_id' => 'INV-20251107-002',
                'source_type' => 'JO',
                'source_id' => 'JO-20251107-002',
                'customer_id' => 'CUST002',
                'invoice_date' => '2025-11-07',
                'due_date' => '2025-11-21',
                'subtotal' => 8000000.00,
                'tax_amount' => 880000.00,
                'total_amount' => 8880000.00,
                'paid_amount' => 3000000.00,
                'payment_date' => null,
                'payment_notes' => "[2025-11-07 10:30:00] Payment: Rp 3,000,000.00 - Down payment 33%",
                'status' => 'Partial',
                'notes' => 'Invoice untuk Job Order JO-20251107-002 - Pengiriman Bandung ke Medan',
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now()
            ],
            
            // Invoice 3: Paid (sudah lunas)
            [
                'invoice_id' => 'INV-20251106-003',
                'source_type' => 'DO',
                'source_id' => 'DO-20251106-001',
                'customer_id' => 'CUST003',
                'invoice_date' => '2025-11-06',
                'due_date' => '2025-11-20',
                'subtotal' => 12000000.00,
                'tax_amount' => 1320000.00,
                'total_amount' => 13320000.00,
                'paid_amount' => 13320000.00,
                'payment_date' => '2025-11-07',
                'payment_notes' => "[2025-11-07 14:15:00] Payment: Rp 13,320,000.00 - Pembayaran lunas via transfer",
                'status' => 'Paid',
                'notes' => 'Invoice untuk Delivery Order DO-20251106-001 - Pengiriman Semarang ke Yogyakarta',
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now()
            ],
            
            // Invoice 4: Overdue (lewat due date, belum bayar)
            [
                'invoice_id' => 'INV-20251101-004',
                'source_type' => 'JO',
                'source_id' => 'JO-20251101-003',
                'customer_id' => 'CUST001',
                'invoice_date' => '2025-11-01',
                'due_date' => '2025-11-08',
                'subtotal' => 7000000.00,
                'tax_amount' => 770000.00,
                'total_amount' => 7770000.00,
                'paid_amount' => 0.00,
                'payment_date' => null,
                'payment_notes' => null,
                'status' => 'Overdue',
                'notes' => 'Invoice untuk Job Order JO-20251101-003 - Pengiriman Malang ke Bali (OVERDUE!)',
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now()
            ],
            
            // Invoice 5: Partial (75% sudah dibayar)
            [
                'invoice_id' => 'INV-20251105-005',
                'source_type' => 'MF',
                'source_id' => 'MF-20251105-001',
                'customer_id' => 'CUST001',
                'invoice_date' => '2025-11-05',
                'due_date' => '2025-11-19',
                'subtotal' => 6000000.00,
                'tax_amount' => 660000.00,
                'total_amount' => 6660000.00,
                'paid_amount' => 5000000.00,
                'payment_date' => null,
                'payment_notes' => "[2025-11-05 09:00:00] Payment: Rp 2,000,000.00 - Pembayaran awal\n[2025-11-06 16:30:00] Payment: Rp 3,000,000.00 - Cicilan kedua",
                'status' => 'Partial',
                'notes' => 'Invoice untuk Manifest MF-20251105-001 - Pengiriman Surabaya ke Makassar',
                'created_by' => 'ADM001',
                'created_at' => now(),
                'updated_at' => now()
            ],
        ];

        DB::table('invoices')->insert($invoices);
    }
}
