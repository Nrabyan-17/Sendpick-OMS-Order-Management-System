<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobOrderStatusHistory extends Model
{
    protected $table = 'job_order_status_histories';
    protected $primaryKey = 'history_id';
    
    protected $fillable = [
        'job_order_id',
        'status',
        'notes',
        'trigger_type',
        'changed_by',
        'changed_at'
    ];

    protected $casts = [
        'changed_at' => 'datetime'
    ];

    /**
     * Relationship: Status History belongs to Job Order
     */
    public function jobOrder(): BelongsTo
    {
        return $this->belongsTo(JobOrder::class, 'job_order_id', 'job_order_id');
    }
}