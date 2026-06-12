<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Gps;
use App\Models\Drivers;
use App\Models\Vehicles;
use App\Models\DeliveryOrder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * GpsController (TrackingController untuk Admin Panel)
 * 
 * Fungsi utama:
 * - Menampilkan lokasi real-time semua driver (Read-Only)
 * - Tracking history untuk order tertentu (Read-Only)
 * - Live tracking untuk delivery order spesifik (Read-Only)
 * - Tidak ada CRUD (Create/Update/Delete)
 * 
 * Catatan:
 * - Data GPS otomatis dibuat oleh Driver App (bukan manual dari Admin)
 * - Controller ini HANYA untuk READ operations
 * - Method bulkStore() dipindah ke DriverAppController (akan dibuat nanti)
 */
class GpsController extends Controller
{
    /**
     * ============================================
     * METHOD READ-ONLY UNTUK ADMIN PANEL
     * ============================================
     */

    /**
     * Get current locations of all active drivers
     * Untuk halaman "Real Time Tracking" di Admin Panel (SRS F-ADM-023)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getCurrentLocations(Request $request): JsonResponse
    {
        // Get latest GPS data for each active driver
        $currentLocations = Gps::select('gps_tracking_logs.*')
            ->with(['driver', 'vehicle'])
            ->whereIn('id', function($query) {
                $query->select(DB::raw('MAX(id)'))
                    ->from('gps_tracking_logs')
                    ->where('sent_at', '>=', now()->subHours(2)) // Only recent data
                    ->groupBy('driver_id', 'vehicle_id');
            })
            ->whereHas('driver', function($q) {
                $q->whereIn('status', ['Available', 'On Duty']);
            })
            ->orderBy('sent_at', 'desc')
            ->get();

        // Add additional data
        $currentLocations->transform(function ($gps) {
            $gps->time_ago = Carbon::parse($gps->sent_at)->diffForHumans();
            $gps->is_online = Carbon::parse($gps->sent_at)->greaterThan(now()->subMinutes(15));
            
            // Get active delivery via job_order_assignments
            // Driver bisa punya banyak assignments, ambil yang Active/On Duty
            $activeAssignment = DB::table('job_order_assignments')
                ->join('job_orders', 'job_order_assignments.job_order_id', '=', 'job_orders.job_order_id')
                ->where('job_order_assignments.driver_id', $gps->driver_id)
                ->where('job_order_assignments.status', 'Active')
                ->whereIn('job_orders.status', ['Processing', 'In Transit'])
                ->select('job_orders.job_order_id', 'job_orders.status')
                ->first();
            
            $gps->active_delivery = $activeAssignment ? [
                'job_order_id' => $activeAssignment->job_order_id,
                'status' => $activeAssignment->status
            ] : null;
            
            return $gps;
        });

        return response()->json([
            'success' => true,
            'data' => $currentLocations,
            'metadata' => [
                'total_drivers' => $currentLocations->count(),
                'online_drivers' => $currentLocations->where('is_online', true)->count(),
                'last_updated' => now()->toIso8601String()
            ]
        ], 200);
    }

    /**
     * Get GPS tracking history for a specific driver/vehicle or order
     * Untuk halaman detail order, menggambar jejak rute perjalanan
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getTrackingHistory(Request $request): JsonResponse
    {
        $request->validate([
            'driver_id' => 'nullable|exists:drivers,driver_id',
            'vehicle_id' => 'nullable|exists:vehicles,vehicle_id',
            'order_id' => 'nullable|string',
            'start_date' => 'required|date', // contoh: 2024-01-01
            'end_date' => 'required|date|after:start_date' // contoh: 2024-01-02
        ]);

        $query = Gps::with(['driver', 'vehicle']);

        // Filter by order_id (JO or DO)
        if ($request->filled('order_id')) {
            $query->where('order_id', $request->order_id);
        }

        // Filter by driver_id
        if ($request->filled('driver_id')) {
            $query->where('driver_id', $request->driver_id);
        }

        // Filter by vehicle_id
        if ($request->filled('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        $trackingData = $query->whereBetween('sent_at', [$request->start_date, $request->end_date])
            ->orderBy('sent_at', 'asc')
            ->get();

        // Calculate route statistics
        $stats = [
            'total_points' => $trackingData->count(),
            'duration_minutes' => $trackingData->count() > 1 
                ? Carbon::parse($trackingData->first()->sent_at)->diffInMinutes($trackingData->last()->sent_at)
                : 0,
            'distance_covered_km' => $this->calculateTotalDistance($trackingData),
            'first_point_time' => $trackingData->first()->sent_at ?? null,
            'last_point_time' => $trackingData->last()->sent_at ?? null
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'tracking_points' => $trackingData,
                'statistics' => $stats
            ]
        ], 200);
    }

    /**
     * Get live tracking for a specific delivery order
     * 
     * @param string $doId
     * @return JsonResponse
     */
    public function getLiveTracking(string $doId): JsonResponse
    {
        $deliveryOrder = DeliveryOrder::with(['customer', 'jobOrder'])
            ->where('do_id', $doId)
            ->first();

        if (!$deliveryOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Delivery order not found'
            ], 404);
        }

        // Get driver info dari job_order_assignments
        // DeliveryOrder bisa punya source_type: 'JO' atau 'MF'
        // Jika source_type = 'MF', ambil dari manifest_jobs (pivot table)
        
        $sourceId = $deliveryOrder->source_id;
        $jobOrderId = null;

        if ($deliveryOrder->source_type === 'MF') {
            // Get job_order_id from manifest_jobs pivot table
            // Ambil salah satu job order yang terkait dengan manifest ini
            $jobOrderId = DB::table('manifest_jobs')
                ->where('manifest_id', $sourceId)
                ->value('job_order_id');
        } else {
            $jobOrderId = $sourceId;
        }

        if (!$jobOrderId) {
            return response()->json([
                'success' => false,
                'message' => 'No job order found for this delivery order'
            ], 404);
        }

        $assignment = DB::table('job_order_assignments')
            ->join('drivers', 'job_order_assignments.driver_id', '=', 'drivers.driver_id')
            ->join('vehicles', 'job_order_assignments.vehicle_id', '=', 'vehicles.vehicle_id')
            ->where('job_order_assignments.job_order_id', $jobOrderId)
            ->where('job_order_assignments.status', 'Active')
            ->select(
                'job_order_assignments.driver_id',
                'drivers.driver_name',
                'drivers.phone as driver_phone',
                'job_order_assignments.vehicle_id',
                'vehicles.plate_no'
            )
            ->first();

        if (!$assignment) {
            return response()->json([
                'success' => false,
                'message' => 'No active driver assigned to this delivery order'
            ], 404);
        }

        // Get latest GPS location for the assigned driver
        $latestLocation = Gps::where('driver_id', $assignment->driver_id)
            ->orderBy('sent_at', 'desc')
            ->first();

        if (!$latestLocation) {
            return response()->json([
                'success' => false,
                'message' => 'No GPS data available for this driver'
            ], 404);
        }

        // Get tracking history (breadcrumb trail) untuk order ini
        // Ambil semua GPS points yang terkait dengan DO ini
        $trackingHistory = Gps::where('order_id', $doId)
            ->orWhere(function($q) use ($assignment) {
                // Jika order_id tidak terisi, ambil dari driver_id dalam 24 jam terakhir
                $q->where('driver_id', $assignment->driver_id)
                ->where('sent_at', '>=', now()->subHours(24));
            })
            ->orderBy('sent_at', 'asc')
            ->get()
            ->map(function ($point) {
                return [
                    'lat' => (float) $point->lat,
                    'lng' => (float) $point->lng,
                    'sent_at' => $point->sent_at
                ];
            });

        $trackingInfo = [
            'delivery_order' => [
                'do_id' => $deliveryOrder->do_id,
                'status' => $deliveryOrder->status,
                'pickup_location' => $deliveryOrder->pickup_location,
                'delivery_location' => $deliveryOrder->delivery_location,
                'customer_name' => $deliveryOrder->customer->customer_name ?? 'N/A'
            ],
            'driver' => [
                'driver_id' => $assignment->driver_id,
                'driver_name' => $assignment->driver_name,
                'phone' => $assignment->driver_phone
            ],
            'vehicle' => [
                'vehicle_id' => $assignment->vehicle_id,
                'plate_no' => $assignment->plate_no
            ],
            'current_location' => [
                'latitude' => (float) $latestLocation->lat,
                'longitude' => (float) $latestLocation->lng,
                'sent_at' => $latestLocation->sent_at,
                'received_at' => $latestLocation->received_at,
                'time_ago' => Carbon::parse($latestLocation->sent_at)->diffForHumans(),
                'is_recent' => Carbon::parse($latestLocation->sent_at)->greaterThan(now()->subMinutes(15))
            ],
            'tracking_history' => $trackingHistory
        ];

        return response()->json([
            'success' => true,
            'data' => $trackingInfo
        ], 200);
    }

    /**
     * ============================================
     * PRIVATE HELPER METHODS
     * ============================================
     */

    /**
     * Calculate total distance from GPS points using Haversine formula
     * 
     * @param $trackingData
     * @return float Distance in kilometers
     */
    private function calculateTotalDistance($trackingData): float
    {
        if ($trackingData->count() < 2) {
            return 0;
        }

        $totalDistance = 0;
        $previousPoint = null;

        foreach ($trackingData as $point) {
            if ($previousPoint) {
                $distance = $this->haversineDistance(
                    $previousPoint->lat,
                    $previousPoint->lng,
                    $point->lat,
                    $point->lng
                );
                $totalDistance += $distance;
            }
            $previousPoint = $point;
        }

        return round($totalDistance, 2);
    }

    /**
     * Calculate distance between two GPS points using Haversine formula
     * 
     * @param float $lat1
     * @param float $lon1
     * @param float $lat2
     * @param float $lon2
     * @return float Distance in kilometers
     */
    private function haversineDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371; // Earth's radius in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));

        return $earthRadius * $c;
    }
}