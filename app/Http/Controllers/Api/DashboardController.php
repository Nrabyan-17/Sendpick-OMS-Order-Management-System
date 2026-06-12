<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customers;
use App\Models\Drivers;
use App\Models\Vehicles;
use App\Models\JobOrder;
use App\Models\DeliveryOrder;
use App\Models\Manifests;
use App\Models\Invoices;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * DashboardController - Controller untuk mengelola data Dashboard/Ringkasan Web
 * 
 * Arsitektur:
 * - Single Entry Point: method index() sebagai koordinator utama
 * - Delegasi Tugas: memanggil method private untuk setiap bagian dashboard
 * - Response Tunggal: mengirim 1 JSON besar berisi semua data dashboard
 * 
 * Fungsi utama:
 * - KPI Cards: 4 cards statistik utama (orders, revenue, deliveries, fleet)
 * - Charts: Line chart (orders trend), Donut chart (delivery status, vehicle utilization)
 * - Widgets: Recent activities, today's assignments, transaksi terbaru
 * - Support filter berdasarkan timeframe (hari/minggu/bulan/tahun)
 */
class DashboardController extends Controller
{
    /**
     * ============================================
     * SINGLE ENTRY POINT - KOORDINATOR UTAMA
     * ============================================
     * 
     * Method ini adalah SATU-SATUNYA endpoint publik yang dipanggil frontend (React)
     * saat halaman Dashboard dimuat.
     * 
     * Tugasnya:
     * 1. Membaca filter dari request (time_frame)
     * 2. Mendelegasikan tugas ke method private untuk mengumpulkan data:
     *    - KPI Cards (4 cards statistik)
     *    - Charts (Line Chart + Donut Charts)
     *    - Widgets (Recent Activities, Today's Assignments)
     * 3. Mengemas semua hasil ke dalam 1 JSON terstruktur
     * 4. Mengirim response tunggal ke frontend
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        // STEP 1: Membaca Filter dari Request
        $timeFrame = $request->get('time_frame', 'month'); // day, week, month, year
        $startDate = $this->getStartDate($timeFrame);
        $endDate = now();

        // STEP 2: Mendelegasikan Tugas ke Method Private
        // 2.1 KPI Cards - Statistik utama untuk 4 cards di bagian atas
        $kpiCards = $this->calculateKpiSummary($startDate, $endDate);

        // 2.2 Charts - Data untuk visualisasi grafik
        $charts = [
            'orders_trend' => $this->getOrdersTrend($timeFrame),      // Line Chart
            'delivery_status' => $this->getDeliveryStatus(),          // Donut Chart
            'vehicle_utilization' => $this->getVehicleUtilization()   // Donut Chart
        ];

        // 2.3 Widgets - Data untuk widget aktivitas dan assignments
        $widgets = [
            'recent_activities' => $this->getRecentActivities(),      // 15 aktivitas terbaru
            'active_assignments' => $this->getActiveAssignments()     // Active assignments (belum selesai)
        ];

        // STEP 3: Mengemas Semua Data ke dalam Struktur JSON Terorganisir
        $dashboardData = [
            'kpi_cards' => $kpiCards,
            'charts' => $charts,
            'widgets' => $widgets
        ];

        // STEP 4: Mengirim Response Tunggal ke Frontend
        return response()->json([
            'success' => true,
            'data' => $dashboardData
        ], 200);
    }

    /**
     * ============================================
     * METHOD PRIVATE - CALCULATE KPI SUMMARY
     * ============================================
     * 
     * Mengumpulkan data untuk 4 KPI Cards di bagian atas dashboard:
     * 1. Total Orders (dengan growth percentage)
     * 2. OTIF Rate (On Time In Full delivery rate)
     * 3. Active Deliveries (real-time count)
     * 4. Fleet Status (vehicles & drivers availability)
     * 
     * Dipanggil secara internal oleh method index().
     * 
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return array
     */
    private function calculateKpiSummary(Carbon $startDate, Carbon $endDate): array
    {
        // KPI 1: Total Orders (dengan growth vs periode sebelumnya)
        $totalOrders = JobOrder::whereBetween('created_at', [$startDate, $endDate])->count();
        $previousPeriodStart = $startDate->copy()->subtract($endDate->diffInDays($startDate), 'days');
        $previousOrders = JobOrder::whereBetween('created_at', [$previousPeriodStart, $startDate])->count();
        $ordersGrowth = $previousOrders > 0 ? (($totalOrders - $previousOrders) / $previousOrders) * 100 : 0;

        // KPI 2: OTIF Rate (On Time In Full delivery rate)
        $otifRate = $this->calculateDeliveryRate($startDate);

        // KPI 3: Active Deliveries (real-time)
        $activeDeliveries = DeliveryOrder::whereIn('status', ['Assigned', 'In Transit', 'At Destination'])->count();

        // KPI 4: Fleet Status (vehicles & drivers availability)
        $fleetStatus = [
            'available_vehicles' => Vehicles::where('status', 'Available')->count(),
            'total_vehicles' => Vehicles::count(),
            'available_drivers' => Drivers::where('status', 'Available')->count(),
            'total_drivers' => Drivers::count()
        ];

        return [
            'total_orders' => [
                'value' => $totalOrders,
                'growth' => round($ordersGrowth, 2)
            ],
            'otif_rate' => $otifRate,
            'active_deliveries' => $activeDeliveries,
            'fleet_status' => $fleetStatus
        ];
    }

