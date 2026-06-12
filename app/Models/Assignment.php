<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assignment extends Model
{
    protected $table = 'job_order_assignments';
    protected $primaryKey = 'assignment_id';
    
    protected $fillable = [
        'job_order_id',
        'driver_id',
        'vehicle_id',
        'status',
        'notes',
        'assigned_at'
    ];

    protected $casts = [
        'assigned_at' => 'datetime'
    ];

    /**
     * Relationship: Assignment belongs to Job Order
     */
    public function jobOrder(): BelongsTo
    {
        return $this->belongsTo(JobOrder::class, 'job_order_id', 'job_order_id');
    }

    /**
     * Relationship: Assignment belongs to Driver
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Drivers::class, 'driver_id', 'driver_id');
    }

    /**
     * Relationship: Assignment belongs to Vehicle
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicles::class, 'vehicle_id', 'vehicle_id');
    }
}
