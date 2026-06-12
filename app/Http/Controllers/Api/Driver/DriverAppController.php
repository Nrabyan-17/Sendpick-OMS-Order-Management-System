<?php

namespace App\Http\Controllers\Api\Driver;

use App\Http\Controllers\Controller;
use App\Models\Drivers;
use App\Models\JobOrder;
use App\Models\Assignment;
use App\Models\DeliveryOrder;
use App\Models\ProofOfDelivery;
use App\Models\Gps;
use App\Models\JobOrderStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * DriverAppController - Controller untuk Mobile App Driver
 * 
 * Fungsi utama:
 * - Authentication (login/logout) khusus driver
 * - Profile management driver
 * - Job management (list, detail, accept, reject)
 * - Status update (pickup, delivery, complete)
 * - Proof of Delivery (POD) upload
 * - QR Code scanning untuk validasi pickup/delivery
 * - GPS location updates
 * - Job history dan statistics
 * - Driver status toggle (online/offline)
 * 
 * Catatan:
 * - Semua endpoint hanya untuk Mobile App Driver
 * - Menggunakan Laravel Sanctum untuk authentication
 * - Route prefix: /api/driver
 */
class DriverAppController extends Controller
{
    /**
     * ============================================
     * AUTHENTICATION METHODS
     * ============================================
     */

    /**
     * Driver login - Autentikasi untuk mobile app
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $driver = Drivers::where('email', $request->email)->first();

        // Verify credentials
        if (!$driver || !Hash::check($request->password, $driver->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah'
            ], 401);
        }

        // Check driver status
        if ($driver->status === 'Tidak Aktif') {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda tidak aktif. Silakan hubungi admin.'
            ], 403);
        }

        // Generate token (1 year expiration for mobile)
        $token = $driver->createToken('mobile-driver-token', ['*'], now()->addYear())->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'driver' => [
                    'driver_id' => $driver->driver_id,
                    'driver_name' => $driver->driver_name,
                    'email' => $driver->email,
                    'phone' => $driver->phone,
                    'status' => $driver->status,
                    'shift' => $driver->shift
                ],
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ], 200);
    }

    /**
     * Driver logout - Hapus token autentikasi
     * UI: Tombol "Keluar" di profil.png
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil'
        ], 200);
    }

    /**
     * ============================================
     * PROFILE MANAGEMENT
     * ============================================
     */

