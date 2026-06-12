<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Manifests;
use App\Models\JobOrder;
use App\Models\JobOrderStatusHistory;
use App\Models\Admin;
use App\Models\Drivers;
use App\Models\Vehicles;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Services\FirebaseNotificationService;

/**
 * ManifestController - Controller untuk mengelola Manifest Pengiriman
 * 
 * Fungsi utama:
 * - Menampilkan daftar manifest dengan pencarian dan filter
 * - Membuat manifest baru dengan ID otomatis
 * - Menambahkan job orders ke dalam manifest
 * - Update status manifest (draft, finalized, in_transit, completed)
 * - Generate laporan manifest untuk driver
 * - Filter berdasarkan kota asal dan tujuan
 * - Tracking progress manifest dan cargo summary
 */
class ManifestController extends Controller
{
    protected $firebaseService;

    public function __construct(FirebaseNotificationService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }
    /**
     * Menampilkan daftar manifest dengan fitur pencarian dan filter
     * 
     * Fitur yang tersedia:
     * - Pencarian berdasarkan manifest ID, kota asal, kota tujuan, atau ringkasan cargo
     * - Filter berdasarkan status manifest (draft, finalized, in_transit, completed)
     * - Filter berdasarkan kota asal dan kota tujuan
     * - Include data creator dan job orders dengan customer
     * - Pagination dengan default 15 item per halaman
     * - Sorting berdasarkan tanggal pembuatan terbaru
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Manifests::with(['createdBy', 'jobOrders.customer', 'jobOrders.assignments.driver', 'jobOrders.assignments.vehicle', 'drivers', 'vehicles']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('manifest_id', 'ILIKE', "%{$search}%")
                ->orWhere('origin_city', 'ILIKE', "%{$search}%")
                ->orWhere('dest_city', 'ILIKE', "%{$search}%")
                ->orWhere('cargo_summary', 'ILIKE', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by origin city
        if ($request->filled('origin_city')) {
            $query->where('origin_city', 'ILIKE', "%{$request->origin_city}%");
        }

        // Filter by destination city
        if ($request->filled('dest_city')) {
            $query->where('dest_city', 'ILIKE', "%{$request->dest_city}%");
        }

        // Filter by date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('planned_departure', [$request->start_date, $request->end_date]);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $manifests = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // ============================================================
        // ✅ AGREGASI OTOMATIS: Recalculate cargo dari Job Orders
        // ============================================================
        // Setiap kali Manifest di-load, hitung ulang cargo_weight dan cargo_summary
        // dari Job Orders yang terikat untuk memastikan data selalu akurat
        $manifestItems = $manifests->getCollection()->map(function ($manifest) {
            $jobOrders = $manifest->jobOrders;
            
            if ($jobOrders->isNotEmpty()) {
                // Hitung total dari SEMUA Job Orders (termasuk Cancelled untuk audit)
                $totalWeight = $jobOrders->sum('goods_weight');
                $totalKoli = $jobOrders->sum('goods_qty');
                
                // Buat cargo summary
                $cargoSummary = $jobOrders->count() . ' packages';
                if ($jobOrders->count() > 0) {
                    $descriptions = $jobOrders->pluck('goods_desc')->unique()->take(3);
                    $cargoSummary .= ': ' . $descriptions->implode(', ');
                    if ($jobOrders->count() > 3) {
                        $cargoSummary .= ', etc.';
                    }
                }
                
                // Update manifest object (in-memory, untuk response)
                $manifest->cargo_weight = $totalWeight;
                $manifest->cargo_summary = $cargoSummary;
                
                // ✅ OPTIONAL: Update database jika berbeda (untuk data consistency)
                if ($manifest->isDirty(['cargo_weight', 'cargo_summary'])) {
                    $manifest->saveQuietly(); // saveQuietly to avoid triggering observers
                }
            }
            
            return $manifest;
        });

        // Replace collection with updated data
        $manifests->setCollection($manifestItems);

        return response()->json([
            'success' => true,
            'data' => $manifests->items(),
            'pagination' => [
                'current_page' => $manifests->currentPage(),
                'per_page' => $manifests->perPage(),
                'total' => $manifests->total(),
                'last_page' => $manifests->lastPage()
            ]
        ], 200);
    }

    /**
     * Store a newly created manifest
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {

        $request->validate([
            'origin_city' => 'required|string|max:255',
            'dest_city' => 'required|string|max:255',
            'cargo_summary' => 'nullable|string',
            'cargo_weight' => 'nullable|numeric|min:0',
            'planned_departure' => 'nullable|date',
            'planned_arrival' => 'nullable|date|after:planned_departure',
            'job_order_ids' => 'nullable|array',
            'job_order_ids.*' => 'exists:job_orders,job_order_id',
            'driver_id' => 'nullable|exists:drivers,driver_id',
            'vehicle_id' => 'nullable|exists:vehicles,vehicle_id',
            // ✅ NEW: Catatan tambahan untuk assignment (LTL scenario)
            'assignment_note' => 'nullable|string|max:500',
        ]);

        // Generate unique manifest_id
        $manifestId = 'MF-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        while (Manifests::where('manifest_id', $manifestId)->exists()) {
            $manifestId = 'MF-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        }

        $manifest = Manifests::create([
            'manifest_id' => $manifestId,
            'origin_city' => $request->origin_city,
            'dest_city' => $request->dest_city,
            'cargo_summary' => $request->cargo_summary,
            'cargo_weight' => $request->cargo_weight,
            'planned_departure' => $request->planned_departure,
            'planned_arrival' => $request->planned_arrival,
            'driver_id' => $request->driver_id,
            'vehicle_id' => $request->vehicle_id,
            'status' => 'Pending',
            'created_by' => Auth::id() ?? Admin::first()->user_id ?? '1'
        ]);

        // Attach job orders if provided
        $jobOrderIds = $request->job_order_ids ?? [];
        
        if (!empty($jobOrderIds) && is_array($jobOrderIds)) {
            $manifest->jobOrders()->attach($jobOrderIds);
            
            // ✅ Update Status Job Order menjadi 'Assigned'
            JobOrder::whereIn('job_order_id', $jobOrderIds)
                ->whereIn('status', ['Created', 'Pending'])
                ->update(['status' => 'Assigned']);

            // ✅ Create Status History for each Job Order - Added to Manifest
            foreach ($jobOrderIds as $jobOrderId) {
                $this->createStatusHistory(
                    $jobOrderId,
                    'In Manifest',
                    "Job Order ditambahkan ke Manifest {$manifestId}",
                    'System'
                );
            }

            \Log::info("Manifest {$manifest->manifest_id} created with " . count($jobOrderIds) . " job orders. Status updated to Assigned.");
                
            // Update cargo summary based on attached job orders
            $this->updateManifestCargo($manifest);
        } else {
            \Log::warning("Manifest {$manifest->manifest_id} created WITHOUT job orders. job_order_ids was: " . json_encode($jobOrderIds));
        }

        // ✅ Create Status History if driver/vehicle assigned
        if ($request->driver_id || $request->vehicle_id) {
            $this->createDriverAssignmentHistory($manifest, $jobOrderIds, $request->driver_id, $request->vehicle_id, $request->assignment_note);
            
            // 🔔 Send Push Notification to Driver
            if ($request->driver_id) {
                $this->firebaseService->sendToDriver(
                    $request->driver_id,
                    'Tugas Baru Diassign! 🚚',
                    "Anda telah ditugaskan untuk Manifest {$manifest->manifest_id} ke {$manifest->dest_city}",
                    [
                        'type' => 'manifest_assignment',
                        'manifest_id' => $manifest->manifest_id,
                        'origin' => $manifest->origin_city,
                        'destination' => $manifest->dest_city
                    ]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Manifest created successfully',
            'data' => $manifest->refresh()->load(['createdBy', 'jobOrders.customer', 'drivers', 'vehicles'])
        ], 201);
    }

    /**
     * Display the specified manifest
     * 
     * @param string $manifestId
     * @return JsonResponse
     */
    public function show(string $manifestId): JsonResponse
    {
        $manifest = Manifests::with([
            'createdBy', 
            'jobOrders.customer',
            'jobOrders.assignments.driver',
            'jobOrders.assignments.vehicle',
            'drivers',
            'vehicles'
        ])->where('manifest_id', $manifestId)->first();

        if (!$manifest) {
            return response()->json([
                'success' => false,
                'message' => 'Manifest not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $manifest
        ], 200);
    }

    /**
     * Update the specified manifest
     * 
     * @param Request $request
     * @param string $manifestId
     * @return JsonResponse
     */
    public function update(Request $request, string $manifestId): JsonResponse
    {
        $manifest = Manifests::where('manifest_id', $manifestId)->first();

        if (!$manifest) {
            return response()->json([
                'success' => false,
                'message' => 'Manifest tidak ditemukan'
            ], 404);
        }

        // Store old values for comparison
        $oldDriverId = $manifest->driver_id;
        $oldVehicleId = $manifest->vehicle_id;

        $request->validate([
            'origin_city' => 'required|string|max:255',
            'dest_city' => 'required|string|max:255',
            'cargo_summary' => 'nullable|string',
            'cargo_weight' => 'nullable|numeric|min:0',
            'planned_departure' => 'nullable|date',
            'planned_arrival' => 'nullable|date|after:planned_departure',
            'status' => 'in:Pending,In Transit,Arrived,Completed',
            'job_order_ids' => 'nullable|array',
            'job_order_ids.*' => 'exists:job_orders,job_order_id',
            'driver_id' => 'nullable|exists:drivers,driver_id',
            'vehicle_id' => 'nullable|exists:vehicles,vehicle_id',
            // ✅ NEW: Catatan tambahan untuk assignment (LTL scenario)
            'assignment_note' => 'nullable|string|max:500',
        ]);

        $manifest->update($request->only([
            'origin_city',
            'dest_city',
            'cargo_summary',
            'cargo_weight',
            'planned_departure',
            'planned_arrival',
            'status',
            'driver_id',
            'vehicle_id'
        ]));

        // Sync Job Orders if provided
        $allJobOrderIds = [];
        if ($request->has('job_order_ids')) {
            $jobOrderIds = $request->job_order_ids ?? [];
            
            // Sync returns array of attached, detached, updated IDs
            $syncResult = $manifest->jobOrders()->sync($jobOrderIds);
            
            if (!empty($syncResult['attached'])) {
                // ✅ Update Status Job Order yang baru di-attach menjadi 'Assigned'
                JobOrder::whereIn('job_order_id', $syncResult['attached'])
                    ->whereIn('status', ['Created', 'Pending'])
                    ->update(['status' => 'Assigned']);

                // ✅ Create Status History for newly attached Job Orders
                foreach ($syncResult['attached'] as $jobOrderId) {
                    $this->createStatusHistory(
                        $jobOrderId,
                        'In Manifest',
                        "Job Order ditambahkan ke Manifest {$manifestId}",
                        'System'
                    );
                }

                \Log::info("Manifest {$manifest->manifest_id} update: Attached " . count($syncResult['attached']) . " job orders. Status updated to Assigned.");
            }
            
            if (!empty($syncResult['detached'])) {
                \Log::info("Manifest {$manifest->manifest_id} update: Detached " . count($syncResult['detached']) . " job orders.");
            }
            
            // Update cargo summary based on current job orders
            $this->updateManifestCargo($manifest);
            
            $allJobOrderIds = $jobOrderIds;
        } else {
            // Get existing job order IDs if not provided in request
            $allJobOrderIds = $manifest->jobOrders()->pluck('job_orders.job_order_id')->toArray();
        }

        // ✅ Check if driver/vehicle assignment changed
        $driverChanged = $request->driver_id && $request->driver_id !== $oldDriverId;
        $vehicleChanged = $request->vehicle_id && $request->vehicle_id !== $oldVehicleId;
        
        if (($driverChanged || $vehicleChanged) && !empty($allJobOrderIds)) {
            $this->createDriverAssignmentHistory($manifest, $allJobOrderIds, $request->driver_id, $request->vehicle_id, $request->assignment_note);
        }

        // 🔔 Send Push Notification if Driver Changed or Assigned
        if ($driverChanged && $request->driver_id) {
            $this->firebaseService->sendToDriver(
                $request->driver_id,
                'Update Tugas Manifest 🚚',
                "Anda telah ditugaskan untuk Manifest {$manifest->manifest_id} ke {$manifest->dest_city}",
                [
                    'type' => 'manifest_assignment',
                    'manifest_id' => $manifest->manifest_id,
                    'origin' => $manifest->origin_city,
                    'destination' => $manifest->dest_city
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Manifest updated successfully',
            'data' => $manifest->refresh()->load(['createdBy', 'jobOrders.customer', 'drivers', 'vehicles'])
        ], 200);
    }

    /**
     * Update only the status of the specified manifest
     * Used for status transitions like Pending -> In Transit, In Transit -> Arrived, etc.
     * 
     * @param Request $request
     * @param string $manifestId
     * @return JsonResponse
     */
    public function updateStatus(Request $request, string $manifestId): JsonResponse
    {
        $manifest = Manifests::where('manifest_id', $manifestId)->first();

        if (!$manifest) {
            return response()->json([
                'success' => false,
                'message' => 'Manifest tidak ditemukan'
            ], 404);
        }

        $request->validate([
            'status' => 'required|in:Pending,In Transit,Arrived,Completed'
        ]);

        $oldStatus = $manifest->status;
        $newStatus = $request->status;

        // Validate status transitions
        $validTransitions = [
            'Pending' => ['In Transit', 'Cancelled'],
            'In Transit' => ['Arrived', 'Cancelled'],
            'Arrived' => ['Completed', 'Cancelled'],
            'Completed' => [], // Cannot transition from Completed
            'Cancelled' => [], // Cannot transition from Cancelled
        ];

        if (!in_array($newStatus, $validTransitions[$oldStatus] ?? [])) {
            return response()->json([
                'success' => false,
                'message' => "Tidak dapat mengubah status dari {$oldStatus} ke {$newStatus}"
            ], 422);
        }

        // Update status
        $updateData = ['status' => $newStatus];

        // Add timestamp fields based on status
        if ($newStatus === 'In Transit') {
            $updateData['departed_at'] = now();
        } elseif ($newStatus === 'Arrived') {
            $updateData['arrived_at'] = now();
        } elseif ($newStatus === 'Completed') {
            $updateData['completed_at'] = now();
        }

        $manifest->update($updateData);

        // Update Job Order statuses based on manifest status
        $jobOrderIds = $manifest->jobOrders()->pluck('job_orders.job_order_id')->toArray();
        
        if (!empty($jobOrderIds)) {
            $jobOrderStatus = match($newStatus) {
                'In Transit' => 'On Delivery',
                'Arrived' => 'Arrived',
                'Completed' => 'Completed',
                default => 'In Manifest'
            };
            
            JobOrder::whereIn('job_order_id', $jobOrderIds)
                ->update(['status' => $jobOrderStatus]);
        }

        return response()->json([
            'success' => true,
            'message' => "Status manifest berhasil diubah dari {$oldStatus} ke {$newStatus}",
            'data' => $manifest->refresh()->load(['createdBy', 'jobOrders.customer', 'drivers', 'vehicles'])
        ], 200);
    }

    /**
     * Remove the specified manifest
     * 
     * @param string $manifestId
     * @return JsonResponse
     */
    public function destroy(string $manifestId): JsonResponse
    {
        $manifest = Manifests::where('manifest_id', $manifestId)->first();

        if (!$manifest) {
            return response()->json([
                'success' => false,
                'message' => 'Manifest not found'
            ], 404);
        }

        // Check if manifest has job orders
        $hasJobOrders = $manifest->jobOrders()->exists();

        if ($hasJobOrders) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete manifest. It has associated job orders.'
            ], 422);
        }