    /**
     * ============================================
     * METHOD PRIVATE - ORDERS TREND (LINE CHART)
     * ============================================
     * 
     * Mengumpulkan data tren orders untuk Line Chart.
     * Data akan di-group berdasarkan time_frame:
     * - day: per jam (24 data points)
     * - week: per hari (7 data points)
     * - month: per hari (30 data points)
     * - year: per bulan (12 data points)
     * 
     * @param string $timeFrame
     * @return array
     */
    private function getOrdersTrend(string $timeFrame): array
    {
        $dateFormat = $this->getDateFormat($timeFrame);
        $days = $this->getDaysCount($timeFrame);

        $data = JobOrder::select(
                DB::raw("DATE_TRUNC('{$dateFormat}', created_at) as period"),
                DB::raw('COUNT(*) as orders')
            )
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(function ($item) use ($timeFrame) {
                return [
                    'period' => Carbon::parse($item->period)->format($this->getDisplayFormat($timeFrame)),
                    'orders' => $item->orders
                ];
            });

        return $data->toArray();
    }

    /**
     * ============================================
     * METHOD PRIVATE - DELIVERY STATUS (DONUT CHART)
     * ============================================
     * 
     * Mengumpulkan distribusi status pengiriman untuk Donut Chart.
     * Menampilkan jumlah Delivery Order per status.
     * 
     * @return array
     */
    private function getDeliveryStatus(): array
    {
        return DeliveryOrder::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(function ($item) {
                return [
                    'status' => $item->status,
                    'count' => $item->count
                ];
            })
            ->toArray();
    }

    /**
     * ============================================
     * METHOD PRIVATE - VEHICLE UTILIZATION (DONUT CHART)
     * ============================================
     * 
     * Mengumpulkan data utilisasi kendaraan untuk Donut Chart.
     * Menampilkan persentase kendaraan per status (Available/Maintenance/dll).
     * 
     * @return array
     */
    private function getVehicleUtilization(): array
    {
        $totalVehicles = Vehicles::count();
        $utilization = Vehicles::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(function ($item) use ($totalVehicles) {
                return [
                    'status' => $item->status,
                    'count' => $item->count,
                    'percentage' => $totalVehicles > 0 ? round(($item->count / $totalVehicles) * 100, 2) : 0
                ];
            })
            ->toArray();

        return $utilization;
    }

    /**
     * ============================================
     * METHOD PRIVATE - RECENT ACTIVITIES (WIDGET)
     * ============================================
     * 
     * Mengumpulkan 15 aktivitas terbaru dari berbagai sumber:
     * - Job Orders terbaru (10 data)
     * - Delivery Orders terbaru (10 data)
     * - Invoices terbaru (10 data)
     * 
     * Total 30 data akan di-sort by timestamp, lalu ambil 15 teratas.
     * Frontend akan melakukan pagination client-side.
     * 
     * @return array
     */
    private function getRecentActivities(): array
    {
        // Recent Job Orders
        $recentOrders = JobOrder::with('customer')
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($order) {
                return [
                    'type' => 'order',
                    'title' => "New order from {$order->customer->customer_name}",
                    'description' => "Order #{$order->job_order_id} - {$order->goods_desc}",
                    'timestamp' => $order->created_at,
                    'status' => $order->status
                ];
            });