    /**
     * Get driver profile - Data profil driver yang login
     * UI: profil.png (menampilkan "Ahmad", "+62 812...", "247 Total Order")
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getProfile(Request $request): JsonResponse
    {
        $driver = $request->user();

        // Calculate statistics
        $totalOrders = Assignment::where('driver_id', $driver->driver_id)
            ->where('status', 'Completed')
            ->count();

        $totalDelivered = DeliveryOrder::whereHas('jobOrder.assignments', function($q) use ($driver) {
                $q->where('driver_id', $driver->driver_id);
            })
            ->where('status', 'Delivered')
            ->count();

        $totalDistance = Gps::where('driver_id', $driver->driver_id)
            ->whereDate('sent_at', '>=', now()->subDays(30))
            ->count() * 0.5; // Approximate distance calculation

        return response()->json([
            'success' => true,
            'data' => [
                'driver_id' => $driver->driver_id,
                'driver_name' => $driver->driver_name,
                'email' => $driver->email,
                'phone' => $driver->phone,
                'status' => $driver->status,
                'shift' => $driver->shift,
                'last_lat' => $driver->last_lat,
                'last_lng' => $driver->last_lng,
                'statistics' => [
                    'total_orders' => $totalOrders,
                    'total_delivered' => $totalDelivered,
                    'total_distance_km' => round($totalDistance, 2)
                ]
            ]
        ], 200);
    }

    /**
     * Update driver status - Toggle online/offline
     * UI: Toggle "Status Driver" di profil.png
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateDriverStatus(Request $request): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:Available,On Duty,Off Duty,Tidak Aktif'
        ]);

        $driver = $request->user();
        $driver->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Status driver berhasil diubah',
            'data' => [
                'driver_id' => $driver->driver_id,
                'status' => $driver->status
            ]
        ], 200);
    }

    /**
     * Select vehicle - Driver memilih kendaraan setelah login
     * UI: Halaman pemilihan kendaraan setelah login di mobile app
     * 
     * Logika:
     * - 1 driver hanya bisa memilih 1 kendaraan pada satu waktu
     * - Kendaraan yang dipilih akan ter-link ke driver (driver_id di vehicles)
     * - Status kendaraan akan berubah menjadi 'In Use'
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function selectVehicle(Request $request): JsonResponse
    {
        $request->validate([
            'vehicle_id' => 'required|exists:vehicles,vehicle_id'
        ]);

        $driver = $request->user();
        $vehicleId = $request->vehicle_id;

        // Check if vehicle is already in use by another driver
        $vehicle = Vehicles::find($vehicleId);
        
        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Kendaraan tidak ditemukan'
            ], 404);
        }

        // Check if vehicle is already assigned to another driver
        if ($vehicle->driver_id && $vehicle->driver_id !== $driver->driver_id) {
            $currentDriver = Drivers::find($vehicle->driver_id);
            return response()->json([
                'success' => false,
                'message' => 'Kendaraan ini sedang digunakan oleh driver lain: ' . ($currentDriver->driver_name ?? 'Unknown')
            ], 422);
        }

        // Check if vehicle is available (not Maintenance or Tidak Aktif)
        if (in_array($vehicle->status, ['Maintenance', 'Tidak Aktif'])) {
            return response()->json([
                'success' => false,
                'message' => 'Kendaraan tidak tersedia. Status: ' . $vehicle->status
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Release previous vehicle if driver had one
            Vehicles::where('driver_id', $driver->driver_id)
                ->where('vehicle_id', '!=', $vehicleId)
                ->update([
                    'driver_id' => null,
                    'status' => 'Available'
                ]);

            // Assign new vehicle to driver
            $vehicle->update([
                'driver_id' => $driver->driver_id,
                'status' => 'In Use'
            ]);

            DB::commit();

            // Reload vehicle with type info
            $vehicle->load('vehicleType');

            return response()->json([
                'success' => true,
                'message' => 'Kendaraan berhasil dipilih',
                'data' => [
                    'vehicle_id' => $vehicle->vehicle_id,
                    'plate_no' => $vehicle->plate_no,
                    'brand' => $vehicle->brand,
                    'model' => $vehicle->model,
                    'vehicle_type' => $vehicle->vehicleType->name ?? null,
                    'status' => $vehicle->status
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('[SELECT VEHICLE] Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memilih kendaraan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available vehicles - Daftar kendaraan yang bisa dipilih driver
     * UI: Dropdown/list pemilihan kendaraan di mobile app
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getAvailableVehicles(Request $request): JsonResponse
    {
        $driver = $request->user();

        // Get vehicles that are Available OR already assigned to this driver
        $vehicles = Vehicles::with('vehicleType')
            ->where(function($query) use ($driver) {
                $query->where('status', 'Available')
                    ->orWhere('driver_id', $driver->driver_id);
            })
            ->whereNotIn('status', ['Maintenance', 'Tidak Aktif'])
            ->get()
            ->map(function($vehicle) use ($driver) {
                return [
                    'vehicle_id' => $vehicle->vehicle_id,
                    'plate_no' => $vehicle->plate_no,
                    'brand' => $vehicle->brand,
                    'model' => $vehicle->model,
                    'vehicle_type' => $vehicle->vehicleType->name ?? null,
                    'capacity' => $vehicle->capacity_label,
                    'status' => $vehicle->status,
                    'is_selected' => $vehicle->driver_id === $driver->driver_id
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $vehicles
        ], 200);
    }

    /**
     * ============================================
     * FCM TOKEN MANAGEMENT
     * ============================================
     */

    /**
     * Update FCM Token - Simpan token untuk push notification
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateFcmToken(Request $request): JsonResponse
    {
        $request->validate([
            'fcm_token' => 'required|string|max:500'
        ]);

        $driver = $request->user();
        $driver->update(['fcm_token' => $request->fcm_token]);

        return response()->json([
            'success' => true,
            'message' => 'FCM token berhasil disimpan',
            'data' => [
                'driver_id' => $driver->driver_id
            ]
        ], 200);
    }

    /**
     * ============================================
     * JOB MANAGEMENT
     * ============================================
     */

