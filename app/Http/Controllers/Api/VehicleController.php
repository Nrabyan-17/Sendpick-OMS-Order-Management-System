<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicles;
use App\Models\VehicleTypes;
use App\Models\JobOrder;
use App\Models\Manifests;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Carbon\Carbon;

/**
 * VehicleController - Controller untuk mengelola data Kendaraan
 * 
 * Fungsi utama:
 * - Menampilkan daftar kendaraan dengan pencarian dan filter
 * - Membuat data kendaraan baru dengan validasi lengkap
 * - Update data kendaraan termasuk status dan kondisi
 * - Menghapus data kendaraan
 * - Filter berdasarkan tipe kendaraan dan status
 * - Tracking maintenance dan assignment history
 * - Monitor utilisasi dan performa kendaraan
 */
class VehicleController extends Controller
{
    /**
     * Display a listing of vehicles
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        // Include active assignment with job order for location display, and driver relationship
        $query = Vehicles::with(['vehicleType', 'driver', 'assignments' => function ($q) {
            $q->where('status', 'Active')
              ->with(['jobOrder', 'driver']);
        }]);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('plate_no', 'ILIKE', "%{$search}%")
                ->orWhere('brand', 'ILIKE', "%{$search}%")
                ->orWhere('model', 'ILIKE', "%{$search}%")
                ->orWhere('vehicle_id', 'ILIKE', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by vehicle type
        if ($request->filled('vehicle_type_id')) {
            $query->where('vehicle_type_id', $request->vehicle_type_id);
        }

        // Filter by condition
        if ($request->filled('condition_label')) {
            $query->where('condition_label', $request->condition_label);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $vehicles = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Transform data to include current location based on assignment status
        $transformedVehicles = collect($vehicles->items())->map(function ($vehicle) {
            $activeAssignment = $vehicle->assignments->first();
            $jobOrder = $activeAssignment ? $activeAssignment->jobOrder : null;
            $driver = $activeAssignment ? $activeAssignment->driver : null;

            // Determine current location
            // If vehicle has active job order with status "On Delivery" or "Pickup", show destination city
            $currentLocation = 'Pool (Standby)';
            $inTransitStatuses = ['On Delivery', 'Pickup'];
            
            if ($jobOrder && in_array($jobOrder->status, $inTransitStatuses)) {
                $currentLocation = $jobOrder->delivery_city ?? 'Pool (Standby)';
            }

            // Add computed fields to vehicle
            $vehicleData = $vehicle->toArray();
            $vehicleData['current_location'] = $currentLocation;
            // Use directly assigned driver first, fallback to assignment driver
            $vehicleData['driver'] = $vehicle->driver ?? $driver;
            $vehicleData['active_job_order'] = $jobOrder;

            return $vehicleData;
        });

        return response()->json([
            'success' => true,
            'data' => $transformedVehicles,
            'pagination' => [
                'current_page' => $vehicles->currentPage(),
                'per_page' => $vehicles->perPage(),
                'total' => $vehicles->total(),
                'last_page' => $vehicles->lastPage()
            ]
        ], 200);
    }

    /**
     * Store a newly created vehicle
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'plate_no' => 'required|string|max:20|unique:vehicles,plate_no',
            'vehicle_type_id' => 'required|exists:vehicle_types,id',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'capacity_label' => 'nullable|string|max:100',
            'odometer_km' => 'nullable|integer|min:0',
            'status' => 'nullable|in:Available,In Use,Maintenance,Tidak Aktif',
            'condition_label' => 'nullable|in:Baru,Sangat Baik,Baik,Perlu Perbaikan',
            'driver_id' => 'nullable|exists:drivers,driver_id',
            'fuel_level_pct' => 'nullable|integer|min:0|max:100',
            'last_maintenance_date' => 'nullable|date',
            'next_maintenance_date' => 'nullable|date|after:last_maintenance_date'
        ]);

        // Generate unique vehicle_id
        $vehicleId = 'VHC-' . strtoupper(Str::random(8));
        while (Vehicles::where('vehicle_id', $vehicleId)->exists()) {
            $vehicleId = 'VHC-' . strtoupper(Str::random(8));
        }

        $vehicle = Vehicles::create([
            'vehicle_id' => $vehicleId,
            'plate_no' => $request->plate_no,
            'vehicle_type_id' => $request->vehicle_type_id,
            'brand' => $request->brand,
            'model' => $request->model,
            'year' => $request->year,
            'capacity_label' => $request->capacity_label,
            'odometer_km' => $request->odometer_km ?? 0,
            'status' => $request->status ?? 'Available',
            'condition_label' => $request->condition_label ?? 'Baik',
            'driver_id' => $request->driver_id ?: null,
            'fuel_level_pct' => $request->fuel_level_pct ?? 0,
            'last_maintenance_date' => $request->last_maintenance_date,
            'next_maintenance_date' => $request->next_maintenance_date
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle created successfully',
            'data' => $vehicle->load(['vehicleType', 'driver'])
        ], 201);
    }

    /**
     * Display the specified vehicle
     * 
     * @param string $vehicleId
     * @return JsonResponse
     */
    public function show(string $vehicleId): JsonResponse
    {
        $vehicle = Vehicles::with(['vehicleType', 'assignments.jobOrder', 'assignments.driver', 'gpsLogs'])
            ->where('vehicle_id', $vehicleId)
            ->first();

        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $vehicle
        ], 200);
    }

    /**
     * Update the specified vehicle
     * 
     * @param Request $request
     * @param string $vehicleId
     * @return JsonResponse
     */
    public function update(Request $request, string $vehicleId): JsonResponse
    {
        $vehicle = Vehicles::where('vehicle_id', $vehicleId)->first();

        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle not found'
            ], 404);
        }

        $request->validate([
            'plate_no' => [
                'required',
                'string',
                'max:20',
                Rule::unique('vehicles', 'plate_no')->ignore($vehicle->vehicle_id, 'vehicle_id')
            ],
            'vehicle_type_id' => 'required|exists:vehicle_types,id',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'capacity_label' => 'nullable|string|max:100',
            'odometer_km' => 'nullable|integer|min:0',
            'status' => 'nullable|in:Available,In Use,Maintenance,Tidak Aktif',
            'condition_label' => 'nullable|in:Baru,Sangat Baik,Baik,Perlu Perbaikan',
            'driver_id' => 'nullable|exists:drivers,driver_id',
            'fuel_level_pct' => 'nullable|integer|min:0|max:100',
            'last_maintenance_date' => 'nullable|date',
            'next_maintenance_date' => 'nullable|date|after:last_maintenance_date'
        ]);

        // Handle driver_id - convert empty string to null
        $updateData = $request->only([
            'plate_no',
            'vehicle_type_id',
            'brand',
            'model',
            'year',
            'capacity_label',
            'odometer_km',
            'status',
            'condition_label',
            'fuel_level_pct',
            'last_maintenance_date',
            'next_maintenance_date'
        ]);
        
        // Add driver_id (convert empty string to null)
        $updateData['driver_id'] = $request->driver_id ?: null;
        
        $vehicle->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle updated successfully',
            'data' => $vehicle->load(['vehicleType', 'driver'])
        ], 200);
    }

    /**
     * Remove the specified vehicle
     * 
     * @param string $vehicleId
     * @return JsonResponse
     */
    public function destroy(string $vehicleId): JsonResponse
    {
        $vehicle = Vehicles::where('vehicle_id', $vehicleId)->first();

        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle not found'
            ], 404);
        }

        // Check if vehicle has active assignments
        $hasActiveAssignments = $vehicle->assignments()->where('status', 'Active')->exists();

        if ($hasActiveAssignments) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa menghapus kendaraan yang memiliki assignment aktif.'
            ], 422);
        }

        $vehicle->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vehicle deleted successfully'
        ], 200);
    }

    /**
     * Get available vehicles (not currently assigned)
     * 
     * Supports min_capacity filter to only show vehicles that can carry
     * the required weight (based on vehicle_types.capacity_max_kg)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getAvailable(Request $request): JsonResponse
    {
        // Validate optional min_capacity parameter
        $request->validate([
            'min_capacity' => 'nullable|numeric|min:0'
        ]);

        // Filter kendaraan yang statusnya 'Available', kondisi bukan 'Rusak', dan tidak memiliki assignment aktif 
        $query = Vehicles::with('vehicleType')
            ->where('status', 'Available')
            ->where('condition_label', '!=', 'Rusak')
            ->whereDoesntHave('assignments', function($q) {
                // Active assignment for active JobOrders
                $q->where('status', 'Active')
                  ->whereHas('jobOrder', function($jo) {
                      $jo->whereNotIn('status', ['Completed', 'Cancelled', 'Delivered']);
                  });
            })
            ->whereDoesntHave('manifests', function($q) {
                // Active assignment for active Manifests
                $q->whereNotIn('status', ['Completed', 'Cancelled', 'Delivered']);
            });

        // Filter by minimum capacity if provided
        // Only show vehicles whose vehicle type can carry at least min_capacity kg
        if ($request->filled('min_capacity')) {
            $minCapacity = (float) $request->min_capacity;
            $query->whereHas('vehicleType', function($q) use ($minCapacity) {
                $q->where('capacity_max_kg', '>=', $minCapacity);
            });
        }

        $vehicles = $query
            ->select('vehicle_id', 'plate_no', 'brand', 'model', 'vehicle_type_id', 'capacity_label', 'fuel_level_pct', 'driver_id')
            ->orderBy('plate_no')
            ->get()
            ->map(function ($vehicle) {
                $vehicle->license_plate = $vehicle->plate_no; // Alias for frontend compatibility
                return $vehicle;
            });

        return response()->json([
            'success' => true,
            'data' => $vehicles,
            'filter_applied' => $request->filled('min_capacity') ? [
                'min_capacity' => (float) $request->min_capacity
            ] : null
        ], 200);
    }

    /**
     * Update vehicle maintenance info
     * 
     * @param Request $request
     * @param string $vehicleId
     * @return JsonResponse
     */
    public function updateMaintenance(Request $request, string $vehicleId): JsonResponse
    {
        $vehicle = Vehicles::where('vehicle_id', $vehicleId)->first();

        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle not found'
            ], 404);
        }

        $request->validate([
            'last_maintenance_date' => 'required|date',
            'next_maintenance_date' => 'required|date|after:last_maintenance_date',
            'condition_label' => 'required|in:Baru,Sangat Baik,Baik,Perlu Perbaikan'
        ]);

        $vehicle->update([
            'last_maintenance_date' => $request->last_maintenance_date,
            'next_maintenance_date' => $request->next_maintenance_date,
            'condition_label' => $request->condition_label
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle maintenance info updated successfully',
            'data' => $vehicle
        ], 200);
    }
    /**
 * Get active vehicles with real-time status
 * 
 * @param Request $request
 * @return JsonResponse
 */
