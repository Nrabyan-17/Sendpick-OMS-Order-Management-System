<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Gps extends Model
{
    protected $table = 'gps_tracking_logs';
    
    protected $fillable = [
        'driver_id',
        'vehicle_id',
        'order_id',
        'lat',
        'lng',
        'sent_at',
        'received_at'
    ];

    protected $casts = [
        'lat' => 'decimal:8',
        'lng' => 'decimal:8',
        'sent_at' => 'datetime',
        'received_at' => 'datetime'
    ];

    /**
     * Relationship: GPS Log belongs to Driver
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Drivers::class, 'driver_id', 'driver_id');
    }

    /**
     * Relationship: GPS Log belongs to Vehicle
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicles::class, 'vehicle_id', 'vehicle_id');
    }
}