        $manifest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Manifest deleted successfully'
        ], 200);
    }

    /**
     * Add job orders to manifest
     * 
     * @param Request $request
     * @param string $manifestId
     * @return JsonResponse
     */
    public function addJobOrders(Request $request, string $manifestId): JsonResponse
    {
        try {
            $manifest = Manifests::where('manifest_id', $manifestId)->first();

            if (!$manifest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Manifest not found'
                ], 404);
            }

            $request->validate([
                'job_order_ids' => 'required|array|min:1',
                'job_order_ids.*' => 'exists:job_orders,job_order_id'
            ]);

            // Check if job orders are already in another manifest
            $alreadyInManifest = DB::table('manifest_jobs')
                ->whereIn('job_order_id', $request->job_order_ids)
                ->where('manifest_id', '!=', $manifestId)
                ->pluck('job_order_id')
                ->toArray();

            if (count($alreadyInManifest) > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Some job orders are already assigned to another manifest',
                    'already_assigned' => $alreadyInManifest
                ], 422);
            }

            // Attach job orders (syncWithoutDetaching untuk tidak hapus yang sudah ada)
            $manifest->jobOrders()->syncWithoutDetaching($request->job_order_ids);

            // ✅ Update Status Job Order menjadi 'Assigned'
            JobOrder::whereIn('job_order_id', $request->job_order_ids)
                ->whereIn('status', ['Created', 'Pending'])
                ->update(['status' => 'Assigned']);

            // ✅ Create Status History for each added Job Order
            foreach ($request->job_order_ids as $jobOrderId) {
                $this->createStatusHistory(
                    $jobOrderId,
                    'In Manifest',
                    "Job Order ditambahkan ke Manifest {$manifestId}",
                    'System'
                );
            }

            // Update cargo summary and weight
            $this->updateManifestCargo($manifest);

            // Reload manifest with job orders
            $manifest->load(['jobOrders.customer']);

            return response()->json([
                'success' => true,
                'message' => count($request->job_order_ids) . ' job order(s) added to manifest successfully',
                'data' => [
                    'manifest_id' => $manifestId,
                    'total_job_orders' => $manifest->jobOrders->count(),
                    'total_weight' => $manifest->cargo_weight,
                    'job_orders' => $manifest->jobOrders->map(function($jo) {
                        return [
                            'job_order_id' => $jo->job_order_id,
                            'customer_name' => $jo->customer->customer_name ?? null,
                            'goods_weight' => $jo->goods_weight,
                            'order_value' => $jo->order_value,
                        ];
                    })
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add job orders to manifest',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove job orders from manifest
     * 
     * @param Request $request
     * @param string $manifestId
     * @return JsonResponse
     */
    public function removeJobOrders(Request $request, string $manifestId): JsonResponse
    {
        try {
            $manifest = Manifests::where('manifest_id', $manifestId)->first();

            if (!$manifest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Manifest not found'
                ], 404);
            }

            $request->validate([
                'job_order_ids' => 'required|array|min:1',
                'job_order_ids.*' => 'exists:job_orders,job_order_id'
            ]);

            // Check if job orders exist in this manifest
            $jobOrdersInManifest = DB::table('manifest_jobs')
                ->where('manifest_id', $manifestId)
                ->whereIn('job_order_id', $request->job_order_ids)
                ->pluck('job_order_id')
                ->toArray();

            if (count($jobOrdersInManifest) === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'None of the specified job orders are in this manifest'
                ], 422);
            }

            // Detach job orders
            $manifest->jobOrders()->detach($request->job_order_ids);

            // Update job order status kembali ke "Assigned"
            JobOrder::whereIn('job_order_id', $request->job_order_ids)
                ->update(['status' => 'Assigned']);

            // Update cargo summary and weight
            $this->updateManifestCargo($manifest);

            // Reload manifest
            $manifest->load(['jobOrders.customer']);

            return response()->json([
                'success' => true,
                'message' => count($jobOrdersInManifest) . ' job order(s) removed from manifest successfully',
                'data' => [
                    'manifest_id' => $manifestId,
                    'removed_job_orders' => $jobOrdersInManifest,
                    'total_job_orders' => $manifest->jobOrders->count(),
                    'total_weight' => $manifest->cargo_weight,
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove job orders from manifest',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available job orders that are not yet assigned to any manifest
     * 
     * @param string $manifest_id
     * @return JsonResponse
     */
    public function getAvailableJobOrders(string $manifest_id): JsonResponse
    {
        try {
            // ✅ Cek apakah manifest ada (skip jika 'new' atau 'create')
            $manifest = null;
            if ($manifest_id !== 'new' && $manifest_id !== 'create') {
                $manifest = Manifests::where('manifest_id', $manifest_id)->first();

                if (!$manifest) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Manifest tidak ditemukan'
                    ], 404);
                }
            }

            // ✅ Get job orders yang:
            // 1. Status = 'Pending', 'Created' atau 'Assigned' (siap untuk dimasukkan ke manifest)
            //    - 'Pending' ditambahkan untuk backward compatibility dengan data lama
            // 2. Belum masuk ke manifest manapun
            $availableJobOrders = JobOrder::with(['customer', 'assignments.driver', 'assignments.vehicle'])
                ->whereIn('status', ['Pending', 'Created', 'Assigned'])
                ->whereNotIn('job_order_id', function($query) {
                    $query->select('job_order_id')
                        ->from('manifest_jobs');
                })
                ->get()
                ->map(function($jobOrder) {
                // ✅ Ambil assignment yang berstatus 'Active' (prioritas untuk auto-fill)
                $assignment = $jobOrder->assignments->firstWhere('status', 'Active');
                
                // Fallback: Jika tidak ada Active, coba ambil yang pertama (untuk backward compatibility)
                if (!$assignment) {
                    $assignment = $jobOrder->assignments->first();
                }

                return [
                    'job_order_id' => $jobOrder->job_order_id,
                    'customer_name' => $jobOrder->customer->customer_name ?? null,
                    'order_type' => $jobOrder->order_type,
                    'pickup_address' => $jobOrder->pickup_address,
                    'pickup_city' => $jobOrder->pickup_city,         // ✅ Added for route calculation
                    'delivery_address' => $jobOrder->delivery_address,
                    'delivery_city' => $jobOrder->delivery_city,     // ✅ Added for route calculation
                    'goods_desc' => $jobOrder->goods_desc,
                    'goods_qty' => $jobOrder->goods_qty ?? 1,        // ✅ Added for Total Packages (Koli)
                    'goods_weight' => $jobOrder->goods_weight,
                    'ship_date' => $jobOrder->ship_date,
                    'order_value' => $jobOrder->order_value,
                    'status' => $jobOrder->status,
                    'pickup_datetime' => $jobOrder->pickup_datetime ?? $jobOrder->ship_date,  // ✅ For route sorting
                    'delivery_datetime_estimation' => $jobOrder->delivery_datetime_estimation ?? $jobOrder->ship_date,  // ✅ For route sorting
                    // ✅ FIXED: Include assignment data with correct field names for auto-fill
                    'assignment' => $assignment ? [
                        'driver_id' => $assignment->driver_id,
                        'driver_name' => $assignment->driver->driver_name ?? null,
                        'vehicle_id' => $assignment->vehicle_id,
                        'vehicle_plate' => $assignment->vehicle->plate_no ?? null,  // ✅ FIXED: Use plate_no, not license_plate
                        'status' => $assignment->status,  // ✅ Include status for frontend filtering
                    ] : null,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Job Orders yang tersedia berhasil diambil',
                'data' => [
                    'manifest_id' => $manifest_id,
                    'manifest_route' => $manifest ? ($manifest->origin_city . ' - ' . $manifest->dest_city) : 'New Manifest',
                    'available_job_orders' => $availableJobOrders,
                    'total_available' => $availableJobOrders->count(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'gagal mengambil job orders yang tersedia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ============================================================
     * CANCEL MANIFEST - CANCELLATION LOGIC (BLUEPRINT)
     * ============================================================
     * 
     * Artinya: Armada batal berangkat (mogok, supir sakit, atau kurang muatan)
     * 
     * DAMPAK:
     * - Manifest: Berubah jadi Cancelled statusnya
     * - Job Order: JANGAN Cancelled! Ubah status mundur ke "Pending" dan set manifest_id = NULL
     *              (Barang kembali ke gudang/Pool menunggu truk pengganti)
     *              Data driver & armada dihilangkan/dihapus dari JO karena status berubah ke Pending
     * - Delivery Order: Wajib Cancelled karena DO berisi data Driver & Plat Nomor dari manifest
     *                   yang batal, dokumen itu sudah tidak valid (sampah)
     * 
     * @param Request $request
     * @param string $manifestId
     * @return JsonResponse
     */
    public function cancel(Request $request, string $manifestId): JsonResponse
    {
        try {
            $manifest = Manifests::with(['jobOrders', 'drivers', 'vehicles'])->where('manifest_id', $manifestId)->first();

            if (!$manifest) {
                return response()->json([
                    'success' => false,
                    'message' => 'Manifest tidak ditemukan'
                ], 404);
            }

            if ($manifest->status === 'Cancelled') {
                return response()->json([
                    'success' => false,
                    'message' => 'Manifest sudah dibatalkan sebelumnya'
                ], 422);
            }

            // Get cancellation reason from request
            $cancellationReason = $request->input('cancellation_reason', 'Armada batal berangkat');

            // Get all job order IDs currently in this manifest
            $jobOrderIds = $manifest->jobOrders()->pluck('job_orders.job_order_id')->toArray();

            // ============================================================
            // 1. CANCEL DELIVERY ORDERS yang terkait dengan Manifest ini (Hangus Otomatis)
            // ============================================================
            $cancelledDOs = [];

            // 1a. Cancel DO dengan source_type = 'MF' dan source_id = manifestId
            $manifestDOs = \App\Models\DeliveryOrder::where('source_type', 'MF')
                ->where('source_id', $manifestId)
                ->where('status', '!=', 'Cancelled')
                ->get();

            foreach ($manifestDOs as $do) {
                $do->update([
                    'status' => 'Cancelled',
                    'cancelled_at' => now(),
                    'cancellation_reason' => "Manifest {$manifestId} dibatalkan: {$cancellationReason}"
                ]);
                $cancelledDOs[] = $do->do_id;
                \Log::info("[CANCEL MANIFEST] Cancelled DO (MF source): {$do->do_id}");
            }

            // 1b. Cancel DO dengan source_type = 'MF' dan selected_job_order_id dari JO dalam manifest ini (LTL)
            if (!empty($jobOrderIds)) {
                $ltlDOs = \App\Models\DeliveryOrder::where('source_type', 'MF')
                    ->whereIn('selected_job_order_id', $jobOrderIds)
                    ->where('status', '!=', 'Cancelled')
                    ->get();

                foreach ($ltlDOs as $do) {
                    $do->update([
                        'status' => 'Cancelled',
                        'cancelled_at' => now(),
                        'cancellation_reason' => "Manifest {$manifestId} dibatalkan (LTL): {$cancellationReason}"
                    ]);
                    if (!in_array($do->do_id, $cancelledDOs)) {
                        $cancelledDOs[] = $do->do_id;
                    }
                    \Log::info("[CANCEL MANIFEST] Cancelled DO (LTL selected JO): {$do->do_id}");
                }
            }

            // ✅ 1c. NEW: Cancel DO dengan source_type = 'JO' dimana Job Order-nya ada dalam manifest ini
            // Ini untuk kasus dimana DO dibuat langsung dari Job Order (FTL) yang kemudian dimasukkan ke Manifest
            if (!empty($jobOrderIds)) {
                $joDOs = \App\Models\DeliveryOrder::where('source_type', 'JO')
                    ->whereIn('source_id', $jobOrderIds)
                    ->where('status', '!=', 'Cancelled')
                    ->get();

                foreach ($joDOs as $do) {
                    $do->update([
                        'status' => 'Cancelled',
                        'cancelled_at' => now(),
                        'cancellation_reason' => "Manifest {$manifestId} dibatalkan (JO dalam Manifest): {$cancellationReason}"
                    ]);
                    if (!in_array($do->do_id, $cancelledDOs)) {
                        $cancelledDOs[] = $do->do_id;
                    }
                    \Log::info("[CANCEL MANIFEST] Cancelled DO (JO source in Manifest): {$do->do_id}");
                }
            }

            // ============================================================
            // 2. RESET JOB ORDERS ke status "Pending" (Reset & Cari Truk Baru)
            // ============================================================
            $resetJobOrders = [];

            if (!empty($jobOrderIds)) {
                foreach ($jobOrderIds as $jobOrderId) {
                    $jobOrder = JobOrder::where('job_order_id', $jobOrderId)->first();
                    
                    if ($jobOrder && $jobOrder->status !== 'Cancelled') {
                        // Reset status ke Pending
                        $jobOrder->update(['status' => 'Pending']);

                        // Create status history
                        $this->createStatusHistory(
                            $jobOrderId,
                            'Pending',
                            "Manifest {$manifestId} dibatalkan. Job Order dikembalikan ke antrian untuk dijadwalkan ulang.",
                            'System'
                        );

                        $resetJobOrders[] = $jobOrderId;
                    }
                }

                // Deactivate/Cancel all assignments for these job orders
                // (Hapus data driver & armada karena manifest batal)
                \App\Models\Assignment::whereIn('job_order_id', $jobOrderIds)
                    ->where('status', 'Active')
                    ->update(['status' => 'Cancelled']);
            }

            // ============================================================
            // 3. DETACH ALL JOB ORDERS dari Manifest
            // ============================================================
            $manifest->jobOrders()->detach();

            // ============================================================
            // 4. UPDATE MANIFEST STATUS ke Cancelled
            // ============================================================
            // ✅ Reset cargo_weight ke 0 dan cargo_summary ke "0 packages"
            // Manifest adalah "wadah/kontainer" - jika semua Job Order dikembalikan,
            // maka truk harus terlihat KOSONG (0 Koli, 0 Berat, 0 Packages)
            // Driver & Armada TETAP dipertahankan untuk keperluan audit
            $manifest->update([
                'status' => 'Cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => $cancellationReason,
                'cargo_weight' => 0,           // Reset berat ke 0
                'cargo_summary' => '0 packages' // Reset packages ke 0
            ]);

            \Log::info("[CANCEL MANIFEST] Manifest {$manifestId} dibatalkan", [
                'reset_job_orders' => $resetJobOrders,
                'cancelled_dos' => $cancelledDOs,
                'reason' => $cancellationReason
            ]);

            return response()->json([
                'success' => true,
                'message' => "Manifest berhasil dibatalkan. {$this->formatCancelSummary(count($resetJobOrders), count($cancelledDOs))}",
                'data' => [
                    'manifest_id' => $manifestId,
                    'status' => 'Cancelled',
                    'cancelled_at' => now()->toISOString(),
                    'cancellation_reason' => $cancellationReason,
                    'reset_job_orders' => $resetJobOrders,
                    'cancelled_delivery_orders' => $cancelledDOs
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error("[CANCEL MANIFEST] Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan Manifest',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper: Format cancel summary message
     */
    private function formatCancelSummary(int $joCount, int $doCount): string
    {
        $parts = [];
        if ($joCount > 0) {
            $parts[] = "{$joCount} Job Order dikembalikan ke antrian";
        }
        if ($doCount > 0) {
            $parts[] = "{$doCount} Delivery Order dibatalkan";
        }
        return implode(', ', $parts) . '.';
    }

    /**
     * Update manifest cargo information based on job orders
     * 
     * @param Manifests $manifest
     * @return void
     */
    private function updateManifestCargo(Manifests $manifest): void
    {
        $jobOrders = $manifest->jobOrders;
        
        $totalWeight = $jobOrders->sum('goods_weight');
        $cargoSummary = $jobOrders->count() . ' packages';
        
        if ($jobOrders->count() > 0) {
            $descriptions = $jobOrders->pluck('goods_desc')->unique()->take(3);
            $cargoSummary .= ': ' . $descriptions->implode(', ');
            if ($jobOrders->count() > 3) {
                $cargoSummary .= ', etc.';
            }
        }

        $manifest->update([
            'cargo_weight' => $totalWeight,
            'cargo_summary' => $cargoSummary
        ]);
    }

    /**
     * Create a status history entry for a Job Order
     * 
     * @param string $jobOrderId
     * @param string $status
     * @param string $notes
     * @param string $triggerType
     * @return void
     */
    private function createStatusHistory(string $jobOrderId, string $status, string $notes, string $triggerType = 'System'): void
    {
        try {
            JobOrderStatusHistory::create([
                'job_order_id' => $jobOrderId,
                'status' => $status,
                'notes' => $notes,
                'trigger_type' => $triggerType,
                'changed_by' => Auth::id() ?? 'System',
                'changed_at' => now()
            ]);
        } catch (\Exception $e) {
            \Log::error("Failed to create status history for Job Order {$jobOrderId}: " . $e->getMessage());
        }
    }

    /**
     * Create status history entries for driver/vehicle assignment on Manifest
     * 
     * @param Manifests $manifest
     * @param array $jobOrderIds
     * @param string|null $driverId
     * @param string|null $vehicleId
     * @param string|null $assignmentNote - ✅ NEW: Catatan tambahan dari form (LTL scenario)
     * @return void
     */
    private function createDriverAssignmentHistory(Manifests $manifest, array $jobOrderIds, ?string $driverId, ?string $vehicleId, ?string $assignmentNote = null): void
    {
        if (empty($jobOrderIds)) {
            return;
        }

        // Get driver and vehicle names
        $driverName = 'Belum Ditugaskan';
        $vehiclePlate = 'Belum Ditugaskan';

        if ($driverId) {
            $driver = Drivers::find($driverId);
            $driverName = $driver ? $driver->driver_name : $driverId;
        }

        if ($vehicleId) {
            $vehicle = Vehicles::find($vehicleId);
            $vehiclePlate = $vehicle ? $vehicle->plate_no : $vehicleId;
        }

        // Build notes
        $notes = "Driver & Kendaraan ditugaskan via Manifest {$manifest->manifest_id}";
        if ($driverId) {
            $notes .= " - Driver: {$driverName}";
        }
        if ($vehicleId) {
            $notes .= " - Kendaraan: {$vehiclePlate}";
        }
        
        // ✅ NEW: Append custom assignment note if provided (LTL scenario)
        if ($assignmentNote && trim($assignmentNote) !== '') {
            $notes .= " | Catatan: " . trim($assignmentNote);
        }

        // Create status history for each Job Order in the manifest
        // ✅ SKIP FTL Job Orders - FTL already has its own driver assignment via Job Order page
        foreach ($jobOrderIds as $jobOrderId) {
            $jobOrder = JobOrder::where('job_order_id', $jobOrderId)->first();
            
            // Skip FTL type Job Orders - they have their own driver assignment flow
            if ($jobOrder && $jobOrder->order_type === 'FTL') {
                \Log::info("Skipped driver assignment history for FTL Job Order {$jobOrderId} (via Manifest {$manifest->manifest_id})");
                continue;
            }
            
            $this->createStatusHistory(
                $jobOrderId,
                'Driver Assigned',
                $notes,
                'System'
            );
        }

        \Log::info("Created driver assignment history for LTL job orders in Manifest {$manifest->manifest_id} (FTL orders skipped)" . ($assignmentNote ? " - Custom Note: {$assignmentNote}" : ""));
    }
}