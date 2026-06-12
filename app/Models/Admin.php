<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class Admin extends Authenticatable
{
    use HasApiTokens, Notifiable;
    
    protected $table = 'admin';
    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'password',
        'phone',
        'department',
        'last_login',
        'address',
        'photo',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Relationship: Admin belongs to many Roles
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_admin', 'user_id', 'role_id');
    }

    /**
     * Relationship: Admin has many Job Orders (created by)
     */
    public function jobOrders(): HasMany
    {
        return $this->hasMany(JobOrder::class, 'created_by');
    }

    /**
     * Relationship: Admin has many Manifests (created by)
     */
    public function manifests(): HasMany
    {
        return $this->hasMany(Manifests::class, 'created_by');
    }

    /**
     * Relationship: Admin has many Delivery Orders (created by)
     */
    public function deliveryOrders(): HasMany
    {
        return $this->hasMany(DeliveryOrder::class, 'created_by');
    }

    /**
     * Relationship: Admin has many Invoices (created by)
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoices::class, 'created_by');
    }
}