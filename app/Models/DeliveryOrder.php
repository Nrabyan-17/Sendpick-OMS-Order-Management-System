<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryOrder extends Model
{
    protected $table = 'delivery_orders';
    protected $primaryKey = 'do_id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'do_id',
        'source_type',
        'source_id',
        'selected_job_order_id', // ✅ NEW: For LTL - specific JO from Manifest
        'customer_id',
        'status',
        'do_date',
        'departure_date',
        'eta',
        'delivered_date',
        'goods_summary',
        'priority',
        'temperature',
        'created_by',
        'cancelled_at',
        'cancellation_reason'
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['driver_name', 'vehicle_plate'];

    protected $casts = [
        'do_date' => 'date',
        'departure_date' => 'datetime',
        'eta' => 'datetime',
        'delivered_date' => 'date',
        'cancelled_at' => 'datetime'
    ];

    /**
     * Relationship: Delivery Order belongs to Customer
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customers::class, 'customer_id', 'customer_id');
    }

    /**
     * Relationship: Delivery Order belongs to Admin (created by)
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by');
    }

    /**
     * Relationship: Delivery Order source Job Order (conditional)
     * NOTE: Hanya return Job Order jika source_type = 'JO'
     * Gunakan accessor atau check manual di controller
     */
    public function jobOrder() 
    {
        return $this->belongsTo(JobOrder::class, 'source_id', 'job_order_id');
    }

    /**
     * Relationship: Delivery Order source Manifest (conditional)
     * NOTE: Hanya return Manifest jika source_type = 'MF'
     * Gunakan accessor atau check manual di controller
     */
    public function manifest()
    {
        return $this->belongsTo(Manifests::class, 'source_id', 'manifest_id');
    }

    /**
     * Get the source model (Job Order or Manifest) with calculated totals
     * Returns enriched data for display purposes
     */
    public function getSourceAttribute()
    {
        if ($this->source_type === 'JO') {
            $jobOrder = JobOrder::with('customer')->where('job_order_id', $this->source_id)->first();
            if ($jobOrder) {
                // Return enriched data for Job Order
                return [
                    'job_order_id' => $jobOrder->job_order_id,
                    'customer_id' => $jobOrder->customer_id,
                    'customer_name' => $jobOrder->customer?->customer_name,
                    'pickup_city' => $jobOrder->pickup_city,
                    'delivery_city' => $jobOrder->delivery_city,
                    'pickup_address' => $jobOrder->pickup_address,    // ✅ NEW: Full pickup address
                    'delivery_address' => $jobOrder->delivery_address, // ✅ NEW: Full delivery address
                    'goods_desc' => $jobOrder->goods_desc,
                    'goods_weight' => $jobOrder->goods_weight,
                    'goods_volume' => $jobOrder->goods_volume,
                    'koli' => $jobOrder->goods_qty ?? 1, // Use goods_qty as koli
                    'quantity' => $jobOrder->goods_qty ?? 1,
                    'status' => $jobOrder->status,
                ];
            }
        } elseif ($this->source_type === 'MF') {
            $manifest = Manifests::with('jobOrders.customer')->where('manifest_id', $this->source_id)->first();
            if ($manifest) {
                // ✅ NEW: Check if a specific Job Order is selected (LTL scenario)
                if ($this->selected_job_order_id) {
                    // Find the specific selected Job Order from this Manifest
                    $selectedJO = $manifest->jobOrders->firstWhere('job_order_id', $this->selected_job_order_id);
                    
                    if ($selectedJO) {
                        // Return data ONLY from the selected Job Order (not the whole manifest)
                        return [
                            'manifest_id' => $manifest->manifest_id,
                            'selected_job_order_id' => $this->selected_job_order_id,
                            'job_order_id' => $selectedJO->job_order_id,
                            'customer_id' => $selectedJO->customer_id,
                            'customer_name' => $selectedJO->customer?->customer_name,
                            'origin_city' => $selectedJO->pickup_city ?? $manifest->origin_city,
                            'dest_city' => $selectedJO->delivery_city ?? $manifest->dest_city,
                            'pickup_city' => $selectedJO->pickup_city,
                            'delivery_city' => $selectedJO->delivery_city,
                            'pickup_address' => $selectedJO->pickup_address,    // ✅ NEW: Full pickup address
                            'delivery_address' => $selectedJO->delivery_address, // ✅ NEW: Full delivery address
                            'goods_desc' => $selectedJO->goods_desc,
                            'goods_weight' => $selectedJO->goods_weight, // Weight of SELECTED JO only
                            'goods_volume' => $selectedJO->goods_volume, // Volume of SELECTED JO only
                            'koli' => $selectedJO->goods_qty ?? 1,       // Koli of SELECTED JO only
                            'quantity' => $selectedJO->goods_qty ?? 1,
                            'job_orders_count' => 1, // This DO is for 1 specific JO
                            'status' => $manifest->status,
                            'cargo_summary' => $selectedJO->goods_desc,
                            'is_ltl_specific' => true, // Flag to indicate this is LTL-specific
                        ];
                    }
                }
                
                // Fallback: Calculate totals from all Job Orders in Manifest (legacy behavior)
                $totalWeight = 0;
                $totalVolume = 0;
                $totalKoli = 0;
                $jobOrdersCount = 0;
                $goodsDescriptions = [];
                
                foreach ($manifest->jobOrders as $jo) {
                    $totalWeight += floatval($jo->goods_weight ?? 0);
                    $totalVolume += floatval($jo->goods_volume ?? 0);
                    $totalKoli += intval($jo->goods_qty ?? 0);
                    $jobOrdersCount++;
                    if ($jo->goods_desc) {
                        $goodsDescriptions[] = $jo->goods_desc;
                    }
                }
                
                // Total Koli: Use goods_qty sum, fallback to count
                if ($totalKoli == 0) {
                    $totalKoli = $jobOrdersCount;
                }
                
                // Also add cargo_weight from manifest if Job Orders don't have weight
                if ($totalWeight == 0 && $manifest->cargo_weight) {
                    $totalWeight = floatval($manifest->cargo_weight);
                }
                
                // Create combined goods description
                $combinedDesc = $manifest->cargo_summary ?? implode(', ', array_slice($goodsDescriptions, 0, 3));
                if (count($goodsDescriptions) > 3) {
                    $combinedDesc .= '...';
                }
                
                // Get first and last job order for address info
                $firstJO = $manifest->jobOrders->first();
                $lastJO = $manifest->jobOrders->last();
                
                return [
                    'manifest_id' => $manifest->manifest_id,
                    'origin_city' => $manifest->origin_city,
                    'dest_city' => $manifest->dest_city,
                    'pickup_address' => $firstJO?->pickup_address ?? $manifest->origin_city,  // ✅ NEW
                    'delivery_address' => $lastJO?->delivery_address ?? $manifest->dest_city, // ✅ NEW
                    'goods_desc' => $combinedDesc,
                    'goods_weight' => $totalWeight > 0 ? $totalWeight : null,
                    'goods_volume' => $totalVolume > 0 ? $totalVolume : null,
                    'quantity' => $totalKoli,
                    'koli' => $totalKoli,
                    'job_orders_count' => $jobOrdersCount,
                    'status' => $manifest->status,
                    'cargo_summary' => $manifest->cargo_summary,
                ];
            }
        }
        return null;
    }

    /**
     * Accessor: Get driver name from Job Order Assignment or Manifest
     * ✅ FIXED (2025-12-22): Also look for Cancelled assignments for audit purposes
     * If DO is Cancelled, we still want to show who WAS assigned
     */
    public function getDriverNameAttribute()
    {
        if ($this->source_type === 'JO' && $this->jobOrder) {
            // First, try to find Active assignment
            $assignment = $this->jobOrder->assignments()
                ->where('status', 'Active')
                ->with('driver')
                ->first();
            
            // ✅ FIXED: If no Active assignment found, look for most recent Cancelled assignment
            // This preserves driver info for DO that has been cancelled
            if (!$assignment) {
                $assignment = $this->jobOrder->assignments()
                    ->whereIn('status', ['Cancelled', 'Inactive'])
                    ->with('driver')
                    ->orderBy('assigned_at', 'desc')
                    ->first();
            }
            
            return $assignment?->driver?->driver_name ?? null;
        } elseif ($this->source_type === 'MF' && $this->manifest) {
            // ✅ FIXED: For Manifest, check if driver relation exists
            // If Manifest still has driver assigned, use it
            if ($this->manifest->drivers) {
                return $this->manifest->drivers->driver_name;
            }
            
            // ✅ FIXED: If Manifest no longer has driver (e.g., was cancelled),
            // try to find driver from the Job Orders' assignments history
            $manifestJobOrders = $this->manifest->jobOrders()->with(['assignments.driver'])->get();
            foreach ($manifestJobOrders as $jo) {
                $assignment = $jo->assignments
                    ->sortByDesc('assigned_at')
                    ->first();
                if ($assignment?->driver) {
                    return $assignment->driver->driver_name;
                }
            }
            
            return null;
        }
        
        return null;
    }

    /**
     * Accessor: Get vehicle plate from Job Order Assignment or Manifest
     * ✅ FIXED (2025-12-22): Also look for Cancelled assignments for audit purposes
     */
    public function getVehiclePlateAttribute()
    {
        if ($this->source_type === 'JO' && $this->jobOrder) {
            // First, try to find Active assignment
            $assignment = $this->jobOrder->assignments()
                ->where('status', 'Active')
                ->with('vehicle')
                ->first();
            
            // ✅ FIXED: If no Active assignment found, look for most recent Cancelled assignment
            if (!$assignment) {
                $assignment = $this->jobOrder->assignments()
                    ->whereIn('status', ['Cancelled', 'Inactive'])
                    ->with('vehicle')
                    ->orderBy('assigned_at', 'desc')
                    ->first();
            }
            
            return $assignment?->vehicle?->plate_no ?? null;
        } elseif ($this->source_type === 'MF' && $this->manifest) {
            // ✅ FIXED: For Manifest, check if vehicle relation exists
            if ($this->manifest->vehicles) {
                return $this->manifest->vehicles->plate_no;
            }
            
            // ✅ FIXED: Try to find vehicle from Job Orders' assignments history
            $manifestJobOrders = $this->manifest->jobOrders()->with(['assignments.vehicle'])->get();
            foreach ($manifestJobOrders as $jo) {
                $assignment = $jo->assignments
                    ->sortByDesc('assigned_at')
                    ->first();
                if ($assignment?->vehicle) {
                    return $assignment->vehicle->plate_no;
                }
            }
            
            return null;
        }
        
        return null;
    }
}