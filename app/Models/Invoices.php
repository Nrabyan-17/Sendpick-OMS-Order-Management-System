<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoices extends Model
{
    protected $table = 'invoices';
    protected $primaryKey = 'invoice_id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'invoice_id',
        'source_type',
        'source_id',
        'customer_id',
        'invoice_date',
        'due_date',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total_amount',
        'paid_amount',
        'payment_date',
        'payment_notes',
        'status',
        'notes',
        'cancellation_note',
        'created_by'
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'payment_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2'
    ];

    /**
     * Relationship: Invoice belongs to Customer
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customers::class, 'customer_id', 'customer_id');
    }

    public function jobOrder()
    {
        return $this->belongsTo(JobOrder::class, 'source_id', 'job_order_id')
            ->where('source_type', 'JO');
    }

    public function manifest()
    {
        return $this->belongsTo(Manifests::class, 'source_id', 'manifest_id')
            ->where('source_type', 'MF');
    }

    public function deliveryOrder()
    {
        return $this->belongsTo(DeliveryOrder::class, 'source_id', 'do_id')
            ->where('source_type', 'DO');
    }

    /**
     * Relationship: Invoice belongs to Admin (created by)
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }

    /**
     * Get the source model (Job Order, Manifest, or Delivery Order) - Polymorphic relation
     */
    public function getSourceAttribute()
    {
        if ($this->source_type === 'JO') {
            return JobOrder::where('job_order_id', $this->source_id)->first();
        } elseif ($this->source_type === 'MF') {
            return Manifests::where('manifest_id', $this->source_id)->first();
        } elseif ($this->source_type === 'DO') {
            return DeliveryOrder::where('do_id', $this->source_id)->first();
        }
        return null;
    }

    // Relasi ke Payments (One to Many)
    public function payments()
    {
        return $this->hasMany(Payment::class, 'invoice_id', 'invoice_id');
    }

    // Relasi ke Payment Terakhir
    public function lastPayment()
    {
        return $this->hasOne(Payment::class, 'invoice_id', 'invoice_id')->latestOfMany();
    }

    // Helper Keren: Hitung total yang sudah dibayar
    public function getTotalPaidAttribute()
    {
        return $this->payments()->sum('amount');
    }

    // Helper Keren: Hitung sisa tagihan
    public function getRemainingAmountAttribute()
    {
        return $this->total_amount - $this->total_paid;
    }

    /**
     * Get outstanding amount (unpaid amount)
     */
    public function getOutstandingAmountAttribute(): float
    {
        return $this->total_amount - $this->paid_amount;
    }

    /**
     * Get payment progress in percentage
     */
    public function getPaymentProgressAttribute(): float
    {
        if ($this->total_amount == 0) {
            return 0;
        }
        return round(($this->paid_amount / $this->total_amount) * 100, 2);
    }
}