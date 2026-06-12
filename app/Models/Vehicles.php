<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicles extends Model
{
    protected $table = 'vehicles';
    protected $primaryKey = 'vehicle_id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'vehicle_id',
        'plate_no',
        'vehicle_type_id',
        'brand',
        'model',
        'year',
        'capacity_label',
        'odometer_km',
        'status',
        'condition_label',
        'driver_id',
        'fuel_level_pct',
        'last_maintenance_date',
        'next_maintenance_date'
    ];

    protected $casts = [
        'year' => 'integer',
        'odometer_km' => 'integer',
        'fuel_level_pct' => 'integer',
        'last_maintenance_date' => 'date',
        'next_maintenance_date' => 'date'
    ];

    /**
     * Relationship: Vehicle belongs to Vehicle Type
     */
    public function vehicleType(): BelongsTo
    {
        return $this->belongsTo(VehicleTypes::class, 'vehicle_type_id');
    }

    /**
     * Relationship: Vehicle belongs to Driver (assigned driver)
     */
    public function driver(): BelongsTo
    {
        return $this->belongsTo(Drivers::class, 'driver_id', 'driver_id');
    }

    /**
     * Relationship: Vehicle has many Job Order Assignments
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class, 'vehicle_id', 'vehicle_id');
    }

    /**
     * Relationship: Vehicle has many GPS Tracking Logs
     */
    public function gpsLogs(): HasMany
    {
        return $this->hasMany(Gps::class, 'vehicle_id', 'vehicle_id');
    }

    /**
     * Relationship: Vehicle has many Manifests
     */
    public function manifests(): HasMany
    {
        return $this->hasMany(Manifests::class, 'vehicle_id', 'vehicle_id');
    }
}