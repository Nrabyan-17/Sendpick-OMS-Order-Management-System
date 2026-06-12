<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VehicleTypes extends Model
{
    protected $table = 'vehicle_types';
    
    protected $fillable = [
        'name',
        'description',
        'capacity_min_kg',
        'capacity_max_kg',
        'volume_min_m3',
        'volume_max_m3',
        'status'
    ];

    protected $casts = [
        'capacity_min_kg' => 'decimal:2',
        'capacity_max_kg' => 'decimal:2',
        'volume_min_m3' => 'decimal:2',
        'volume_max_m3' => 'decimal:2'
    ];

    /**
     * Relationship: Vehicle Type has many Vehicles
     */
    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicles::class, 'vehicle_type_id');
    }
}