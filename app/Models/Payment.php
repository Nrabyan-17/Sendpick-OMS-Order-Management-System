<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{

    protected $table = 'payments';

    // 2. FILLABLE (Daftar kolom yang boleh diisi manual oleh Admin)
    // Wajib ada agar fitur 'Simpan Pembayaran' berjalan.
    protected $fillable = [
        'invoice_id',       // FK ke Invoice
        'amount',           // Nominal bayar
        'payment_date',     // Tanggal bayar
        'payment_method',   // Transfer/Tunai
        'reference_number', // No. Bukti (Opsional)
        'proof_file',       // Foto Bukti (Opsional)
        'notes',            // Catatan
        'created_by'        // Siapa yang input
    ];
    
    // Relasi ke Invoice (Inverse)
    public function invoice()
    {
        // Karena PK invoice Anda string 'invoice_id', definisikan secara spesifik
        return $this->belongsTo(Invoice::class, 'invoice_id', 'invoice_id');
    }
}