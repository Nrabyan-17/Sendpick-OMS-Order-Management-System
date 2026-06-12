<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    protected $table = 'roles';
    
    protected $fillable = [
        'name',
        'description'
    ];

    /**
     * Relationship: Role belongs to many Admin users
     */
    public function admins(): BelongsToMany
    {
        return $this->belongsToMany(Admin::class, 'role_admin', 'role_id', 'user_id');
    }
}