        // Recent Deliveries
        $recentDeliveries = DeliveryOrder::with(['customer'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($delivery) {
                // Load assignments only if source_type = 'JO'
                if ($delivery->source_type === 'JO' && $delivery->jobOrder) {
                    $delivery->jobOrder->load(['assignments' => function($query) {
                        $query->where('status', 'Active')->with('driver');
                    }]);
                }
                
                $driverName = 'N/A';
                if ($delivery->source_type === 'JO' && $delivery->jobOrder) {
                    $activeAssignment = $delivery->jobOrder->assignments->firstWhere('status', 'Active');
                    $driverName = $activeAssignment?->driver?->name ?? 'Unassigned';
                }
                
                return [
                    'type' => 'delivery',
                    'title' => "Delivery update",
                    'description' => "DO #{$delivery->do_id} - {$delivery->status}" . ($delivery->source_type === 'JO' ? " - Driver: {$driverName}" : ''),
                    'timestamp' => $delivery->updated_at,
                    'status' => $delivery->status
                ];
            });

        // Recent Invoices
        $recentInvoices = Invoices::with('customer')
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($invoice) {
                return [
                    'type' => 'invoice',
                    'title' => "Invoice {$invoice->status}",
                    'description' => "Invoice #{$invoice->invoice_id} - Rp " . number_format($invoice->total_amount, 0, ',', '.'),
                    'timestamp' => $invoice->updated_at,
                    'status' => $invoice->status
                ];
            });

        // Gabungkan semua aktivitas, sort by timestamp, ambil 15 teratas (5 items x 3 pages)
        $activities = $recentOrders->concat($recentDeliveries)
            ->concat($recentInvoices)
            ->sortByDesc('timestamp')
            ->take(15)
            ->values();

