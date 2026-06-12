<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobOrder;
use App\Models\JobOrderStatusHistory;
use App\Models\Assignment;
use App\Models\Customers;
use App\Models\Drivers;
use App\Models\Vehicles;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Services\FirebaseNotificationService;

/**
 * JobOrderController - Controller untuk mengelola Job Order (Pesanan Kerja)
 * 
 * Fungsi utama:
 * - Menampilkan daftar job order dengan pencarian dan filter
 * - Membuat job order baru dengan ID otomatis
 * - Assign driver dan vehicle ke job order (Jika statusnya FTL)
 * - Update status job order dengan history tracking
 * - Menghapus job order
 * - Filter berdasarkan status, customer, priority, dan tanggal
 * - Tracking progress dari pickup sampai delivery
 * - Generate manifest dan assignment
 */
class JobOrderController extends Controller
{
    protected $firebaseService;

    public function __construct(FirebaseNotificationService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }
    /**
     * Menampilkan daftar job order dengan fitur pencarian dan filter
     * 
     * Fitur yang tersedia:
     * - Pencarian berdasarkan job order ID, deskripsi barang, alamat pickup/delivery, atau customer
     * - Filter berdasarkan status (created, assigned, pickup, delivery, completed, cancelled)
     * - Filter berdasarkan customer tertentu
     * - Filter berdasarkan prioritas dan tanggal
     * - Include data customer, creator, assignments dengan driver dan vehicle
     * - Pagination dengan default 15 item per halaman
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = JobOrder::with(['customer', 'createdBy', 'assignments.driver', 'assignments.vehicle']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('job_order_id', 'ILIKE', "%{$search}%")
                ->orWhere('goods_desc', 'ILIKE', "%{$search}%")
                ->orWhere('pickup_address', 'ILIKE', "%{$search}%")
                ->orWhere('delivery_address', 'ILIKE', "%{$search}%")
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

        // Filter by order type
        if ($request->filled('order_type')) {
            $query->where('order_type', $request->order_type);
        }

        // Filter by date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('ship_date', [$request->start_date, $request->end_date]);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);

        $jobOrders = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Data Job Orders berhasil diambil',
            'data' => $jobOrders->items(),
            'pagination' => [
                'current_page' => $jobOrders->currentPage(),
                'per_page' => $jobOrders->perPage(),
                'total' => $jobOrders->total(),
                'last_page' => $jobOrders->lastPage()
            ]
        ], 200);
    }

    /**
     * Store a newly created job order
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,customer_id',
            'order_type' => 'required|in:LTL,FTL',
            'pickup_address' => 'nullable|string',
            'pickup_city' => 'nullable|string',
            'pickup_lat' => 'nullable|numeric|between:-90,90',
            'pickup_lng' => 'nullable|numeric|between:-180,180',
            'pickup_contact' => 'nullable|string|max:100',
            'pickup_phone' => 'nullable|string|max:20',
            'delivery_address' => 'required|string',
            'delivery_city' => 'nullable|string',
            'delivery_lat' => 'nullable|numeric|between:-90,90',
            'delivery_lng' => 'nullable|numeric|between:-180,180',
            'recipient_name' => 'nullable|string|max:100',
            'recipient_phone' => 'nullable|string|max:20',
            'goods_desc' => 'required|string',
            'goods_qty' => 'required|integer|min:1',
            'goods_weight' => 'required|numeric|min:0',
            'goods_volume' => [
                'nullable', 
                'numeric', 
                'min:0', 
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->order_type === 'LTL' && ($value === null || $value <= 0)) {
                        $fail('Volume wajib diisi untuk tipe order LTL.');
                    }
                },
            ],
            'ship_date' => 'required|date',
            'order_value' => 'nullable|numeric|min:0'
        ]);

        // Generate unique job_order_id
        $jobOrderId = 'JO-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        while (JobOrder::where('job_order_id', $jobOrderId)->exists()) {
            $jobOrderId = 'JO-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        }

        // Determine created_by
        $creatorId = Auth::id();
        if (!$creatorId) {
            $admin = Admin::first();
            if ($admin) {
                $creatorId = $admin->user_id;
            } else {
                // Create a default system admin if none exists
                try {
                    $admin = Admin::create([
                        'user_id' => 'ADMIN-SYSTEM',
                        'name' => 'System Administrator',
                        'email' => 'system@sendpick.com',
                        'password' => bcrypt('system123'),
                        'status' => 'active'
                    ]);
                    $creatorId = $admin->user_id;
                } catch (\Exception $e) {
                    $creatorId = 'ADMIN-SYSTEM';
                }
            }
        }

        $jobOrder = JobOrder::create([
            'job_order_id' => $jobOrderId,
            'customer_id' => $request->customer_id,
            'order_type' => $request->order_type,
            'status' => 'Created',
            'pickup_address' => $request->pickup_address,
            'pickup_city' => $request->pickup_city,
            'pickup_lat' => $request->pickup_lat,
            'pickup_lng' => $request->pickup_lng,
            'pickup_contact' => $request->pickup_contact,
            'pickup_phone' => $request->pickup_phone,
            'delivery_address' => $request->delivery_address,
            'delivery_city' => $request->delivery_city,
            'delivery_lat' => $request->delivery_lat,
            'delivery_lng' => $request->delivery_lng,
            'recipient_name' => $request->recipient_name,
            'recipient_phone' => $request->recipient_phone,
            'goods_desc' => $request->goods_desc,
            'goods_qty' => $request->goods_qty,
            'goods_weight' => $request->goods_weight,
            'goods_volume' => $request->goods_volume,
            'ship_date' => $request->ship_date,
            'order_value' => $request->order_value,
            'created_by' => $creatorId
        ]);

        // Create status history
        $this->createStatusHistory($jobOrder->job_order_id, 'Created', 'Admin', 'Job Order created', 'user');

        return response()->json([
            'success' => true,
            'message' => 'Job Order created successfully',
            'data' => $jobOrder->load(['customer', 'createdBy'])
        ], 201);
    }

    /**
     * Menampilkan ID Job Order yg dipilih
     * 
     * @param string $jobOrderId
     * @return JsonResponse
     */
    public function show(string $jobOrderId): JsonResponse
    {
        $jobOrder = JobOrder::with([
            'customer', 
            'createdBy', 
            'assignments.driver', 
            'assignments.vehicle.vehicleType',
            'statusHistories',
            'proofOfDeliveries',
            'manifests.drivers',   // ✅ Load Driver Manifest (Relation name is plural in Model)
            'manifests.vehicles'   // ✅ Load Vehicle Manifest (Relation name is plural in Model)
        ])->where('job_order_id', $jobOrderId)->first();

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Job Order not found'
            ], 404);
        }

        // ✅ LOGIC BARU: Inject Manifest Data & Virtual Assignment
        // Cari manifest aktif terbaru
        $activeManifest = $jobOrder->manifests
            ->whereIn('status', ['Pending', 'In Transit', 'Arrived', 'Completed'])
            ->sortByDesc('created_at')
            ->first();

        if ($activeManifest) {
            // 1. Inject info manifest ke root object (untuk kemudahan akses frontend)
            $jobOrder->manifest_info = [
                'manifest_id' => $activeManifest->manifest_id,
                'status' => $activeManifest->status,
                'driver' => $activeManifest->drivers,   // Relation is 'drivers'
                'vehicle' => $activeManifest->vehicles, // Relation is 'vehicles'
                'route' => $activeManifest->origin_city . ' -> ' . $activeManifest->dest_city
            ];

            // 2. Inject "Virtual Assignment" jika belum ada assignment manual
            // Ini agar di tab "Assignment Management" muncul card driver manifest
            // ✅ SKIP untuk FTL - FTL sudah punya assignment sendiri via halaman detail Job Order
            if ($jobOrder->order_type !== 'FTL' && $jobOrder->assignments->isEmpty() && $activeManifest->drivers) {
                $virtualAssignment = [
                    'assignment_id' => 'manifest-' . $activeManifest->manifest_id,
                    'status' => 'Active', // Dianggap Active karena Manifest berjalan
                    'role' => 'Primary Driver (Manifest)',
                    'assigned_at' => $activeManifest->created_at,
                    'driver' => $activeManifest->drivers,   // Relation is 'drivers'
                    'vehicle' => $activeManifest->vehicles, // Relation is 'vehicles'
                    'is_manifest_generated' => true,
                    'note' => "Assigned via Manifest #{$activeManifest->manifest_id}"
                ];
                
                // Push ke collection (sebagai array/object standar)
                $jobOrder->assignments->push((object)$virtualAssignment);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $jobOrder
        ], 200);
    }

    /**
     * Update the specified job order
     * 
     * @param Request $request
     * @param string $jobOrderId
     * @return JsonResponse
     */
    public function update(Request $request, string $jobOrderId): JsonResponse
    {
        $jobOrder = JobOrder::where('job_order_id', $jobOrderId)->first();

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Job Order not found'
            ], 404);
        }

    $validated = $request->validate([
            'customer_id' => 'sometimes|exists:customers,customer_id',
            'order_type' => 'sometimes|in:LTL,FTL',
            'pickup_address' => 'sometimes|string|max:500',
            'pickup_city' => 'nullable|string',
            'pickup_lat' => 'nullable|numeric|between:-90,90',
            'pickup_lng' => 'nullable|numeric|between:-180,180',
            'pickup_contact' => 'nullable|string|max:100',
            'pickup_phone' => 'nullable|string|max:20',
            'delivery_address' => 'sometimes|string|max:500',
            'delivery_city' => 'nullable|string',
            'delivery_lat' => 'nullable|numeric|between:-90,90',
            'delivery_lng' => 'nullable|numeric|between:-180,180',
            'recipient_name' => 'nullable|string|max:100',
            'recipient_phone' => 'nullable|string|max:20',
            'goods_desc' => 'sometimes|string',
            'goods_qty' => 'sometimes|integer|min:1',
            'goods_weight' => 'sometimes|numeric|min:0',
            // Custom validation for goods_volume on update
            'goods_volume' => [
                'nullable', 
                'numeric', 
                'min:0',
                function ($attribute, $value, $fail) use ($request, $jobOrder) {
                    $type = $request->order_type ?? $jobOrder->order_type;
                    // Only enforce if volume is being updated OR if type is being changed/is LTL
                    // But typically we validate the final state.
                    // Let's enforce if type is LTL, volume must be present/valid.
                    if ($type === 'LTL') {
                         // If value is passed, it must be > 0.
                         // If value is NOT passed, we check if existing is valid? 
                         // For update "sometimes", we usually validate only if present, but for "required_if" logic it gets tricky.
                         // Let's stick to: if present, must be valid. Frontend handles mandatory field.
                         if ($value !== null && $value <= 0) {
                             $fail('Volume wajib diisi untuk tipe order LTL.');
                         }
                    }
                }
            ],
            'ship_date' => 'sometimes|date|after_or_equal:today',
            'order_value' => 'sometimes|nullable|numeric|min:0',
            'status' => 'sometimes|string',
            'cancellation_reason' => 'nullable|string'
        ]);

        $oldStatus = $jobOrder->status;

        // Check for changes in other fields (Audit Trail)
        $changes = [];
        $fieldsToCheck = [
            'pickup_address', 'pickup_contact', 'pickup_phone', 'delivery_address', 
            'recipient_name', 'recipient_phone', 'goods_desc', 'goods_qty', 'goods_weight', 
            'goods_volume', 'ship_date', 'order_value', 'order_type'
        ];

        foreach ($fieldsToCheck as $field) {
            if (isset($validated[$field]) && $jobOrder->$field != $validated[$field]) {
                $fieldName = ucwords(str_replace('_', ' ', $field));
                $changes[] = "{$fieldName}";
            }
        }

        // Remove cancellation_reason from validated data before updating JobOrder model
        // as it's not a column in job_orders table
        $updateData = collect($validated)->except(['cancellation_reason'])->toArray();
        $jobOrder->update($updateData);

        // Check if status changed to Completed
        if (isset($validated['status']) && $validated['status'] === 'Completed' && $oldStatus !== 'Completed') {
            // Find active assignment
            $activeAssignment = $jobOrder->assignments()->where('status', 'Active')->first();
            
            if ($activeAssignment && $activeAssignment->driver) {
                $activeAssignment->driver->increment('delivery_count');
            }
        }

        $user = Auth::user();
        $changedBy = $user ? ($user->name ?? $user->email ?? 'Admin') : 'Admin';

        // Create status history if status changed
        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            $notes = "Status updated from {$oldStatus} to {$validated['status']}";
            
            // Special handling for Cancelled status
            if ($validated['status'] === 'Cancelled') {
                $reason = $request->cancellation_reason ?? 'No reason provided';
                $notes = "Reason: {$reason}";
            }
            
            $this->createStatusHistory(
                $jobOrder->job_order_id, 
                $validated['status'], 
                $changedBy,
                $notes,
                'user'
            );
        } 
        // Create history if other details changed but status didn't
        elseif (!empty($changes)) {
            $changesStr = implode(', ', $changes);
            $notes = "Order details updated by {$changedBy}. Changed: {$changesStr}.";
            
            // Use 'Order Updated' as a special status label for the history
            $this->createStatusHistory(
                $jobOrder->job_order_id, 
                'Order Updated', 
                $changedBy,
                $notes,
                'user'
            );
        }

        $jobOrder->load(['customer', 'createdBy']);

        return response()->json([
            'success' => true,
            'message' => 'Job Order updated successfully',
            'data' => [
                'job_order_id' => $jobOrder->job_order_id,
                'customer_id' => $jobOrder->customer_id,
                'customer_name' => $jobOrder->customer->customer_name ?? null,
                'customer_code' => $jobOrder->customer->customer_code ?? null,
                'order_type' => $jobOrder->order_type,
                'status' => $jobOrder->status,
                'pickup_address' => $jobOrder->pickup_address,
                'delivery_address' => $jobOrder->delivery_address,
                'goods_desc' => $jobOrder->goods_desc,
                'goods_weight' => $jobOrder->goods_weight,
                'ship_date' => $jobOrder->ship_date,
                'order_value' => $jobOrder->order_value,
                'created_by' => $jobOrder->created_by,
                'completed_at' => $jobOrder->completed_at,
                'created_at' => $jobOrder->created_at,
                'updated_at' => $jobOrder->updated_at,
            ]
        ], 200);
    }

    /**
     * Menghapus job order yg dipilih
     * 
     * @param string $jobOrderId
     * @return JsonResponse
     */
    public function destroy(string $jobOrderId): JsonResponse
    {
        $jobOrder = JobOrder::where('job_order_id', $jobOrderId)->first();

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Job Order not found'
            ], 404);
        }

        // Check if job order has active assignments
        $hasActiveAssignments = $jobOrder->assignments()->where('status', 'Active')->exists();

        if ($hasActiveAssignments) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete Job Order. It has active assignments.'
            ], 422);
        }

        $jobOrder->delete();

        return response()->json([
            'success' => true,
            'message' => 'Job Order deleted successfully'
        ], 200);
    }

    /**
     * ============================================================
     * CANCEL JOB ORDER - CANCELLATION LOGIC (BLUEPRINT)
     * ============================================================
     * 
     * Artinya: Customer membatalkan pesanan atau ada kesalahan fatal
     * 
     * DAMPAK:
     * - Job Order: Berubah jadi Cancelled statusnya
     * - Delivery Order: Wajib ikut Cancelled (tidak mungkin kirim barang yang dibatalkan)
     * - Manifest: Status tidak berubah (JO dikeluarkan dari list, kapasitas truk kembali kosong)
     * 
     * GUARD/VALIDASI:
     * 🛑 DILARANG Cancel Job Order jika Manifest sudah status "In Transit"
     * Solusi: Gunakan fitur "Return" (Retur Barang), bukan "Cancel"
     * 
     * @param Request $request
     * @param string $jobOrderId
     * @return JsonResponse
     */
    public function cancel(Request $request, string $jobOrderId): JsonResponse
    {
        try {
            $jobOrder = JobOrder::with(['manifests', 'assignments'])->where('job_order_id', $jobOrderId)->first();

            if (!$jobOrder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job Order tidak ditemukan'
                ], 404);
            }

            // Sudah di-cancel sebelumnya
            if ($jobOrder->status === 'Cancelled') {
                return response()->json([
                    'success' => false,
                    'message' => 'Job Order sudah dibatalkan sebelumnya'
                ], 422);
            }

            // ============================================================
            // 🛑 GUARD: DILARANG Cancel jika Manifest sudah "In Transit"
            // ============================================================
            $manifestInTransit = $jobOrder->manifests()
                ->where('status', 'In Transit')
                ->first();

            if ($manifestInTransit) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat membatalkan Job Order karena Manifest sudah dalam status "In Transit". Gunakan fitur Return (Retur Barang) setelah barang tiba di tujuan.',
                    'manifest_id' => $manifestInTransit->manifest_id,
                    'manifest_status' => $manifestInTransit->status
                ], 422);
            }

            $cancellationReason = $request->input('cancellation_reason', 'Dibatalkan oleh Admin');

            // ============================================================
            // 1. CANCEL JOB ORDER
            // ============================================================
            $jobOrder->update([
                'status' => 'Cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => $cancellationReason
            ]);

            // Create status history
            $this->createStatusHistory(
                $jobOrderId,
                'Cancelled',
                Auth::user()->name ?? 'Admin',
                "Reason: {$cancellationReason}",
                'user'
            );

            // ============================================================
            // 2. CANCEL DELIVERY ORDER yang terkait (Hangus Otomatis)
            // ============================================================
            $cancelledDOs = [];

            // Cari DO dengan source_type = 'JO' dan source_id = job_order_id
            $directDOs = \App\Models\DeliveryOrder::where('source_type', 'JO')
                ->where('source_id', $jobOrderId)
                ->where('status', '!=', 'Cancelled')
                ->get();

            foreach ($directDOs as $do) {
                $do->update([
                    'status' => 'Cancelled',
                    'cancelled_at' => now(),
                    'cancellation_reason' => "Job Order {$jobOrderId} dibatalkan"
                ]);
                $cancelledDOs[] = $do->do_id;
            }

            // Cari DO dengan source_type = 'MF' dan selected_job_order_id = job_order_id (LTL)
            $ltlDOs = \App\Models\DeliveryOrder::where('source_type', 'MF')
                ->where('selected_job_order_id', $jobOrderId)
                ->where('status', '!=', 'Cancelled')
                ->get();

            foreach ($ltlDOs as $do) {
                $do->update([
                    'status' => 'Cancelled',
                    'cancelled_at' => now(),
                    'cancellation_reason' => "Job Order {$jobOrderId} (LTL) dibatalkan"
                ]);
                $cancelledDOs[] = $do->do_id;
            }

            // ============================================================
            // 3. RE-CALCULATE MANIFEST CARGO (JANGAN DETACH JO dari Manifest)
            // ============================================================
            // Job Order yang di-cancel TETAP terikat ke Manifest untuk audit trail
            // Cargo dihitung dari SEMUA Job Order (termasuk Cancelled) untuk total rencana muatan
            $updatedManifests = [];

            $manifests = $jobOrder->manifests()->get();
            foreach ($manifests as $manifest) {
                // ✅ FIXED: JANGAN DETACH Job Order dari Manifest
                // Job Order tetap terikat untuk keperluan audit/tracking
                // $manifest->jobOrders()->detach($jobOrderId); // REMOVED

                // ✅ FIXED: Re-calculate cargo dari SEMUA Job Order (termasuk Cancelled)
                // Manifest menampilkan TOTAL rencana muatan untuk audit
                $allJobs = $manifest->jobOrders()->get();
                
                // Juga hitung Job Order aktif untuk keperluan driver assignment
                $activeJobs = $manifest->jobOrders()
                    ->where('status', '!=', 'Cancelled')
                    ->get();
                
                $totalWeight = $allJobs->sum('goods_weight');
                $totalKoli = $allJobs->sum('goods_qty');
                
                $cargoSummary = $allJobs->count() . ' packages';
                if ($allJobs->count() > 0) {
                    $descriptions = $allJobs->pluck('goods_desc')->unique()->take(3);
                    $cargoSummary .= ': ' . $descriptions->implode(', ');
                    if ($allJobs->count() > 3) {
                        $cargoSummary .= ', etc.';
                    }
                }

                // ✅ FIXED (2025-12-22): Jika tidak ada Job Order AKTIF:
                // 1. Kosongkan driver & vehicle (agar kembali tersedia)
                // 2. UBAH STATUS MANIFEST ke 'Cancelled' (bukan hanya Pending)
                // 3. Set cargo_weight dan cargo_summary ke 0
                if ($activeJobs->count() === 0) {
                    $manifest->update([
                        'status' => 'Cancelled',  // ✅ NEW: Manifest jadi Cancelled
                        'cancelled_at' => now(),
                        'cancellation_reason' => "Semua Job Order dalam Manifest ini sudah dibatalkan",
                        'cargo_weight' => 0,      // ✅ Set berat ke 0
                        'cargo_summary' => '0 packages',  // ✅ Set summary ke 0
                        'driver_id' => null,      // ✅ Lepaskan driver
                        'vehicle_id' => null      // ✅ Lepaskan vehicle
                    ]);
                    \Log::info("[CANCEL JO] Manifest {$manifest->manifest_id} has 0 ACTIVE Job Orders. Status changed to CANCELLED. Driver & Vehicle released.");
                } else {
                    $manifest->update([
                        'cargo_weight' => $totalWeight,
                        'cargo_summary' => $cargoSummary
                    ]);
                }

                $updatedManifests[] = [
                    'manifest_id' => $manifest->manifest_id,
                    'total_jobs' => $allJobs->count(),
                    'active_jobs' => $activeJobs->count(),
                    'total_weight' => $activeJobs->count() === 0 ? 0 : $totalWeight,
                    'status' => $activeJobs->count() === 0 ? 'Cancelled' : $manifest->status,
                    'driver_released' => $activeJobs->count() === 0
                ];
            }

            // ============================================================
            // 4. DEACTIVATE ASSIGNMENTS (Optional cleanup)
            // ============================================================
            // Get affected drivers before cancelling assignments
            $affectedDriverIds = Assignment::where('job_order_id', $jobOrderId)
                ->where('status', 'Active')
                ->pluck('driver_id')
                ->unique()
                ->filter();

            Assignment::where('job_order_id', $jobOrderId)
                ->where('status', 'Active')
                ->update(['status' => 'Cancelled']);

            // ============================================================
            // 5. RESET DRIVER STATUS TO AVAILABLE
            // ============================================================
            // Kembalikan status driver ke 'Available' jika tidak punya assignment aktif lain
            $releasedDrivers = [];
            foreach ($affectedDriverIds as $driverId) {
                $hasOtherActiveAssignments = Assignment::where('driver_id', $driverId)
                    ->where('status', 'Active')
                    ->exists();

                $hasActiveManifest = \App\Models\Manifests::where('driver_id', $driverId)
                    ->whereNotIn('status', ['Completed', 'Cancelled', 'Delivered'])
                    ->exists();

                if (!$hasOtherActiveAssignments && !$hasActiveManifest) {
                    \App\Models\Drivers::where('driver_id', $driverId)
                        ->update(['status' => 'Available']);
                    $releasedDrivers[] = $driverId;
                    \Log::info("[CANCEL JO] Driver {$driverId} status reset to Available");
                }
            }

            \Log::info("[CANCEL JO] Job Order {$jobOrderId} dibatalkan", [
                'cancelled_dos' => $cancelledDOs,
                'updated_manifests' => $updatedManifests,
                'released_drivers' => $releasedDrivers,
                'reason' => $cancellationReason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Job Order berhasil dibatalkan',
                'data' => [
                    'job_order_id' => $jobOrderId,
                    'status' => 'Cancelled',
                    'cancelled_at' => now()->toISOString(),
                    'cancellation_reason' => $cancellationReason,
                    'cancelled_delivery_orders' => $cancelledDOs,
                    'updated_manifests' => $updatedManifests
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error("[CANCEL JO] Error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan Job Order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store assignment driver and vehicle to job order
     * 
     * @param Request $request
     * @param string $jobOrderId
     * @return JsonResponse
     */
    public function storeAssignment(Request $request, string $jobOrderId): JsonResponse
    {
        try {
            $jobOrder = JobOrder::where('job_order_id', $jobOrderId)->first();

            if (!$jobOrder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job Order not found'
                ], 404);
            }

            // ✅ Validation
        $validated = $request->validate([
            'driver_id' => 'required|exists:drivers,driver_id',
            'vehicle_id' => 'required|exists:vehicles,vehicle_id',
            'status' => 'required|in:Active,Standby',
            'notes' => 'nullable|string|max:500'
        ]);

        // ✅ Check if driver is available
        $driverBusy = Assignment::where('driver_id', $request->driver_id)
            ->where('status', 'Active')
            ->whereHas('jobOrder', function($query) use ($jobOrderId) {
                $query->where('job_order_id', '!=', $jobOrderId)
                ->whereNotIn('status', ['Completed', 'Cancelled']);
            })
            ->first();

            if ($driverBusy) {
            return response()->json([
                'success' => false,
                'message' => 'Driver is currently assigned to another active job order',
                'errors' => [
                    'driver_id' => ['Driver is currently assigned to another active job order (' . $driverBusy->job_order_id . ')']
                ],
                'assigned_to' => $driverBusy->job_order_id
            ], 422);
        }

        // ✅ Check if vehicle is available
        $vehicleBusy = Assignment::where('vehicle_id', $request->vehicle_id)
            ->where('status', 'Active')
            ->whereHas('jobOrder', function($query) use ($jobOrderId) {
                $query->where('job_order_id', '!=', $jobOrderId)
                ->whereNotIn('status', ['Completed', 'Cancelled']);
            })
            ->exists();

        if ($vehicleBusy) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle is currently assigned to another active job order',
                'errors' => [
                    'vehicle_id' => ['Vehicle is currently assigned to another active job order']
                ]
            ], 422);
        }

        // ✅ 1. Cancel existing active assignments for this job order (History Logic)
        Assignment::where('job_order_id', $jobOrderId)
            ->where('status', 'Active')
            ->update(['status' => 'Cancelled']);

        // ✅ 2. Create new assignment
        $assignment = Assignment::create([
            'job_order_id' => $jobOrderId,
            'driver_id' => $request->driver_id,
            'vehicle_id' => $request->vehicle_id,
            'status' => 'Active', // Always Active for new assignment
            'notes' => $request->notes,
            'assigned_at' => now(),
            'assigned_by' => Auth::id() ?? 'SYSTEM' // Ideally should be logged in user
        ]);

        // ✅ 3. Update job order status (Side Effect)
        $jobOrder->update(['status' => 'Assigned']);
        
        // Record status history
        // Record status history
        $driverName = $assignment->driver->driver_name ?? 'Driver';
        $vehiclePlate = $assignment->vehicle->plate_no ?? null;
        
        // Conditional rendering: Only show vehicle if plate number exists
        $vehicleText = $vehiclePlate ? " - Vehicle {$vehiclePlate}" : "";
        $notes = "Order assigned to driver {$driverName}{$vehicleText}";
        
        $this->createStatusHistory($jobOrderId, 'Assigned', 'Admin', $notes, 'user');

        // ✅ Load relations
        $assignment->load(['driver', 'vehicle.vehicleType']);

        // 🔔 Send Push Notification
        $this->firebaseService->sendToDriver(
            $request->driver_id,
            'Tugas FTL Baru! 🚛',
            "Anda ditugaskan untuk Job FTL {$jobOrder->job_order_id} ({$jobOrder->pickup_city} -> {$jobOrder->delivery_city})",
            [
                'type' => 'ftl_assignment',
                'job_order_id' => $jobOrder->job_order_id,
                'customer_name' => $jobOrder->customer->customer_name ?? 'Customer'
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Assignment created successfully',
            'data' => [
                'assignment_id' => $assignment->assignment_id, // Use correct primary key
                'job_order_id' => $jobOrderId,
                'status' => 'Active',
                'driver' => [
                    'driver_id' => $assignment->driver->driver_id,
                    'driver_name' => $assignment->driver->driver_name,
                    'phone' => $assignment->driver->phone ?? null,
                    'license_number' => $assignment->driver->license_number ?? null,
                ],
                'vehicle' => [
                    'vehicle_id' => $assignment->vehicle->vehicle_id,
                    'license_plate' => $assignment->vehicle->plate_no,
                    'vehicle_type' => $assignment->vehicle->vehicleType->type_name ?? null,
                    'capacity' => $assignment->vehicle->capacity ?? null,
                ],
                'assigned_at' => $assignment->assigned_at,
                'assigned_by' => $assignment->assigned_by ?? 'SYSTEM',
                'notes' => $assignment->notes,
            ]
        ], 201);
        
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating the assignment',
                'error' => $e->getMessage()
            ], 500);
        }
        
    }

    /**
     * Get job order assignments
     * 
     * @param string $jobOrderId
     * @return JsonResponse
     */
    public function getAssignments(string $jobOrderId): JsonResponse
    {
        $assignments = Assignment::with(['driver', 'vehicle.vehicleType'])
            ->where('job_order_id', $jobOrderId)
            ->orderBy('assigned_at', 'desc')
            ->get();

        // ✅ INJECT VIRTUAL ASSIGNMENT FROM MANIFEST
        // Cek apakah Job Order ini punya Manifest aktif
        // ⚠️ SKIP untuk FTL - FTL sudah punya assignment sendiri via halaman detail Job Order
        $jobOrder = JobOrder::with(['manifests.drivers', 'manifests.vehicles'])
            ->where('job_order_id', $jobOrderId)
            ->first();
            
        if ($jobOrder) {
            // ✅ Skip Virtual Assignment untuk FTL type
            // FTL memiliki flow assignment driver sendiri langsung dari Job Order
            // Hanya LTL yang perlu virtual assignment dari Manifest
            if ($jobOrder->order_type !== 'FTL') {
                $activeManifest = $jobOrder->manifests
                    ->whereIn('status', ['Pending', 'In Transit', 'Arrived', 'Completed'])
                    ->sortByDesc('created_at')
                    ->first();

                // Jika ada manifest dengan driver, tambahkan sebagai "Assignment"
                if ($activeManifest && $activeManifest->drivers) {
                    // Buat object yang strukturnya mirip dengan Assignment Model
                    $virtualAssignment = new \stdClass();
                    $virtualAssignment->assignment_id = 'manifest-' . $activeManifest->manifest_id;
                    $virtualAssignment->job_order_id = $jobOrderId;
                    $virtualAssignment->assignment_type = 'driver_assignment';
                    $virtualAssignment->status = 'active'; // Lowercase agar sesuai filter frontend
                    $virtualAssignment->assigned_at = $activeManifest->created_at;
                    $virtualAssignment->notes = "Assigned via Manifest #{$activeManifest->manifest_id}";
                    
                    // Relasi
                    $virtualAssignment->driver = $activeManifest->drivers;   // Relation is 'drivers'
                    $virtualAssignment->vehicle = $activeManifest->vehicles; // Relation is 'vehicles'
                    
                    // Tambahan field untuk Frontend
                    $virtualAssignment->created_by_name = 'System (Manifest)';
                    $virtualAssignment->created_by_role = 'System';

                    // Tambahkan ke paling atas list
                    $assignments->prepend($virtualAssignment);
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => $assignments
        ], 200);
    }

    /**
     * Create status history record
     * 
     * @param string $jobOrderId
     * @param string $status
     * @param string $changedBy
     * @return void
     */
    private function createStatusHistory(string $jobOrderId, string $status, string $changedBy, ?string $notes = null, string $triggerType = 'user'): void
    {
        JobOrderStatusHistory::create([
            'job_order_id' => $jobOrderId,
            'status' => $status,
            'changed_by' => $changedBy,
            'notes' => $notes,
            'trigger_type' => $triggerType,
            'changed_at' => now()
        ]);
    }
}