public function getActiveVehicles(Request $request): JsonResponse
{
    // Include driver relationship, vehicle type (for capacity), manifests with job orders, and assignments
    $vehicles = Vehicles::with(['driver', 'vehicleType', 'manifests' => function ($query) {
        // Get manifests that are in transit or on delivery
        $query->whereIn('status', ['In Transit', 'On Delivery'])
              ->with('jobOrders');
    }, 'assignments' => function ($query) {
        $query->where('status', 'Active')
              ->with(['driver', 'jobOrder']);
    }, 'gpsLogs' => function ($query) {
        $query->latest()->limit(1);
    }])->get();

    // Calculate total active load (Muatan Aktif) in Kg
    // Sum all goods_weight from Job Orders linked to Manifests with status "In Transit" or "On Delivery"
    $activeManifests = Manifests::whereIn('status', ['In Transit', 'On Delivery'])
        ->with('jobOrders')
        ->get();
    
    $totalActiveLoadKg = 0;
    foreach ($activeManifests as $manifest) {
        foreach ($manifest->jobOrders as $jo) {
            $totalActiveLoadKg += $jo->goods_weight ?? 0;
        }
    }
    // Convert to Ton
    $activeLoadTon = round($totalActiveLoadKg / 1000, 1);

    // Transform data
    $data = $vehicles->map(function ($vehicle) {
        $activeAssignment = $vehicle->assignments->first();
        $jobOrder = $activeAssignment ? $activeAssignment->jobOrder : null;
        // Use directly assigned driver first, fallback to assignment driver
        $assignmentDriver = $activeAssignment ? $activeAssignment->driver : null;
        $driver = $vehicle->driver ?? $assignmentDriver;
        $lastGps = $vehicle->gpsLogs->first();

        // Default values (Idle/Empty)
        // Show directly assigned driver even when vehicle is idle
        $displayDriver = $driver ? $driver->driver_name : '-';
        $displayRoute = '-';
        $displayLoad = '-';
        $displayEta = '-';
        $status = 'idle';
        $statusLabel = 'Idle';

        // Get vehicle max capacity from vehicle type
        $maxCapacityKg = $vehicle->vehicleType?->capacity_max_kg ?? 0;

        // Define active statuses that should show data
        $activeStatuses = ['Assigned', 'Pickup', 'On Delivery'];

        // Calculate active details
        $manifestNumber = '-';
        $totalWeightVal = 0;

        // Find active manifest (In Transit / On Delivery)
        $activeManifest = $vehicle->manifests->first(function($m) {
             return in_array($m->status, ['In Transit', 'On Delivery', 'Assigned']);
        });

        if ($activeManifest) {
            $manifestNumber = $activeManifest->manifest_id;
            // Calculate weight from manifest's job orders
            foreach ($activeManifest->jobOrders as $jo) {
                $totalWeightVal += $jo->goods_weight ?? 0;
            }
        } elseif ($jobOrder) {
            // Fallback to single Job Order weight if no manifest assignment found but has job order
             $totalWeightVal = $jobOrder->goods_weight ?? 0;
        }

        // Convert to Ton just for display data standardization (if needed by frontend directly)
        // But let's send raw weight/manifest for flexibility
        
        // Update display logic
        if ($jobOrder && in_array($jobOrder->status, $activeStatuses)) {
            $displayRoute = "{$jobOrder->pickup_city} - {$jobOrder->delivery_city}";
            
            // Calculate load percentage: (Total_JO_Weight / Max_Capacity) * 100%
            if ($maxCapacityKg > 0) {
                // Use totalWeightVal
                $loadWeight = $totalWeightVal > 0 ? $totalWeightVal : ($jobOrder->goods_weight ?? 0);
                $loadPercentage = min(100, round(($loadWeight / $maxCapacityKg) * 100));
                $displayLoad = $loadPercentage . '%';
            } else {
                $displayLoad = '-';
            }
            
            // Map Status logic (existing)
            if ($jobOrder->status === 'On Delivery') {
                $status = 'onRoute';
                $statusLabel = 'On Route';
            } elseif ($jobOrder->status === 'Pickup') {
                $status = 'loading';
                $statusLabel = 'Loading';
            } else {
                $status = 'assigned';
                $statusLabel = 'Assigned';
            }
        } else {
             if ($vehicle->status === 'Maintenance') {
                 $status = 'maintenance';
                 $statusLabel = 'Maintenance';
             }
        }

        return [
            'id' => $vehicle->vehicle_id,
            'vehicle' => $vehicle->plate_no,
            'driver' => $displayDriver,
            'route' => $displayRoute,
            'manifest' => $manifestNumber !== '-' ? $manifestNumber : null,
            'weight_kg' => $totalWeightVal, // Kirim raw KG agar frontend bisa format dinamis
            'max_capacity_kg' => $maxCapacityKg, // Kirim kapasitas max
            'eta' => $displayEta,
            'load' => $displayLoad,
            'status' => $status,
            'status_label' => $statusLabel,
            'lastUpdate' => $lastGps ? $lastGps->created_at->diffForHumans() : '-',
            'region' => 'jabodetabek',
        ];
    });

    return response()->json([
        'success' => true,
        'data' => $data,
        'summary' => [
            'active_load_ton' => $activeLoadTon,
        ]
    ], 200);
}

    /**
     * Get delivery history for Vehicle History page
     * Provides KPIs and a list of completed/cancelled deliveries
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getDeliveryHistory(Request $request): JsonResponse
    {
        // Determine date range based on filter
        $timeFilter = $request->get('time_filter', '30d');
        $dateFrom = match($timeFilter) {
            '30d' => Carbon::now()->subDays(30),
            '90d' => Carbon::now()->subDays(90),
            '12m' => Carbon::now()->subMonths(12),
            default => null, // 'all' - no date filter
        };

        // ==================== KPI CALCULATIONS ====================
        
        // 1. Pengiriman Selesai (Delivered Job Orders in period)
        $deliveredQuery = JobOrder::where('status', 'Delivered');
        if ($dateFrom) {
            $deliveredQuery->where('completed_at', '>=', $dateFrom);
        }
        $completedDeliveries = $deliveredQuery->count();

        // 2. Utilisasi Armada (Active vehicles in Manifests / Total Vehicles)
        $totalVehicles = Vehicles::whereNotIn('status', ['Tidak Aktif'])->count();
        $activeManifestVehicles = Manifests::whereNotIn('status', ['Completed', 'Cancelled', 'Delivered'])
            ->whereNotNull('vehicle_id')
            ->distinct('vehicle_id')
            ->count('vehicle_id');
        $fleetUtilization = $totalVehicles > 0 
            ? round(($activeManifestVehicles / $totalVehicles) * 100) 
            : 0;

        // 3. Total Muatan (Sum of goods_weight from Delivered Job Orders)
        $totalCargoQuery = JobOrder::where('status', 'Delivered');
        if ($dateFrom) {
            $totalCargoQuery->where('completed_at', '>=', $dateFrom);
        }
        $totalCargoKg = $totalCargoQuery->sum('goods_weight');
        $totalCargoTon = round($totalCargoKg / 1000, 1);

        // 4. Tepat Waktu (%) - On-time delivery rate
        // Comparing completed_at with ship_date
        $onTimeQuery = JobOrder::where('status', 'Delivered')
            ->whereNotNull('completed_at')
            ->whereNotNull('ship_date');
        if ($dateFrom) {
            $onTimeQuery->where('completed_at', '>=', $dateFrom);
        }
        
        $totalWithDates = (clone $onTimeQuery)->count();
        $onTimeCount = (clone $onTimeQuery)
            ->whereColumn('completed_at', '<=', \DB::raw("ship_date + INTERVAL '1 day'"))
            ->count();
        
        $onTimeRate = $totalWithDates > 0 
            ? round(($onTimeCount / $totalWithDates) * 100) 
            : 0;

        // ==================== HISTORY RECORDS ====================
        
        $historyQuery = JobOrder::with([
            'customer',
            'manifests.drivers',
            'manifests.vehicles',
            'assignments.driver',
            'assignments.vehicle'
        ])
        ->whereIn('status', ['Delivered', 'Cancelled']);

        // Apply date filter
        if ($dateFrom) {
            $historyQuery->where(function($q) use ($dateFrom) {
                $q->where('completed_at', '>=', $dateFrom)
                  ->orWhere('cancelled_at', '>=', $dateFrom);
            });
        }

        // Apply status filter
        $statusFilter = $request->get('status_filter');
        if ($statusFilter && $statusFilter !== 'all') {
            $historyQuery->where('status', ucfirst($statusFilter));
        }

        // Apply search filter
        $search = $request->get('search');
        if ($search) {
            $historyQuery->where(function($q) use ($search) {
                $q->where('job_order_id', 'ILIKE', "%{$search}%")
                  ->orWhere('goods_desc', 'ILIKE', "%{$search}%")
                  ->orWhere('pickup_city', 'ILIKE', "%{$search}%")
                  ->orWhere('delivery_city', 'ILIKE', "%{$search}%")
                  ->orWhereHas('manifests.vehicles', function($vq) use ($search) {
                      $vq->where('plate_no', 'ILIKE', "%{$search}%");
                  })
                  ->orWhereHas('manifests.drivers', function($dq) use ($search) {
                      $dq->where('driver_name', 'ILIKE', "%{$search}%");
                  })
                  ->orWhereHas('assignments.driver', function($dq) use ($search) {
                      $dq->where('driver_name', 'ILIKE', "%{$search}%");
                  })
                  ->orWhereHas('assignments.vehicle', function($vq) use ($search) {
                      $vq->where('plate_no', 'ILIKE', "%{$search}%");
                  });
            });
        }

        // Order by most recent first
        $historyQuery->orderByRaw('COALESCE(completed_at, cancelled_at, created_at) DESC');

        // Get paginated results
        $perPage = $request->get('per_page', 10);
        $history = $historyQuery->paginate($perPage);

        // Transform records for frontend
        $records = collect($history->items())->map(function($jo) {
            // Get driver and vehicle from manifest first, fallback to direct assignment
            $manifest = $jo->manifests->first();
            $assignment = $jo->assignments->first();
            
            $driver = $manifest?->drivers ?? $assignment?->driver;
            $vehicle = $manifest?->vehicles ?? $assignment?->vehicle;

            // Determine the relevant date
            $relevantDate = $jo->completed_at ?? $jo->cancelled_at ?? $jo->created_at;
            $daysAgo = $relevantDate ? Carbon::parse($relevantDate)->diffInDays(Carbon::now()) : 0;

            // Build activity description
            $activity = $jo->status === 'Delivered' 
                ? "Delivery selesai - {$jo->customer?->company_name}"
                : "Dibatalkan - {$jo->cancellation_reason}";

            return [
                'id' => $jo->job_order_id,
                'date' => $relevantDate ? Carbon::parse($relevantDate)->format('d M Y') : '-',
                'vehicle' => $vehicle?->plate_no ?? '-',
                'driver' => $driver?->driver_name ?? '-',
                'route' => "{$jo->pickup_city} → {$jo->delivery_city}",
                'activity' => $activity,
                'docNumber' => $jo->job_order_id,
                'status' => strtolower($jo->status),
                'daysAgo' => $daysAgo,
            ];
        });

        return response()->json([
            'success' => true,
            'kpi' => [
                'completed_deliveries' => $completedDeliveries,
                'fleet_utilization' => $fleetUtilization,
                'total_cargo_ton' => $totalCargoTon,
                'on_time_rate' => $onTimeRate,
            ],
            'records' => $records,
            'pagination' => [
                'current_page' => $history->currentPage(),
                'per_page' => $history->perPage(),
                'total' => $history->total(),
                'last_page' => $history->lastPage()
            ]
        ], 200);
    }
}