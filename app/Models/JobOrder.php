<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Observers\JobOrderObserver;

class JobOrder extends Model
{
    protected $table = 'job_orders';
    protected $primaryKey = 'job_order_id';
    public $incrementing = false;
    protected $keyType = 'string';

    /**
     * Boot the model and register observers
     */
    protected static function booted(): void
    {
        static::observe(JobOrderObserver::class);
    }
    
    protected $fillable = [
        'job_order_id',
        'customer_id',
        'order_type',
        'status',
        'pickup_address',
        'pickup_city',
        'pickup_lat',
        'pickup_lng',
        'pickup_contact',
        'pickup_phone',
        'delivery_address',
        'delivery_city',
        'delivery_lat',
        'delivery_lng',
        'recipient_name',
        'recipient_phone',
        'goods_desc',
        'goods_qty',
        'goods_weight',
        'goods_volume',
        'ship_date',
        'order_value',
        'created_by',
        'completed_at',
        'cancelled_at',
        'cancellation_reason'
    ];

    protected $casts = [
        'goods_weight' => 'decimal:2',
        'goods_volume' => 'decimal:2',
        'order_value' => 'decimal:2',
        'pickup_lat' => 'decimal:8',
        'pickup_lng' => 'decimal:8',
        'delivery_lat' => 'decimal:8',
        'delivery_lng' => 'decimal:8',
        'ship_date' => 'date',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime'
    ];

    /**
     * Relationship: Job Order belongs to Customer
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customers::class, 'customer_id', 'customer_id');
    }

    /**
     * Relationship: Job Order belongs to Admin (created by)
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }

    /**
     * Relationship: Job Order has many Assignments
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class, 'job_order_id', 'job_order_id');
    }

    /**
     * Relationship: Job Order has many Status Histories
     */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(JobOrderStatusHistory::class, 'job_order_id', 'job_order_id');
    }

    /**
     * Relationship: Job Order has many Proof of Deliveries
     */
    public function proofOfDeliveries(): HasMany
    {
        return $this->hasMany(ProofOfDelivery::class, 'job_order_id', 'job_order_id');
    }

    /**
     * Relationship: Job Order belongs to many Manifests
     */
    public function manifests(): BelongsToMany
    {
        return $this->belongsToMany(Manifests::class, 'manifest_jobs', 'job_order_id', 'manifest_id', 'job_order_id', 'manifest_id');
    }

    /**
     * Generate Job Order ID
     * Format: JO + YYYYMMDD + 4 digit sequence number
     * Contoh: JO202511060001
     */
    public static function generateJobOrderId()
    {
        $date = date('Ymd');  // 20251106
        
        // Cari job order terakhir hari ini
        $lastOrder = self::whereDate('created_at', today())
                        ->orderBy('job_order_id', 'desc')
                        ->first();

        if ($lastOrder) {
            // Ambil 4 digit terakhir (misalnya: JO202511060001 → 0001)
            $lastNumber = (int) substr($lastOrder->job_order_id, -4);
            // Increment +1 → 0002
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            // Belum ada order hari ini, mulai dari 0001
            $newNumber = '0001';
        }

        return 'JO' . $date . $newNumber;
        // Result: JO202511060001, JO202511060002, dst.
    }

    /**
     * Generate Order Number
     * Format: ORD- + Unique ID
     * Contoh: ORD-673A2F1B
     */
    public static function generateOrderNumber()
    {
        return 'ORD-' . strtoupper(uniqid());
    }

}