        return $activities->toArray();
    }

    /**
     * =============================================
     * METHOD PRIVATE - ACTIVE ASSIGNMENTS (WIDGET)
     * =============================================
     * 
     * Mengumpulkan data active assignments untuk widget "Active Assignments".
     * Mengambil dari Job Orders dengan status aktif yang belum selesai.
     * Filter: Status Assigned, Pickup, On Delivery (tanpa filter tanggal).
     * Tujuan: Memastikan tidak ada tugas yang "tergantung" atau macet.
     * 
     * @return array
     */
    private function getActiveAssignments(): array
    {
        // Query Job Orders yang memiliki Assignment aktif (tanpa filter tanggal)
        return JobOrder::with(['customer', 'assignments' => function($query) {
                $query->where('status', 'Active')->with(['driver', 'vehicle']);
            }])
            ->whereIn('status', ['Assigned', 'Pickup', 'On Delivery'])
            ->whereHas('assignments', function($query) {
                $query->where('status', 'Active');
            })
            ->latest('updated_at')
            ->limit(15)
            ->get()
            ->map(function ($jobOrder) {
                $activeAssignment = $jobOrder->assignments->firstWhere('status', 'Active');
                $driverName = $activeAssignment?->driver?->driver_name ?? 'Unassigned';
                $vehiclePlate = $activeAssignment?->vehicle?->plate_no ?? 'N/A';
                
                // Determine customer display based on order_type
                $orderType = $jobOrder->order_type ?? 'FTL';
                $customerDisplay = $jobOrder->customer->customer_name ?? 'N/A';
                
                // For LTL, check if this JO is part of a manifest with multiple JOs
                if ($orderType === 'LTL') {
                    // Check if manifest exists with multiple JOs
                    $manifest = $jobOrder->manifests()->first();
                    if ($manifest) {
                        $joCount = $manifest->jobOrders()->count();
                        if ($joCount > 1) {
                            $customerDisplay = "Konsolidasi LTL ({$joCount} JOs)";
                        }
                    }
                }
                
                return [
                    'job_order_id' => $jobOrder->job_order_id,
                    'order_type' => $orderType,
                    'customer_name' => $customerDisplay,
                    'driver_name' => $driverName,
                    'vehicle_plate' => $vehiclePlate,
                    'goods_summary' => $jobOrder->goods_desc ?? 'N/A',
                    'pickup_city' => $jobOrder->pickup_city ?? 'N/A',
                    'delivery_city' => $jobOrder->delivery_city ?? 'N/A',
                    'status' => $jobOrder->status,
                    'assigned_at' => $activeAssignment?->assigned_at,
                    'created_at' => $jobOrder->created_at
                ];
            })
            ->toArray();
    }

    /**
     * Get top customers by revenue
     * 
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return array
     */
    // private function getTopCustomers(Carbon $startDate, Carbon $endDate): array
    // {
    //     return Customers::select('customers.*')
    //         ->selectRaw('COUNT(job_orders.job_order_id) as total_orders')
    //         ->selectRaw('SUM(job_orders.order_value) as total_revenue')
    //         ->leftJoin('job_orders', 'customers.customer_id', '=', 'job_orders.customer_id')
    //         ->whereBetween('job_orders.created_at', [$startDate, $endDate])
    //         ->groupBy('customers.customer_id')
    //         ->orderByDesc('total_revenue')
    //         ->limit(10)
    //         ->get()
    //         ->map(function ($customer) {
    //             return [
    //                 'customer_id' => $customer->customer_id,
    //                 'customer_name' => $customer->customer_name,
    //                 'total_orders' => $customer->total_orders ?? 0,
    //                 'total_revenue' => $customer->total_revenue ?? 0
    //             ];
    //         })
    //         ->toArray();
    // }

    /**
     * Get driver performance data
     * 
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return array
     */
    // private function getDriverPerformance(Carbon $startDate, Carbon $endDate): array
    // {
    //     return Drivers::select('drivers.*')
    //         ->selectRaw('COUNT(delivery_orders.do_id) as total_deliveries')
    //         ->selectRaw('AVG(CASE WHEN delivery_orders.status = \'Delivered\' THEN 1 ELSE 0 END) * 100 as success_rate')
    //         ->leftJoin('delivery_orders', 'drivers.driver_id', '=', 'delivery_orders.driver_id')
    //         ->whereBetween('delivery_orders.created_at', [$startDate, $endDate])
    //         ->groupBy('drivers.driver_id')
    //         ->orderByDesc('total_deliveries')
    //         ->limit(10)
    //         ->get()
    //         ->map(function ($driver) {
    //             return [
    //                 'driver_id' => $driver->driver_id,
    //                 'driver_name' => $driver->driver_name,
    //                 'phone' => $driver->phone,
    //                 'total_deliveries' => $driver->total_deliveries ?? 0,
    //                 'success_rate' => round($driver->success_rate ?? 0, 2)
    //             ];
    //         })
    //         ->toArray();
    // }

    /**
     * ============================================
     * METHOD PRIVATE - HELPER FUNCTIONS
     * ============================================
     */

    /**
     * Get start date based on time frame
     * 
     * @param string $timeFrame
     * @return Carbon
     */
    private function getStartDate(string $timeFrame): Carbon
    {
        return match($timeFrame) {
            'day' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth()
        };
    }

    /**
     * Get date format for SQL grouping
     * 
     * @param string $timeFrame
     * @return string
     */
    private function getDateFormat(string $timeFrame): string
    {
        return match($timeFrame) {
            'day' => 'hour',
            'week' => 'day',
            'month' => 'day',
            'year' => 'month',
            default => 'day'
        };
    }

    /**
     * Get display format for dates
     * 
     * @param string $timeFrame
     * @return string
     */
    private function getDisplayFormat(string $timeFrame): string
    {
        return match($timeFrame) {
            'day' => 'H:00',
            'week' => 'M-d',
            'month' => 'M-d',
            'year' => 'M Y',
            default => 'M-d'
        };
    }

    /**
     * Get days count for time frame
     * 
     * @param string $timeFrame
     * @return int
     */
    private function getDaysCount(string $timeFrame): int
    {
        return match($timeFrame) {
            'day' => 1,
            'week' => 7,
            'month' => 30,
            'year' => 365,
            default => 30
        };
    }

    /**
     * Calculate delivery rate
     * 
     * @param Carbon $startDate
     * @return float
     */
    private function calculateDeliveryRate(Carbon $startDate): float
    {
        $totalDeliveries = DeliveryOrder::where('created_at', '>=', $startDate)->count();
        $completedDeliveries = DeliveryOrder::where('created_at', '>=', $startDate)
            ->where('status', 'Delivered')->count();

        return $totalDeliveries > 0 ? round(($completedDeliveries / $totalDeliveries) * 100, 2) : 0;
    }
}