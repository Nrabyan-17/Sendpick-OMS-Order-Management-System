<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Manifests extends Model
{
    protected $table = 'manifests';
    protected $primaryKey = 'manifest_id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'manifest_id',
        'origin_city',
        'dest_city',
        'cargo_summary',
        'cargo_weight',
        'planned_departure',
        'planned_arrival',
        'status',
        'created_by',
        'driver_id',
        'vehicle_id',
        'departed_at',
        'arrived_at',
        'completed_at',
        'cancelled_at',
        'cancellation_reason'
    ];

    protected $casts = [
        'cargo_weight' => 'decimal:2',
        'planned_departure' => 'datetime',
        'planned_arrival' => 'datetime',
        'departed_at' => 'datetime',
        'arrived_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime'
    ];

    /**
     * Relationship: Manifest belongs to Admin (created by)
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }

    /**
     * Relationship: Manifest belongs to many Job Orders
     */
    public function jobOrders(): BelongsToMany
    {
        return $this->belongsToMany(JobOrder::class, 'manifest_jobs', 'manifest_id', 'job_order_id', 'manifest_id', 'job_order_id');
    }

    /**
     * Relationship: Manifest belongs to Driver
     */
    public function drivers(): BelongsTo
    {
        return $this->belongsTo(Drivers::class, 'driver_id', 'driver_id');
    }

    /**
     * Relationship: Manifest belongs to Vehicle
     */
    public function vehicles(): BelongsTo
    {
        return $this->belongsTo(Vehicles::class, 'vehicle_id', 'vehicle_id');
    }

}