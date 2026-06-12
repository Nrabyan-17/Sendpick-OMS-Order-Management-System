<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProofOfDelivery extends Model
{
    protected $table = 'proof_of_deliveries';
    protected $primaryKey = 'pod_id';
    
    protected $fillable = [
        'job_order_id',
        'photo_url',
        'signature_url',
        'uploaded_at'
    ];

    protected $casts = [
        'uploaded_at' => 'datetime'
    ];

    /**
     * Relationship: Proof of Delivery belongs to Job Order
     */
    public function jobOrder(): BelongsTo
    {
        return $this->belongsTo(JobOrder::class, 'job_order_id', 'job_order_id');
    }
}
