<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryOrder;
use App\Models\JobOrder;
use App\Models\Manifests;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Services\FirebaseNotificationService;

/**
 * DeliveryOrderController - Controller untuk mengelola Delivery Order (DO)
 * 
 * Fungsi utama:
 * - Menampilkan daftar delivery order dengan pencarian dan filter
 * - Membuat delivery order baru dengan nomor otomatis
 * - Melihat detail delivery order dan relasi job orders
 * - Mengupdate status dan data delivery order
 * - Menghapus delivery order
 * - Filter berdasarkan status, customer, dan tipe sumber
 * - Tracking dan monitoring delivery progress
 */
class DeliveryOrderController extends Controller
{
    protected $firebaseService;

    public function __construct(FirebaseNotificationService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }
    /**
     * Menampilkan daftar delivery order dengan fitur pencarian dan filter
     * 
     * Fitur yang tersedia:
     * - Pencarian berdasarkan DO ID, source ID, ringkasan barang, atau nama customer
     * - Filter berdasarkan status delivery (pending, in_progress, delivered, dll)
     * - Filter berdasarkan customer tertentu
     * - Filter berdasarkan tipe sumber (manual, import, system)
     * - Pagination dengan default 15 item per halaman
     * - Include data customer dan creator
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = DeliveryOrder::with(['customer', 'createdBy']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('do_id', 'ILIKE', "%{$search}%")
                ->orWhere('source_id', 'ILIKE', "%{$search}%")
                ->orWhere('goods_summary', 'ILIKE', "%{$search}%")
                ->orWhereHas('customer', function($customerQuery) use ($search) {
                    $customerQuery->where('customer_name', 'ILIKE', "%{$search}%");
                });
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by customer
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Filter by source type
        if ($request->filled('source_type')) {
            $query->where('source_type', $request->source_type);
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filter by date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('do_date', [$request->start_date, $request->end_date]);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $deliveryOrders = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Add source information to each delivery order
        $deliveryOrders->getCollection()->transform(function ($deliveryOrder) {
            $deliveryOrder->source_info = $deliveryOrder->getSourceAttribute();
            return $deliveryOrder;
        });

        return response()->json([
            'success' => true,
            'data' => $deliveryOrders->items(),
            'pagination' => [
                'current_page' => $deliveryOrders->currentPage(),
                'per_page' => $deliveryOrders->perPage(),
                'total' => $deliveryOrders->total(),
                'last_page' => $deliveryOrders->lastPage()
            ]
        ], 200);
    }

    /**
     * Store a newly created delivery order
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'source_type' => 'required|in:JO,MF',
            'source_id' => 'required|string',
            'customer_id' => 'nullable|exists:customers,customer_id',
            'do_date' => 'required|date',
            'departure_date' => 'nullable|date',
            'eta' => 'nullable|date',
            'goods_summary' => 'nullable|string',
            'priority' => 'nullable|in:Low,Medium,High,Urgent',
            'temperature' => 'nullable|string|max:50'
        ]);

        $customerId = $request->customer_id;
        $goodsSummary = $request->goods_summary;

        // Validate source exists and fetch data
        if ($request->source_type === 'JO') {
            $source = JobOrder::where('job_order_id', $request->source_id)->first();
            if (!$source) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job Order tidak ditemukan'
                ], 404);
            }
            
            // Auto-fill if not provided
            if (!$customerId) $customerId = $source->customer_id;
            if (!$goodsSummary) $goodsSummary = $source->goods_desc;

        } elseif ($request->source_type === 'MF') {
            $source = Manifests::with('jobOrders.customer')->where('manifest_id', $request->source_id)->first();
            if (!$source) {
                return response()->json([
                    'success' => false,
                    'message' => 'Manifest tidak ditemukan'
                ], 404);
            }

            // ✅ NEW: Check if specific Job Order is selected (LTL scenario)
            if ($request->filled('selected_job_order_id')) {
                // Find the specific job order from the manifest
                $selectedJobOrder = $source->jobOrders->firstWhere('job_order_id', $request->selected_job_order_id);
                
                if (!$selectedJobOrder) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Job Order yang dipilih tidak ada dalam Manifest ini'
                    ], 422);
                }

                // Use data from the selected job order
                if (!$customerId) $customerId = $selectedJobOrder->customer_id;
                if (!$goodsSummary) $goodsSummary = $selectedJobOrder->goods_desc;

                \Log::info('[DeliveryOrder] Created from Manifest with specific Job Order', [
                    'manifest_id' => $request->source_id,
                    'selected_job_order_id' => $request->selected_job_order_id,
                    'customer_id' => $customerId,
                    'goods_summary' => $goodsSummary
                ]);
            } else {
                // Fallback: Use first job order (legacy behavior)
                if (!$goodsSummary) $goodsSummary = $source->cargo_summary;
                
                if (!$customerId) {
                    $firstJob = $source->jobOrders->first();
                    if ($firstJob) {
                        $customerId = $firstJob->customer_id;
                    }
                }
            }
        }

        // Final validation for required fields
        if (!$customerId) {
             return response()->json([
                'success' => false,
                'message' => 'Customer ID tidak dapat ditemukan dari sumber data. Mohon input manual.'
            ], 422);
        }
        
        if (!$goodsSummary) {
             return response()->json([
                'success' => false,
                'message' => 'Ringkasan barang tidak dapat ditemukan dari sumber data. Mohon input manual.'
            ], 422);
        }

        // Generate kode unik do_id
        $doId = 'DO-' . date('Ymd') . '-' . strtoupper(\Illuminate\Support\Str::random(6));
        while (DeliveryOrder::where('do_id', $doId)->exists()) {
            $doId = 'DO-' . date('Ymd') . '-' . strtoupper(\Illuminate\Support\Str::random(6));
        }

        // Buat delivery order baru ke database
        $deliveryOrder = DeliveryOrder::create([
            'do_id' => $doId,
            'source_type' => $request->source_type,
            'source_id' => $request->source_id,
            'selected_job_order_id' => $request->selected_job_order_id, // ✅ NEW: For LTL
            'customer_id' => $customerId,
            'status' => 'Pending',
            'do_date' => $request->do_date,
            'departure_date' => $request->departure_date,
            'eta' => $request->eta,
            'goods_summary' => $goodsSummary,
            'temperature' => $request->temperature,
            'created_by' => Auth::id() ?? \App\Models\Admin::first()->user_id
        ]);

        // Menambah informasi sumber ke delivery order untuk response
        $deliveryOrder->source_info = $deliveryOrder->getSourceAttribute();

        return response()->json([
            'success' => true,
            'message' => 'Delivery Order created successfully',
            'data' => $deliveryOrder->load(['customer', 'createdBy'])
        ], 201);
    }

    /**
     * Display the specified delivery order
     * 
     * @param string $doId
     * @return JsonResponse
     */
    public function show(string $doId): JsonResponse
    {
        $deliveryOrder = DeliveryOrder::with(['customer', 'createdBy'])
            ->where('do_id', $doId)
            ->first();

        if (!$deliveryOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Delivery Order not found'
            ], 404);
        }

        // Menambah informasi sumber ke delivery order
        $deliveryOrder->source_info = $deliveryOrder->getSourceAttribute();

        return response()->json([
            'success' => true,
            'data' => $deliveryOrder
        ], 200);
    }

    /**
     * Update the specified delivery order
     * 
     * @param Request $request
     * @param string $doId
     * @return JsonResponse
     */
    public function update(Request $request, string $doId): JsonResponse
    {
        $deliveryOrder = DeliveryOrder::where('do_id', $doId)->first();

        if (!$deliveryOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Delivery Order tidak ditemukan'
            ], 404);
        }

        $request->validate([
            'customer_id' => 'required|exists:customers,customer_id',
            'do_date' => 'required|date',
            'departure_date' => 'nullable|date',
            'eta' => 'nullable|date',
            'goods_summary' => 'required|string',
            'priority' => 'nullable|in:Low,Medium,High,Urgent',
            'temperature' => 'nullable|string|max:50',
            'status' => 'in:Pending,In Transit,Delivered,Returned,Completed,Cancelled',
            'driver_id' => 'nullable|exists:drivers,driver_id',
            'vehicle_id' => 'nullable|exists:vehicles,vehicle_id'
        ]);

        // Jika datanya berhasil divalidasi, update delivery order
        $deliveryOrder->update($request->only([
            'customer_id',
            'do_date',
            'departure_date',
            'eta',
            'goods_summary',
            'priority',
            'temperature',
            'status'
        ]));

        // Handle Driver & Vehicle Assignment
        if ($request->has('driver_id') || $request->has('vehicle_id')) {
            $driverId = $request->driver_id;
            $vehicleId = $request->vehicle_id;

            if ($deliveryOrder->source_type === 'JO') {
                // Update or Create Assignment for Job Order
                $jobOrder = JobOrder::where('job_order_id', $deliveryOrder->source_id)->first();
                if ($jobOrder) {
                    // Find active assignment
                    $assignment = \App\Models\Assignment::where('job_order_id', $jobOrder->job_order_id)
                        ->where('status', 'Active')
                        ->first();

                    if ($assignment) {
                        // Update existing assignment
                        $assignment->update([
                            'driver_id' => $driverId ?? $assignment->driver_id,
                            'vehicle_id' => $vehicleId ?? $assignment->vehicle_id,
                            'assigned_at' => now()
                        ]);
                    } else {
                        // Create new assignment if we have both driver and vehicle (or at least one if allowed)
                        if ($driverId && $vehicleId) {
                            \App\Models\Assignment::create([
                                'job_order_id' => $jobOrder->job_order_id,
                                'driver_id' => $driverId,
                                'vehicle_id' => $vehicleId,
                                'status' => 'Active',
                                'assigned_at' => now(),
                                'notes' => 'Assigned via Delivery Order Edit'
                            ]);
                            
                            // Keep status as-is (no auto-upgrade to Assigned)
                        }
                    }
                }
            } elseif ($deliveryOrder->source_type === 'MF') {
                // Update Manifest directly
                $manifest = Manifests::where('manifest_id', $deliveryOrder->source_id)->first();
                if ($manifest) {
                    $manifest->update([
                        'driver_id' => $driverId ?? $manifest->driver_id,
                        'vehicle_id' => $vehicleId ?? $manifest->vehicle_id
                    ]);
                    // Keep status as-is (no auto-upgrade to Assigned)
                }
            }
        }

        // If status is delivered, set delivered_date
        if ($request->status === 'Delivered' && !$deliveryOrder->delivered_date) {
            $deliveryOrder->update(['delivered_date' => now()->toDateString()]);
        }

        // Menambah informasi sumber ke delivery order untuk response
        $deliveryOrder->source_info = $deliveryOrder->getSourceAttribute();

        return response()->json([
            'success' => true,
            'message' => 'Delivery Order berhasil diupdate',
            'data' => $deliveryOrder->load(['customer', 'createdBy'])
        ], 200);
    }

    /**
     * Menghapus delivery order yang ditentukan dari database berdasarkan do_id
     * 
     * @param string $doId
     * @return JsonResponse
     */
    public function destroy(string $doId): JsonResponse
    {
        $deliveryOrder = DeliveryOrder::where('do_id', $doId)->first();

        if (!$deliveryOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Delivery Order tidak ditemukan'
            ], 404);
        }

        // Check if delivery order is already in progress
        if (in_array($deliveryOrder->status, ['In Transit', 'Delivered'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete delivery order that is in transit or delivered'
            ], 422);
        }

        // Menghapus data delivery order dari database
        $deliveryOrder->delete();

        return response()->json([
            'success' => true,
            'message' => 'Delivery Order berhasil dihapus'
        ], 200);
    }

    /**
     * Menugaskan driver ke delivery order tertentu
     * 
     * @param Request $request
     * @param string $doId
     * @return JsonResponse
     */
    public function assignDriverToDO(Request $request, string $doId): JsonResponse
    {
        $deliveryOrder = DeliveryOrder::where('do_id', $doId)->first();

        if (!$deliveryOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Delivery Order not found'
            ], 404);
        }

        $request->validate([
            'driver_id' => 'required|exists:drivers,driver_id',
            'vehicle_id' => 'required|exists:vehicles,vehicle_id',
            'notes' => 'nullable|string'
        ]);

        $driverId = $request->driver_id;
        $vehicleId = $request->vehicle_id;
        $notes = $request->notes;

        // Perform Assignment Logic based on source type
        if ($deliveryOrder->source_type === 'JO') {
            $jobOrder = JobOrder::where('job_order_id', $deliveryOrder->source_id)->first();
            if ($jobOrder) {
                // Deactivate previous active assignments
                \App\Models\Assignment::where('job_order_id', $jobOrder->job_order_id)
                    ->where('status', 'Active')
                    ->update(['status' => 'Inactive']);

                // Create new assignment
                \App\Models\Assignment::create([
                    'job_order_id' => $jobOrder->job_order_id,
                    'driver_id' => $driverId,
                    'vehicle_id' => $vehicleId,
                    'status' => 'Active',
                    'assigned_at' => now(),
                    'notes' => $notes ?? 'Assigned via DO Assignment'
                ]);
            }
        } elseif ($deliveryOrder->source_type === 'MF') {
             $manifest = Manifests::where('manifest_id', $deliveryOrder->source_id)->first();
             if ($manifest) {
                 $manifest->update([
                     'driver_id' => $driverId,
                     'vehicle_id' => $vehicleId
                 ]);
             }
        }

        // Status remains as-is (Pending) - will be updated when driver starts delivery via app
        
        // 🔔 Send Push Notification
        $this->firebaseService->sendToDriver(
            $driverId,
            'Delivery Order Baru! 📦',
            "Anda mendapatkan tugas delivery: {$deliveryOrder->do_id}",
            [
                'type' => 'delivery_order_assignment',
                'do_id' => $deliveryOrder->do_id,
                'customer_name' => $deliveryOrder->customer->customer_name ?? 'Customer'
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Driver assigned to Delivery Order successfully',
            'data' => [
                'do_id' => $deliveryOrder->do_id,
                'driver_id' => $driverId,
                'vehicle_id' => $vehicleId,
                'status' => $deliveryOrder->status,
                'assigned_at' => now()
            ]
        ], 200);
    }

    /**
     * Complete delivery order setelah validasi POD oleh Admin
     * Mengubah status dari 'Delivered' menjadi 'Completed'
     * DO yang sudah completed siap untuk ditagih di modul Invoice
     * 
     * @param string $doId
     * @return JsonResponse
     */
    public function completeDeliveryOrder(string $doId): JsonResponse
    {
        // Cari delivery order berdasarkan do_id
        $deliveryOrder = DeliveryOrder::where('do_id', $doId)->first();

        if (!$deliveryOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Delivery Order tidak ditemukan'
            ], 404);
        }

        // Validasi status harus 'Delivered' sebelum bisa di-complete
        if ($deliveryOrder->status !== 'Delivered') {
            return response()->json([
                'success' => false,
                'message' => 'Delivery Order harus berstatus "Delivered" sebelum dapat di-complete. Status saat ini masih ' . $deliveryOrder->status
            ], 422);
        }

        // Check apakah sudah ada POD (Proof of Delivery)
        // Asumsi: DO harus memiliki POD sebelum bisa completed
        $hasPOD = DB::table('proof_of_deliveries')
            ->where('do_id', $doId)
            ->exists();

        if (!$hasPOD) {
            return response()->json([
                'success' => false,
                'message' => 'Delivery Order belum memiliki Proof of Delivery (POD). POD harus ada sebelum DO dapat di-complete.'
            ], 422);
        }

        // Update status menjadi 'Completed'
        $deliveryOrder->update([
            'status' => 'Completed',
            'completed_date' => now()->toDateString(),
            'completed_by' => Auth::id() ?? \App\Models\Admin::first()->user_id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Delivery Order berhasil di-complete dan siap untuk ditagih',
            'data' => [
                'do_id' => $deliveryOrder->do_id,
                'status' => $deliveryOrder->status,
                'delivered_date' => $deliveryOrder->delivered_date,
                'completed_date' => $deliveryOrder->completed_date,
                'completed_by' => $deliveryOrder->completed_by,
                'completed_at' => now()
            ]
        ], 200);
    }

    /**
     * ============================================================
     * CANCEL DELIVERY ORDER - CANCELLATION LOGIC (BLUEPRINT)
     * ============================================================
     * 
     * Artinya: Salah cetak surat jalan, salah input tanggal, atau revisi dokumen
     * 
     * DAMPAK:
     * - Delivery Order: Berubah jadi Cancelled statusnya
     * - Job Order: Kembalikan status ke "Pending" dan set delivery_order_id = NULL
     *              (Agar Admin bisa membuatkan DO baru yang benar)
     *              Data driver & armada dihilangkan karena status berubah ke Pending
     * - Manifest: Status tidak berubah. Hanya re-calculate (hitung ulang) total koli/berat
     * 
     * @param Request $request
     * @param string $doId
     * @return JsonResponse
     */
    public function cancel(Request $request, string $doId): JsonResponse
    {
        try {
            $deliveryOrder = DeliveryOrder::where('do_id', $doId)->first();

            if (!$deliveryOrder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Delivery Order tidak ditemukan'
                ], 404);
            }

            if ($deliveryOrder->status === 'Cancelled') {
                return response()->json([
                    'success' => false,
                    'message' => 'Delivery Order sudah dibatalkan sebelumnya'
                ], 422);
            }

            // Tidak boleh cancel DO yang sudah In Transit atau Delivered
            if (in_array($deliveryOrder->status, ['In Transit', 'Delivered', 'Completed'])) {
                return response()->json([
                    'success' => false,
                    'message' => "Tidak dapat membatalkan Delivery Order dengan status '{$deliveryOrder->status}'. " .
                                 "Gunakan fitur Return jika perlu mengembalikan barang."
                ], 422);
            }

            $cancellationReason = $request->input('cancellation_reason', 'Salah cetak/revisi dokumen');

            // ============================================================
            // 1. CANCEL DELIVERY ORDER
            // ============================================================
            $deliveryOrder->update([
                'status' => 'Cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => $cancellationReason
            ]);

            // ============================================================
            // 2. RESET JOB ORDER ke status "Pending" (Reset & Buat DO Baru)
            // ============================================================
            $resetJobOrders = [];
            $recalculatedManifest = null;

            if ($deliveryOrder->source_type === 'JO') {
                // Source adalah Job Order langsung (FTL)
                $jobOrder = JobOrder::where('job_order_id', $deliveryOrder->source_id)->first();
                
                if ($jobOrder && $jobOrder->status !== 'Cancelled') {
                    $jobOrder->update(['status' => 'Pending']);
                    
                    // Deactivate assignments (hapus data driver & armada)
                    \App\Models\Assignment::where('job_order_id', $jobOrder->job_order_id)
                        ->where('status', 'Active')
                        ->update(['status' => 'Cancelled']);

                    // Create status history
                    \App\Models\JobOrderStatusHistory::create([
                        'job_order_id' => $jobOrder->job_order_id,
                        'status' => 'Pending',
                        'notes' => "Delivery Order {$doId} dibatalkan. Job Order dikembalikan ke antrian untuk dicetak ulang surat jalannya.",
                        'trigger_type' => 'System',
                        'changed_by' => Auth::id() ?? 'System',
                        'changed_at' => now()
                    ]);

                    $resetJobOrders[] = $jobOrder->job_order_id;

                    // ============================================================
                    // ✅ NEW: Check if this Job Order is part of any Manifest
                    // If so, detach it and potentially cancel the Manifest
                    // ============================================================
                    $relatedManifest = Manifests::whereHas('jobOrders', function($query) use ($jobOrder) {
                        $query->where('job_orders.job_order_id', $jobOrder->job_order_id);
                    })->first();

                    if ($relatedManifest) {
                        // Detach the Job Order from Manifest
                        $relatedManifest->jobOrders()->detach($jobOrder->job_order_id);
                        \Log::info("[CANCEL DO] Detached Job Order {$jobOrder->job_order_id} from Manifest {$relatedManifest->manifest_id}");

                        // Re-calculate cargo from remaining job orders
                        $remainingJobOrders = $relatedManifest->jobOrders()->get();

                        if ($remainingJobOrders->count() === 0) {
                            // Manifest is now empty - cancel it
                            $relatedManifest->update([
                                'status' => 'Cancelled',
                                'cancelled_at' => now(),
                                'cancellation_reason' => "Delivery Order {$doId} dibatalkan. Manifest tidak memiliki Job Order tersisa.",
                                'cargo_weight' => 0,
                                'cargo_summary' => '0 packages'
                            ]);

                            \Log::info("[CANCEL DO] Manifest {$relatedManifest->manifest_id} cancelled because no Job Orders remaining");

                            $recalculatedManifest = [
                                'manifest_id' => $relatedManifest->manifest_id,
                                'status' => 'Cancelled',
                                'active_jobs' => 0,
                                'total_weight' => 0,
                                'total_koli' => 0
                            ];
                        } else {
                            // Still has remaining Job Orders - just recalculate cargo
                            $totalWeight = $remainingJobOrders->sum('goods_weight');
                            $totalKoli = $remainingJobOrders->sum('goods_qty');
                            
                            $cargoSummary = $remainingJobOrders->count() . ' packages';
                            if ($remainingJobOrders->count() > 0) {
                                $descriptions = $remainingJobOrders->pluck('goods_desc')->unique()->take(3);
                                $cargoSummary .= ': ' . $descriptions->implode(', ');
                            }

                            $relatedManifest->update([
                                'cargo_weight' => $totalWeight,
                                'cargo_summary' => $cargoSummary
                            ]);

                            $recalculatedManifest = [
                                'manifest_id' => $relatedManifest->manifest_id,
                                'status' => $relatedManifest->status,
                                'active_jobs' => $remainingJobOrders->count(),
                                'total_weight' => $totalWeight,
                                'total_koli' => $totalKoli
                            ];
                        }
                    }
                }

            } elseif ($deliveryOrder->source_type === 'MF') {
                // Source adalah Manifest (LTL/multi-stop)
                
                // Check if specific Job Order was selected (LTL scenario)
                if ($deliveryOrder->selected_job_order_id) {
                    $specificJO = JobOrder::where('job_order_id', $deliveryOrder->selected_job_order_id)->first();
                    
                    if ($specificJO && $specificJO->status !== 'Cancelled') {
                        $specificJO->update(['status' => 'Pending']);

                        // Deactivate assignments
                        \App\Models\Assignment::where('job_order_id', $specificJO->job_order_id)
                            ->where('status', 'Active')
                            ->update(['status' => 'Cancelled']);

                        \App\Models\JobOrderStatusHistory::create([
                            'job_order_id' => $specificJO->job_order_id,
                            'status' => 'Pending',
                            'notes' => "Delivery Order {$doId} (LTL) dibatalkan. Job Order dikembalikan ke antrian.",
                            'trigger_type' => 'System',
                            'changed_by' => Auth::id() ?? 'System',
                            'changed_at' => now()
                        ]);

                        $resetJobOrders[] = $specificJO->job_order_id;
                    }
                }

                // ============================================================
                // 3. DETACH JOB ORDER FROM MANIFEST & RE-CALCULATE
                // ============================================================
                $manifest = Manifests::with('jobOrders')->where('manifest_id', $deliveryOrder->source_id)->first();
                
                if ($manifest) {
                    // ✅ FIXED: DETACH the Job Order yang terkait dengan DO ini dari Manifest
                    // Ini akan mengurangi jumlah muatan di Manifest
                    if ($deliveryOrder->selected_job_order_id) {
                        // Detach specific Job Order (LTL scenario)
                        $manifest->jobOrders()->detach($deliveryOrder->selected_job_order_id);
                        \Log::info("[CANCEL DO] Detached Job Order {$deliveryOrder->selected_job_order_id} from Manifest {$manifest->manifest_id}");
                    }

                    // Re-calculate cargo from remaining job orders in manifest
                    $remainingJobOrders = $manifest->jobOrders()->get();
                    
                    // ============================================================
                    // ✅ NEW: If no remaining Job Orders, CANCEL the Manifest entirely
                    // ============================================================
                    if ($remainingJobOrders->count() === 0) {
                        // Manifest is now empty - cancel it
                        $manifest->update([
                            'status' => 'Cancelled',
                            'cancelled_at' => now(),
                            'cancellation_reason' => "Delivery Order {$doId} dibatalkan. Manifest tidak memiliki Job Order tersisa.",
                            'cargo_weight' => 0,
                            'cargo_summary' => '0 packages'
                        ]);

                        \Log::info("[CANCEL DO] Manifest {$manifest->manifest_id} cancelled because no Job Orders remaining");

                        $recalculatedManifest = [
                            'manifest_id' => $manifest->manifest_id,
                            'status' => 'Cancelled',
                            'active_jobs' => 0,
                            'total_weight' => 0,
                            'total_koli' => 0
                        ];
                    } else {
                        // Still has remaining Job Orders - just recalculate cargo
                        $totalWeight = $remainingJobOrders->sum('goods_weight');
                        $totalKoli = $remainingJobOrders->sum('goods_qty');
                        
                        $cargoSummary = $remainingJobOrders->count() . ' packages';
                        if ($remainingJobOrders->count() > 0) {
                            $descriptions = $remainingJobOrders->pluck('goods_desc')->unique()->take(3);
                            $cargoSummary .= ': ' . $descriptions->implode(', ');
                            if ($remainingJobOrders->count() > 3) {
                                $cargoSummary .= ', etc.';
                            }
                        }

                        $manifest->update([
                            'cargo_weight' => $totalWeight,
                            'cargo_summary' => $cargoSummary
                        ]);

                        $recalculatedManifest = [
                            'manifest_id' => $manifest->manifest_id,
                            'status' => $manifest->status,
                            'active_jobs' => $remainingJobOrders->count(),
                            'total_weight' => $totalWeight,
                            'total_koli' => $totalKoli
                        ];
                    }
                }
            }

            \Log::info("[CANCEL DO] Delivery Order {$doId} dibatalkan", [
                'source_type' => $deliveryOrder->source_type,
                'source_id' => $deliveryOrder->source_id,
                'reset_job_orders' => $resetJobOrders,
                'recalculated_manifest' => $recalculatedManifest,
                'reason' => $cancellationReason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Delivery Order berhasil dibatalkan. Job Order dikembalikan ke antrian untuk dicetak ulang.',
                'data' => [
                    'do_id' => $doId,
                    'status' => 'Cancelled',
                    'cancelled_at' => now()->toISOString(),
                    'cancellation_reason' => $cancellationReason,
                    'reset_job_orders' => $resetJobOrders,
                    'recalculated_manifest' => $recalculatedManifest
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error("[CANCEL DO] Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan Delivery Order',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}