    /**
     * Get jobs list - Order aktif dan pending
     * UI: homepage.png (menampilkan "Order Aktif" dan "Order Pending")
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getJobs(Request $request): JsonResponse
    {
        $driver = $request->user();

        // Get active orders (assigned to this driver, in progress)
        $activeOrders = JobOrder::whereHas('assignments', function($q) use ($driver) {
                $q->where('driver_id', $driver->driver_id)
                  ->where('status', 'Active');
            })
            ->whereIn('status', ['Processing', 'In Transit', 'Pickup Complete'])
            ->with(['customer', 'assignments' => function($q) use ($driver) {
                $q->where('driver_id', $driver->driver_id);
            }])
            ->get()
            ->map(function($order) {
                $assignment = $order->assignments->first();
                return [
                    'job_order_id' => $order->job_order_id,
                    'customer_name' => $order->customer->customer_name ?? 'N/A',
                    'pickup_address' => $order->pickup_address,
                    'delivery_address' => $order->delivery_address,
                    'goods_desc' => $order->goods_desc,
                    'goods_weight' => $order->goods_weight,
                    'ship_date' => $order->ship_date,
                    'status' => $order->status,
                    'order_type' => $order->order_type,
                    'assignment_status' => $assignment->status ?? 'N/A'
                ];
            });

        // Get pending orders (available for this driver to accept)
        // These are orders without assignment or rejected by other drivers
        $pendingOrders = JobOrder::where('status', 'Pending')
            ->whereDoesntHave('assignments', function($q) {
                $q->where('status', 'Active');
            })
            ->with('customer')
            ->limit(5)
            ->get()
            ->map(function($order) {
                return [
                    'job_order_id' => $order->job_order_id,
                    'customer_name' => $order->customer->customer_name ?? 'N/A',
                    'pickup_address' => $order->pickup_address,
                    'delivery_address' => $order->delivery_address,
                    'goods_desc' => $order->goods_desc,
                    'goods_weight' => $order->goods_weight,
                    'ship_date' => $order->ship_date,
                    'order_type' => $order->order_type
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'active_orders' => $activeOrders,
                'pending_orders' => $pendingOrders
            ]
        ], 200);
    }

    /**
     * Get job details - Detail lengkap order
     * UI: Tab "Detail Order" di pod.png
     * 
     * @param Request $request
     * @param string $jobOrderId
     * @return JsonResponse
     */
    public function getJobDetails(Request $request, string $jobOrderId): JsonResponse
    {
        $driver = $request->user();

        $jobOrder = JobOrder::with(['customer', 'assignments' => function($q) use ($driver) {
                $q->where('driver_id', $driver->driver_id);
            }])
            ->where('job_order_id', $jobOrderId)
            ->first();

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Job order tidak ditemukan'
            ], 404);
        }

        $assignment = $jobOrder->assignments->first();

        // Get related delivery order
        $deliveryOrder = DeliveryOrder::where('source_type', 'JO')
            ->where('source_id', $jobOrderId)
            ->first();

        // Get POD if exists
        $pod = ProofOfDelivery::where('job_order_id', $jobOrderId)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'job_order' => [
                    'job_order_id' => $jobOrder->job_order_id,
                    'customer_name' => $jobOrder->customer->customer_name ?? 'N/A',
                    'customer_phone' => $jobOrder->customer->contact_person ?? 'N/A',
                    // Delivery information only (no pickup - delivery from warehouse model)
                    'delivery_address' => $jobOrder->delivery_address,
                    'delivery_city' => $jobOrder->delivery_city,
                    'delivery_lat' => $jobOrder->delivery_lat,
                    'delivery_lng' => $jobOrder->delivery_lng,
                    'recipient_name' => $jobOrder->recipient_name,
                    'recipient_phone' => $jobOrder->recipient_phone,
                    // Goods information
                    'goods_desc' => $jobOrder->goods_desc,
                    'goods_qty' => $jobOrder->goods_qty,
                    'goods_weight' => $jobOrder->goods_weight,
                    'goods_volume' => $jobOrder->goods_volume,
                    // Schedule
                    'ship_date' => $jobOrder->ship_date,
                    'delivery_date' => $jobOrder->delivery_date,
                    // Status & type
                    'status' => $jobOrder->status,
                    'order_type' => $jobOrder->order_type,
                    'special_instruction' => $jobOrder->special_instruction
                ],
                'assignment' => $assignment ? [
                    'assignment_id' => $assignment->id,
                    'status' => $assignment->status,
                    'assigned_at' => $assignment->assigned_at
                ] : null,
                'delivery_order' => $deliveryOrder ? [
                    'do_id' => $deliveryOrder->do_id,
                    'status' => $deliveryOrder->status,
                    'delivery_location' => $deliveryOrder->delivery_location,
                    'goods_summary' => $deliveryOrder->goods_summary
                ] : null,
                'proof_of_delivery' => $pod ? [
                    'recipient_name' => $pod->recipient_name,
                    'photo_url' => $pod->photo_url ? Storage::url($pod->photo_url) : null,
                    'signature_url' => $pod->signature_url ? Storage::url($pod->signature_url) : null,
                    'delivered_at' => $pod->delivered_at
                ] : null
            ]
        ], 200);
    }

    /**
     * Accept order - Driver menerima order pending
     * UI: Tombol checkmark (✓) di card "Order Pending" pada homepage.png
     * 
     * @param Request $request
     * @param string $jobOrderId
     * @return JsonResponse
     */
    public function acceptOrder(Request $request, string $jobOrderId): JsonResponse
    {
        $driver = $request->user();

        $jobOrder = JobOrder::where('job_order_id', $jobOrderId)
            ->where('status', 'Pending')
            ->first();

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Job order tidak ditemukan atau sudah tidak tersedia'
            ], 404);
        }

        // Check if driver already has active assignments
        $activeAssignments = Assignment::where('driver_id', $driver->driver_id)
            ->where('status', 'Active')
            ->count();

        if ($activeAssignments >= 5) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah memiliki 5 order aktif. Selesaikan order terlebih dahulu.'
            ], 422);
        }

        // Check if vehicle is currently in use by another active assignment
        if ($request->vehicle_id) {
            $vehicleInUse = Assignment::where('vehicle_id', $request->vehicle_id)
                ->where('status', 'Active')
                ->exists();

            if ($vehicleInUse) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kendaraan ini sedang digunakan untuk job order lain yang masih aktif.'
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            // Create assignment
            $assignment = Assignment::create([
                'job_order_id' => $jobOrderId,
                'driver_id' => $driver->driver_id,
                'vehicle_id' => $request->vehicle_id ?? null, // Optional, bisa diisi nanti
                'status' => 'Active',
                'assigned_at' => now()
            ]);

            // Update job order status
            $jobOrder->update(['status' => 'Assigned']);

            // Update driver status
            $driver->update(['status' => 'On Duty']);

            // Create status history
            $this->createStatusHistory($jobOrderId, 'Assigned', $driver->driver_name, 'Driver accepted the order', 'user');

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order berhasil diterima',
                'data' => [
                    'job_order_id' => $jobOrderId,
                    'assignment_id' => $assignment->id
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menerima order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject order - Driver menolak order pending
     * UI: Tombol 'X' (Tolak) di card "Order Pending" pada homepage.png
     * 
     * @param Request $request
     * @param string $jobOrderId
     * @return JsonResponse
     */
    public function rejectOrder(Request $request, string $jobOrderId): JsonResponse
    {
        $request->validate([
            'reason' => 'nullable|string|max:500'
        ]);

        $jobOrder = JobOrder::where('job_order_id', $jobOrderId)
            ->where('status', 'Pending')
            ->first();

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Job order tidak ditemukan'
            ], 404);
        }

        // Log rejection (optional: create rejection log table)
        // For now, just return success

        return response()->json([
            'success' => true,
            'message' => 'Order berhasil ditolak',
            'data' => [
                'job_order_id' => $jobOrderId,
                'reason' => $request->reason ?? 'Tidak disebutkan'
            ]
        ], 200);
    }

    /**
     * Update job status - Ubah status order (pickup, delivery, complete)
     * UI: Tombol "Selesaikan Orderan" di homepage.png dan "Selesai" di pod (1).png
     * 
     * @param Request $request
     * @param string $jobOrderId
     * @return JsonResponse
     */
    public function updateJobStatus(Request $request, string $jobOrderId): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:Processing, In Transit, Pickup Complete, Nearby, Delivered',
            'notes' => 'nullable|string|max:500'
        ]);

        $driver = $request->user();

        $jobOrder = JobOrder::whereHas('assignments', function($q) use ($driver) {
                $q->where('driver_id', $driver->driver_id)
                  ->where('status', 'Active');
            })
            ->where('job_order_id', $jobOrderId)
            ->first();

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Job order tidak ditemukan atau Anda tidak memiliki akses'
            ], 404);
        }

        DB::beginTransaction();
        try {
            // Update job order status
            $jobOrder->update(['status' => $request->status]);

            // Create status history
            $this->createStatusHistory($jobOrderId, $request->status, $driver->driver_name, $request->notes ?? "Status updated by driver", 'user');

            // Update related delivery order
            $deliveryOrder = DeliveryOrder::where('source_type', 'JO')
                ->where('source_id', $jobOrderId)
                ->first();

            if ($deliveryOrder) {
                // Map job order status to delivery order status
                $doStatus = match($request->status) {
                    'Processing' => 'Assigned',
                    'In Transit' => 'In Transit',
                    'Pickup Complete' => 'In Transit',
                    'Nearby' => 'Nearby',
                    'Delivered' => 'Delivered',
                    default => $deliveryOrder->status
                };

                $deliveryOrder->update(['status' => $doStatus]);
            }

            // If completed, update assignment status
            if ($request->status === 'Delivered') {
                Assignment::where('job_order_id', $jobOrderId)
                    ->where('driver_id', $driver->driver_id)
                    ->update(['status' => 'Completed']);

                // Check if driver has other active assignments
                $hasActiveOrders = Assignment::where('driver_id', $driver->driver_id)
                    ->where('status', 'Active')
                    ->exists();

                if (!$hasActiveOrders) {
                    $driver->update(['status' => 'Available']);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Status order berhasil diubah',
                'data' => [
                    'job_order_id' => $jobOrderId,
                    'new_status' => $request->status
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ============================================
     * PROOF OF DELIVERY (POD)
     * ============================================
     */

    /**
     * Upload POD - Upload foto/tanda tangan sebagai bukti delivery
     * UI: Tab "Proof of Delivery" di pod (1).png
     * 
     * @param Request $request
     * @param string $jobOrderId
     * @return JsonResponse
     */
    public function uploadPod(Request $request, string $jobOrderId): JsonResponse
    {
        $request->validate([
            'recipient_name' => 'required|string|max:255',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png|max:5120', // 5MB
            'signature' => 'nullable|image|mimes:jpg,jpeg,png|max:2048', // 2MB
            'notes' => 'nullable|string|max:500'
        ]);

        $driver = $request->user();

        // Get delivery order
        $deliveryOrder = DeliveryOrder::where('source_type', 'JO')
            ->where('source_id', $jobOrderId)
            ->first();

        if (!$deliveryOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Delivery order tidak ditemukan'
            ], 404);
        }

        // Verify driver is assigned to this order
        $assignment = Assignment::where('job_order_id', $jobOrderId)
            ->where('driver_id', $driver->driver_id)
            ->first();

        if (!$assignment) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke order ini'
            ], 403);
        }

        DB::beginTransaction();
        try {
            $podData = [
                'job_order_id' => $jobOrderId,
                'recipient_name' => $request->recipient_name,
                'notes' => $request->notes,
                'delivered_at' => now()
            ];

            // Upload photo
            if ($request->hasFile('photo')) {
                $photoPath = $request->file('photo')->store('pod/photos', 'public');
                $podData['photo_url'] = $photoPath;
            }

            // Upload signature
            if ($request->hasFile('signature')) {
                $signaturePath = $request->file('signature')->store('pod/signatures', 'public');
                $podData['signature_url'] = $signaturePath;
            }

            // Create or update POD
            $pod = ProofOfDelivery::updateOrCreate(
                ['job_order_id' => $jobOrderId],
                $podData
            );

            // Auto-update status to Delivered
            $deliveryOrder->update(['status' => 'Delivered']);
            
            if ($jobOrder) {
                $jobOrder->update(['status' => 'Delivered']);
                $this->createStatusHistory($jobOrderId, 'Delivered', $driver->driver_name, "POD Uploaded. Recipient: {$request->recipient_name}", 'user');
            }

            $assignment->update(['status' => 'Completed']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proof of Delivery berhasil diupload',
                'data' => [
                    'pod_id' => $pod->id,
                    'do_id' => $deliveryOrder->do_id,
                    'photo_url' => $pod->photo_url ? Storage::url($pod->photo_url) : null,
                    'signature_url' => $pod->signature_url ? Storage::url($pod->signature_url) : null
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal upload POD: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ============================================
     * QR CODE SCANNING
     * ============================================
     */

    /**
     * Scan QR code - Validasi dan update status otomatis
     * UI: scan.png
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function scanQrCode(Request $request): JsonResponse
    {
        $request->validate([
            'qr_code_string' => 'required|string'
        ]);

        $driver = $request->user();
        $qrCode = $request->qr_code_string;

        // Find job order by QR code
        $jobOrder = JobOrder::where('qr_code_string', $qrCode)->first();

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'QR Code tidak valid atau order tidak ditemukan'
            ], 404);
        }

        // Verify driver is assigned to this order
        $assignment = Assignment::where('job_order_id', $jobOrder->job_order_id)
            ->where('driver_id', $driver->driver_id)
            ->where('status', 'Active')
            ->first();

        if (!$assignment) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke order ini'
            ], 403);
        }

        DB::beginTransaction();
        try {
            // Auto-update status based on current status
            $newStatus = match($jobOrder->status) {
                'Assigned', 'Processing' => 'Pickup Complete',
                'In Transit' => 'Nearby',
                'Nearby' => 'Delivered',
                default => $jobOrder->status
            };

            $jobOrder->update(['status' => $newStatus]);
            
            // Create status history
            $this->createStatusHistory($jobOrder->job_order_id, $newStatus, $driver->driver_name, "Status updated via QR Scan", 'user');

            // Update delivery order
            $deliveryOrder = DeliveryOrder::where('source_type', 'JO')
                ->where('source_id', $jobOrder->job_order_id)
                ->first();

            if ($deliveryOrder) {
                $doStatus = match($newStatus) {
                    'Pickup Complete' => 'In Transit',
                    'Nearby' => 'Nearby',
                    'Delivered' => 'Delivered',
                    default => $deliveryOrder->status
                };

                $deliveryOrder->update(['status' => $doStatus]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'QR Code berhasil dipindai',
                'data' => [
                    'job_order_id' => $jobOrder->job_order_id,
                    'previous_status' => $jobOrder->getOriginal('status'),
                    'new_status' => $newStatus,
                    'customer_name' => $jobOrder->customer->customer_name ?? 'N/A',
                    'goods_desc' => $jobOrder->goods_desc
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses QR code: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ============================================
     * GPS LOCATION UPDATES
     * ============================================
     */

    /**
     * Bulk store GPS locations - Batch upload GPS tracking data
     * Driver app akan mengirim batch GPS data setiap interval waktu
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkStoreGps(Request $request): JsonResponse
    {
        $request->validate([
            'locations' => 'required|array|min:1',
            'locations.*.lat' => 'required|numeric|between:-90,90',
            'locations.*.lng' => 'required|numeric|between:-180,180',
            'locations.*.sent_at' => 'required|date',
            'locations.*.order_id' => 'nullable|string'
        ]);

        $driver = $request->user();
        $insertData = [];

        foreach ($request->locations as $location) {
            $insertData[] = [
                'driver_id' => $driver->driver_id,
                'vehicle_id' => $location['vehicle_id'] ?? null,
                'order_id' => $location['order_id'] ?? null,
                'lat' => $location['lat'],
                'lng' => $location['lng'],
                'sent_at' => $location['sent_at'],
                'received_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ];
        }

        try {
            Gps::insert($insertData);

            // Update driver's last location
            $lastLocation = end($insertData);
            $driver->update([
                'last_lat' => $lastLocation['lat'],
                'last_lng' => $lastLocation['lng']
            ]);

            return response()->json([
                'success' => true,
                'message' => count($insertData) . ' GPS points berhasil disimpan',
                'data' => [
                    'total_points' => count($insertData)
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan GPS data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ============================================
     * JOB HISTORY & STATISTICS
     * ============================================
     */

    /**
     * Get job history - Riwayat order yang sudah selesai
     * UI: histori.png
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getJobHistory(Request $request): JsonResponse
    {
        $driver = $request->user();

        // Filter by date range
        $startDate = $request->get('start_date', now()->subDays(30));
        $endDate = $request->get('end_date', now());

        $history = JobOrder::whereHas('assignments', function($q) use ($driver) {
                $q->where('driver_id', $driver->driver_id)
                  ->where('status', 'Completed');
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with(['customer', 'assignments' => function($q) use ($driver) {
                $q->where('driver_id', $driver->driver_id);
            }])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($order) {
                $assignment = $order->assignments->first();
                return [
                    'job_order_id' => $order->job_order_id,
                    'customer_name' => $order->customer->customer_name ?? 'N/A',
                    'delivery_address' => $order->delivery_address,
                    'goods_desc' => $order->goods_desc,
                    'goods_weight' => $order->goods_weight,
                    'status' => $order->status,
                    'completed_at' => $assignment->updated_at ?? null
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $history
        ], 200);
    }

    /**
     * Get history statistics - KPI untuk driver
     * UI: KPI Cards "210 Order Terkirim" dan "143 kg Total Order" di histori.png
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getHistoryStats(Request $request): JsonResponse
    {
        $driver = $request->user();

        $stats = [
            'total_delivered' => Assignment::where('driver_id', $driver->driver_id)
                ->where('status', 'Completed')
                ->count(),

            'total_weight_kg' => JobOrder::whereHas('assignments', function($q) use ($driver) {
                    $q->where('driver_id', $driver->driver_id)
                    ->where('status', 'Completed');
                })
                ->sum('goods_weight'),

            'total_distance_km' => Gps::where('driver_id', $driver->driver_id)
                ->whereDate('sent_at', '>=', now()->subDays(30))
                ->count() * 0.5, // Approximate

            'completed_this_month' => Assignment::where('driver_id', $driver->driver_id)
                ->where('status', 'Completed')
                ->whereMonth('updated_at', now()->month)
                ->count(),

            'avg_delivery_time_hours' => 4.5, // Placeholder - needs complex calculation
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ], 200);
    }

    /**
     * Check vehicle availability - Cek apakah kendaraan tersedia atau sedang digunakan
     * 
     * @param Request $request
     * @param string $vehicleId
     * @return JsonResponse
     */
    public function checkVehicleAvailability(Request $request, string $vehicleId): JsonResponse
    {
        // Check if vehicle exists
        $vehicle = \App\Models\Vehicles::find($vehicleId);
        
        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Kendaraan tidak ditemukan'
            ], 404);
        }

        // Check if vehicle is currently in use (has active assignment)
        $activeAssignment = Assignment::where('vehicle_id', $vehicleId)
            ->where('status', 'Active')
            ->with(['driver', 'jobOrder'])
            ->first();

        if ($activeAssignment) {
            return response()->json([
                'success' => true,
                'data' => [
                    'vehicle_id' => $vehicleId,
                    'license_plate' => $vehicle->license_plate,
                    'is_available' => false,
                    'status' => 'In Use',
                    'current_driver' => $activeAssignment->driver ? [
                        'driver_id' => $activeAssignment->driver->driver_id,
                        'driver_name' => $activeAssignment->driver->driver_name
                    ] : null,
                    'current_job_order' => $activeAssignment->jobOrder ? [
                        'job_order_id' => $activeAssignment->jobOrder->job_order_id,
                        'status' => $activeAssignment->jobOrder->status
                    ] : null
                ]
            ], 200);
        }

        // Vehicle is available
        return response()->json([
            'success' => true,
            'data' => [
                'vehicle_id' => $vehicleId,
                'license_plate' => $vehicle->license_plate,
                'is_available' => true,
                'status' => 'Available',
                'current_driver' => null,
                'current_job_order' => null
            ]
        ], 200);
    }
    /**
     * Create status history record
     * 
     * @param string $jobOrderId
     * @param string $status
     * @param string $changedBy
     * @param string|null $notes
     * @param string $triggerType
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