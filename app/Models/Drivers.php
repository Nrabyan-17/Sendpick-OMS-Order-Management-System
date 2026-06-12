<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable; // ← UBAH dari Model ke Authenticatable
use Laravel\Sanctum\HasApiTokens; // ← TAMBAHKAN
use Illuminate\Notifications\Notifiable;


class Drivers extends Authenticatable
{

    use HasApiTokens, Notifiable;

    protected $table = 'drivers';
    protected $primaryKey = 'driver_id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'driver_id',
        'driver_name',
        'phone',
        'email',
        'password',
        'status',
        'shift',
        'last_lat',
        'last_lng',
        'last_location_city',
        'delivery_count',
        'fcm_token'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'last_lat' => 'decimal:8',
        'last_lng' => 'decimal:8',
        'email_verified_at' => 'datetime', // ← TAMBAHKAN
        'password' => 'hashed', // ← TAMBAHKAN (Laravel 11)
    ];

    /**
     * Relationship: Driver has one assigned Vehicle (via vehicles.driver_id)
     * This is the reverse of Vehicles::driver()
     */
    public function assignedVehicle(): HasOne
    {
        return $this->hasOne(Vehicles::class, 'driver_id', 'driver_id');
    }

    /**
     * Relationship: Driver has many Job Order Assignments
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class, 'driver_id', 'driver_id');
    }

    /**
     * Relationship: Driver has many GPS Tracking Logs
     */
    public function gpsLogs(): HasMany
    {
        return $this->hasMany(Gps::class, 'driver_id', 'driver_id');
    }

    /**
     * Relationship: Driver has many Manifests
     */
    public function manifests(): HasMany
    {
        return $this->hasMany(Manifests::class, 'driver_id', 'driver_id');
    }
}