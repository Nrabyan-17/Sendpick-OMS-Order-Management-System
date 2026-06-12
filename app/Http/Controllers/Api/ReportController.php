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
use App\Models\Assignment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * ReportController - Controller untuk mengelola Laporan dan Analytics
 * 
 * Fungsi utama:
 * - Generate laporan penjualan berdasarkan periode
 * - Laporan performa driver dan utilisasi kendaraan
 * - Analytics revenue dan profitability
 * - Laporan customer dan tren pengiriman
 * - Export laporan ke Excel/PDF format
 * - Dashboard analytics dan KPI monitoring
 * - Laporan operasional harian/bulanan
 */
class ReportController extends Controller
{
    /**
     * Get sales performance report
     * 
     * Revenue calculation is based on INVOICES table (not job_orders.order_value)
     * - Total Revenue = sum of paid_amount from invoices with status 'Paid'
     * - This ensures consistency with the Invoices module display
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function sales(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'group_by' => 'in:day,week,month,year'
        ]);

        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();
        $groupBy = $request->get('group_by', 'month');

        // Get invoices for revenue calculation (excludes cancelled)
        $invoices = Invoices::whereNotIn('status', ['Cancelled'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        // Sales trend based on invoices - only count PAID invoices for revenue
        $salesTrend = $invoices->groupBy(function ($item) use ($groupBy) {
            $date = Carbon::parse($item->created_at);
            return match($groupBy) {
                'day' => $date->format('Y-m-d'),
                'week' => $date->format('Y-W'),
                'month' => $date->format('Y-m'),
                'year' => $date->format('Y'),
                default => $date->format('Y-m')
            };
        })->map(function ($group, $period) {
            // Only sum paid_amount from Paid invoices
            $paidInvoices = $group->where('status', 'Paid');
            return [
                'period' => $period,
                'total_orders' => $group->count(),
                'total_revenue' => $paidInvoices->sum('paid_amount'),
                'avg_order_value' => $paidInvoices->count() > 0 
                    ? round($paidInvoices->avg('paid_amount') ?? 0, 2) 
                    : 0
            ];
        })->sortKeys()->values();

        // Customer distribution based on INVOICES (not job_orders)
        $customerDistribution = Customers::select('customers.customer_name')
            ->selectRaw('COUNT(invoices.invoice_id) as order_count')
            ->selectRaw('SUM(CASE WHEN invoices.status = ? THEN invoices.paid_amount ELSE 0 END) as total_revenue', ['Paid'])
            ->leftJoin('invoices', 'customers.customer_id', '=', 'invoices.customer_id')
            ->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('invoices.created_at', [$startDate, $endDate])
                  ->whereNotIn('invoices.status', ['Cancelled']);
            })
            ->groupBy('customers.customer_id', 'customers.customer_name')
            ->havingRaw('COUNT(invoices.invoice_id) > 0')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get();

        // Invoice status distribution (instead of job order status)
        $statusDistribution = Invoices::select('status', DB::raw('COUNT(*) as count'))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotIn('status', ['Cancelled'])
            ->groupBy('status')
            ->get();

        // Summary statistics
        // OPERATIONAL metrics from JOB_ORDERS (Total Orders, Completion Rate)
        // FINANCIAL metrics from INVOICES (Revenue, Customers, Avg Order Value)
        
        $activeJobOrders = JobOrder::whereNotIn('status', ['Cancelled'])
            ->whereBetween('created_at', [$startDate, $endDate]);
        
        $completedJobOrders = JobOrder::where('status', 'Completed')
            ->whereBetween('created_at', [$startDate, $endDate]);
        
        $paidInvoices = Invoices::where('status', 'Paid')
            ->whereBetween('created_at', [$startDate, $endDate]);
        
        // Active invoiced customers (customers with invoices, excluding Cancelled)
        $activeInvoicedCustomers = Invoices::whereNotIn('status', ['Cancelled'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->distinct('customer_id')
            ->count('customer_id');

        // Calculate Job Order completion rate
        $totalJoCount = (clone $activeJobOrders)->count();
        $completedJoCount = (clone $completedJobOrders)->count();
        $joCompletionRate = $totalJoCount > 0 ? round(($completedJoCount / $totalJoCount) * 100, 2) : 0;

        $summary = [
            // Operational metrics from Job Orders
            'total_orders' => $totalJoCount,
            'completion_rate' => $joCompletionRate,
            // Financial metrics from Invoices
            'total_customers' => $activeInvoicedCustomers, // Customers with active invoices
            'total_revenue' => (clone $paidInvoices)->sum('paid_amount'),
            'avg_order_value' => (clone $paidInvoices)->avg('paid_amount') ?? 0,
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'sales_trend' => $salesTrend,
                'customer_distribution' => $customerDistribution,
                'status_distribution' => $statusDistribution
            ]
        ], 200);
    }

    /**
     * Get financial report
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function financial(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'group_by' => 'in:day,week,month,year'
        ]);

        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();
        $groupBy = $request->get('group_by', 'month');

        // Revenue trend - database agnostic approach using PHP grouping
        $invoices = Invoices::whereBetween('created_at', [$startDate, $endDate])->get();

        $revenueTrend = $invoices->groupBy(function ($item) use ($groupBy) {
            $date = Carbon::parse($item->created_at);
            return match($groupBy) {
                'day' => $date->format('Y-m-d'),
                'week' => $date->format('Y-W'),
                'month' => $date->format('Y-m'),
                'year' => $date->format('Y'),
                default => $date->format('Y-m')
            };
        })->map(function ($group, $period) {
            return [
                'period' => $period,
                'paid_amount' => $group->where('status', 'Paid')->sum('total_amount'),
                'pending_amount' => $group->where('status', 'Pending')->sum('total_amount'),
                'overdue_amount' => $group->where('status', 'Overdue')->sum('total_amount'),
                'total_invoiced' => $group->sum('total_amount')
            ];
        })->sortKeys()->values();

        // Payment status summary
        $paymentSummary = Invoices::select('status')
            ->selectRaw('COUNT(*) as invoice_count')
            ->selectRaw('SUM(total_amount) as total_amount')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('status')
            ->get();

        // Outstanding receivables aging - PHP-based calculation
        $outstandingInvoices = Invoices::whereIn('status', ['Pending', 'Overdue'])->get();
        $today = Carbon::today();
        
        $agingCategories = [
            'Current' => 0,
            '1-30 days' => 0,
            '31-60 days' => 0,
            '61-90 days' => 0,
            'Over 90 days' => 0
        ];
        $agingCounts = [
            'Current' => 0,
            '1-30 days' => 0,
            '31-60 days' => 0,
            '61-90 days' => 0,
            'Over 90 days' => 0
        ];
        
        foreach ($outstandingInvoices as $inv) {
            $dueDate = Carbon::parse($inv->due_date);
            $daysOverdue = $today->diffInDays($dueDate, false);
            
            if ($daysOverdue >= 0) {
                $category = 'Current';
            } elseif ($daysOverdue >= -30) {
                $category = '1-30 days';
            } elseif ($daysOverdue >= -60) {
                $category = '31-60 days';
            } elseif ($daysOverdue >= -90) {
                $category = '61-90 days';
            } else {
                $category = 'Over 90 days';
            }
            
            $agingCategories[$category] += $inv->total_amount;
            $agingCounts[$category]++;
        }

        $receivablesAging = collect($agingCategories)->map(function ($amount, $category) use ($agingCounts) {
            return [
                'aging_category' => $category,
                'invoice_count' => $agingCounts[$category],
                'total_amount' => $amount
            ];
        })->values();

        // Top paying customers
        $topPayingCustomers = Customers::select('customers.customer_name')
            ->selectRaw('SUM(invoices.total_amount) as total_paid')
            ->selectRaw('COUNT(invoices.invoice_id) as invoice_count')
            ->join('invoices', 'customers.customer_id', '=', 'invoices.customer_id')
            ->where('invoices.status', 'Paid')
            ->whereBetween('invoices.created_at', [$startDate, $endDate])
            ->groupBy('customers.customer_id', 'customers.customer_name')
            ->orderByDesc('total_paid')
            ->limit(10)
            ->get();

        $summary = [
            'total_invoiced' => Invoices::whereBetween('created_at', [$startDate, $endDate])->sum('total_amount'),
            'total_paid' => Invoices::where('status', 'Paid')->whereBetween('created_at', [$startDate, $endDate])->sum('total_amount'),
            'total_pending' => Invoices::whereIn('status', ['Pending', 'Overdue'])->sum('total_amount'),
            'collection_rate' => $this->calculateCollectionRate($startDate, $endDate),
            'avg_invoice_value' => Invoices::whereBetween('created_at', [$startDate, $endDate])->avg('total_amount')
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'revenue_trend' => $revenueTrend,
                'payment_summary' => $paymentSummary,
                'receivables_aging' => $receivablesAging,
                'top_paying_customers' => $topPayingCustomers
            ]
        ], 200);
    }

    /**
     * Get operational report
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function operational(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();

        // Delivery performance - database agnostic
        $deliveryOrders = DeliveryOrder::whereBetween('created_at', [$startDate, $endDate])->get();
        
        $deliveryStats = [
            'total_deliveries' => $deliveryOrders->count(),
            'completed_deliveries' => $deliveryOrders->where('status', 'Delivered')->count(),
            'failed_deliveries' => $deliveryOrders->where('status', 'Failed')->count(),
            'in_progress_deliveries' => $deliveryOrders->whereIn('status', ['Assigned', 'In Transit', 'At Destination', 'Pending'])->count()
        ];

        // Driver performance via Manifests (since drivers are assigned to manifests)
        $manifests = Manifests::with('drivers')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('driver_id')
            ->get();

        $driverPerformance = $manifests->groupBy('driver_id')->map(function ($driverManifests, $driverId) {
            $driver = $driverManifests->first()->drivers;
            $completed = $driverManifests->where('status', 'Completed')->count();
            $total = $driverManifests->count();
            
            return [
                'driver_name' => $driver?->driver_name ?? 'Unknown',
                'phone' => $driver?->phone ?? '-',
                'total_deliveries' => $total,
                'successful_deliveries' => $completed,
                'success_rate' => $total > 0 ? round(($completed / $total) * 100, 2) : 0
            ];
        })->sortByDesc('total_deliveries')->take(10)->values();

        // Vehicle utilization via Manifests (since vehicles are assigned to manifests)
        $manifestsWithVehicles = Manifests::with(['vehicles.vehicleType'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('vehicle_id')
            ->get();

        $vehicleUtilization = $manifestsWithVehicles->groupBy('vehicle_id')->map(function ($vehicleManifests, $vehicleId) {
            $vehicle = $vehicleManifests->first()->vehicles;
            
            return [
                'plate_number' => $vehicle?->plate_no ?? 'Unknown',
                'type_name' => $vehicle?->vehicleType?->type_name ?? '-',
                'trips_count' => $vehicleManifests->count(),
                'drivers_used' => $vehicleManifests->pluck('driver_id')->unique()->count()
            ];
        })->sortByDesc('trips_count')->take(10)->values();

        // Manifest efficiency - database agnostic
        $allManifests = Manifests::whereBetween('created_at', [$startDate, $endDate])->get();
        
        $manifestStats = [
            'total_manifests' => $allManifests->count(),
            'completed_manifests' => $allManifests->where('status', 'Completed')->count(),
            'avg_cargo_weight' => $allManifests->avg('cargo_weight') ?? 0,
            'total_cargo_handled' => $allManifests->sum('cargo_weight') ?? 0
        ];

        // Route analysis
        $routeAnalysis = $allManifests->groupBy(function ($manifest) {
            return $manifest->origin_city . ' -> ' . $manifest->dest_city;
        })->map(function ($routeManifests, $route) {
            $parts = explode(' -> ', $route);
            return [
                'origin_city' => $parts[0] ?? '',
                'dest_city' => $parts[1] ?? '',
                'route_frequency' => $routeManifests->count(),
                'avg_cargo_weight' => round($routeManifests->avg('cargo_weight') ?? 0, 2)
            ];
        })->sortByDesc('route_frequency')->take(10)->values();

        $summary = [
            'delivery_success_rate' => $deliveryStats['total_deliveries'] > 0 
                ? round(($deliveryStats['completed_deliveries'] / $deliveryStats['total_deliveries']) * 100, 2) 
                : 0,
            'active_drivers' => Drivers::whereIn('status', ['Available', 'On Duty'])->count(),
            'active_vehicles' => Vehicles::where('status', 'Available')->count(),
            'avg_deliveries_per_driver' => $driverPerformance->count() > 0 ? $driverPerformance->avg('total_deliveries') : 0,
            'manifest_completion_rate' => $manifestStats['total_manifests'] > 0 
                ? round(($manifestStats['completed_manifests'] / $manifestStats['total_manifests']) * 100, 2) 
                : 0
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'delivery_stats' => $deliveryStats,
                'driver_performance' => $driverPerformance,
                'vehicle_utilization' => $vehicleUtilization,
                'manifest_stats' => $manifestStats,
                'route_analysis' => $routeAnalysis
            ]
        ], 200);
    }

    /**
     * Get customer analytics report
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function customerAnalytics(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'customer_id' => 'nullable|exists:customers,customer_id'
        ]);

        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();

        if ($request->filled('customer_id')) {
            return $this->getSingleCustomerAnalytics($request->customer_id, $startDate, $endDate);
        }

        // Overall customer analytics
        $customerStats = Customers::select('customers.*')
            ->selectRaw('COUNT(job_orders.job_order_id) as total_orders')
            ->selectRaw('SUM(job_orders.order_value) as total_revenue')
            ->selectRaw('AVG(job_orders.order_value) as avg_order_value')
            ->selectRaw('MAX(job_orders.created_at) as last_order_date')
            ->leftJoin('job_orders', 'customers.customer_id', '=', 'job_orders.customer_id')
            ->whereBetween('job_orders.created_at', [$startDate, $endDate])
            ->groupBy('customers.customer_id')
            ->having('total_orders', '>', 0)
            ->orderByDesc('total_revenue')
            ->get();

        // Customer segmentation
        $customerSegmentation = $customerStats->groupBy(function ($customer) {
            if ($customer->total_revenue > 50000000) return 'Premium';
            if ($customer->total_revenue > 20000000) return 'Gold';
            if ($customer->total_revenue > 5000000) return 'Silver';
            return 'Bronze';
        })->map(function ($group, $segment) {
            return [
                'segment' => $segment,
                'customer_count' => $group->count(),
                'total_revenue' => $group->sum('total_revenue'),
                'avg_revenue_per_customer' => $group->avg('total_revenue')
            ];
        })->values();

        // Customer lifetime value - database agnostic approach
        $customersWithOrders = Customers::with(['jobOrders' => function($q) {
            $q->select('customer_id', 'job_order_id', 'order_value', 'created_at');
        }])->whereHas('jobOrders')->get();

        $customerLTV = $customersWithOrders->map(function ($customer) {
            $orders = $customer->jobOrders;
            if ($orders->isEmpty()) return null;
            
            $firstOrder = $orders->min('created_at');
            $lastOrder = $orders->max('created_at');
            $lifetimeMonths = Carbon::parse($firstOrder)->diffInMonths(Carbon::parse($lastOrder)) + 1;
            
            return [
                'customer_name' => $customer->customer_name,
                'lifetime_orders' => $orders->count(),
                'lifetime_value' => $orders->sum('order_value'),
                'customer_lifetime_months' => $lifetimeMonths
            ];
        })->filter()->sortByDesc('lifetime_value')->take(20)->values();

        // New vs returning customers
        $newVsReturning = [
            'new_customers' => Customers::whereHas('jobOrders', function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate]);
            })->whereDoesntHave('jobOrders', function($q) use ($startDate) {
                $q->where('created_at', '<', $startDate);
            })->count(),
            
            'returning_customers' => Customers::whereHas('jobOrders', function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate]);
            })->whereHas('jobOrders', function($q) use ($startDate) {
                $q->where('created_at', '<', $startDate);
            })->count()
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'customer_stats' => $customerStats,
                'customer_segmentation' => $customerSegmentation,
                'customer_ltv' => $customerLTV,
                'new_vs_returning' => $newVsReturning
            ]
        ], 200);
    }

    /**
     * ============================================
     * EXPORT METHODS - Spesifik untuk setiap laporan
     * ============================================
     */

    /**
     * Export sales report to CSV/Excel
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function exportSales(Request $request): JsonResponse
    {
        $request->validate([
            'format' => 'required|in:csv,excel',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date'
        ]);

        $exportData = $this->generateSalesExportData($request);
        $filename = 'sales_report_' . now()->format('Y-m-d_H-i-s') . '.' . $request->format;

        // In real implementation, generate actual file and return download link
        return response()->json([
            'success' => true,
            'message' => 'Sales report export prepared successfully',
            'data' => [
                'filename' => $filename,
                'records_count' => count($exportData),
                'download_url' => url("/api/reports/download/{$filename}"),
                'expires_at' => now()->addHours(24)->toIso8601String()
            ]
        ], 200);
    }

    /**
     * Export financial report to CSV/Excel
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function exportFinancial(Request $request): JsonResponse
    {
        $request->validate([
            'format' => 'required|in:csv,excel',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date'
        ]);

        $exportData = $this->generateFinancialExportData($request);
        $filename = 'financial_report_' . now()->format('Y-m-d_H-i-s') . '.' . $request->format;

        return response()->json([
            'success' => true,
            'message' => 'Financial report export prepared successfully',
            'data' => [
                'filename' => $filename,
                'records_count' => count($exportData),
                'download_url' => url("/api/reports/download/{$filename}"),
                'expires_at' => now()->addHours(24)->toIso8601String()
            ]
        ], 200);
    }

    /**
     * Export operational report to CSV/Excel
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function exportOperational(Request $request): JsonResponse
    {
        $request->validate([
            'format' => 'required|in:csv,excel',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date'
        ]);

        $exportData = $this->generateOperationalExportData($request);
        $filename = 'operational_report_' . now()->format('Y-m-d_H-i-s') . '.' . $request->format;

        return response()->json([
            'success' => true,
            'message' => 'Operational report export prepared successfully',
            'data' => [
                'filename' => $filename,
                'records_count' => count($exportData),
                'download_url' => url("/api/reports/download/{$filename}"),
                'expires_at' => now()->addHours(24)->toIso8601String()
            ]
        ], 200);
    }

    /**
     * Export customer analytics report to CSV/Excel
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function exportCustomerAnalytics(Request $request): JsonResponse
    {
        $request->validate([
            'format' => 'required|in:csv,excel',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'customer_id' => 'nullable|exists:customers,customer_id'
        ]);

        $exportData = $this->generateCustomerExportData($request);
        $filename = 'customer_analytics_' . now()->format('Y-m-d_H-i-s') . '.' . $request->format;

        return response()->json([
            'success' => true,
            'message' => 'Customer analytics export prepared successfully',
            'data' => [
                'filename' => $filename,
                'records_count' => count($exportData),
                'download_url' => url("/api/reports/download/{$filename}"),
                'expires_at' => now()->addHours(24)->toIso8601String()
            ]
        ], 200);
    }

    /**
     * ============================================
     * HELPER METHODS - Private methods untuk internal use
     * ============================================
     */

    /**
     * Helper method to get single customer analytics
     */
    private function getSingleCustomerAnalytics($customerId, $startDate, $endDate)
    {
        $customer = Customers::where('customer_id', $customerId)->first();
        
        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found'
            ], 404);
        }

        $analytics = [
            'customer_info' => $customer,
            'period_stats' => [
                'orders_count' => JobOrder::where('customer_id', $customerId)
                    ->whereBetween('created_at', [$startDate, $endDate])->count(),
                'total_revenue' => JobOrder::where('customer_id', $customerId)
                    ->whereBetween('created_at', [$startDate, $endDate])->sum('order_value'),
                'deliveries_count' => DeliveryOrder::where('customer_id', $customerId)
                    ->whereBetween('created_at', [$startDate, $endDate])->count()
            ],
            'order_history' => JobOrder::where('customer_id', $customerId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->orderBy('created_at', 'desc')
                ->get(),
            'payment_history' => Invoices::where('customer_id', $customerId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->orderBy('created_at', 'desc')
                ->get()
        ];

        return response()->json([
            'success' => true,
            'data' => $analytics
        ], 200);
    }

    /**
     * Helper methods for calculations
     */
    private function calculateCompletionRate($startDate, $endDate): float
    {
        $totalOrders = JobOrder::whereBetween('created_at', [$startDate, $endDate])->count();
        $completedOrders = JobOrder::where('status', 'Completed')
            ->whereBetween('created_at', [$startDate, $endDate])->count();

        return $totalOrders > 0 ? round(($completedOrders / $totalOrders) * 100, 2) : 0;
    }

    /**
     * Calculate invoice-based completion rate
     * Completion = Paid invoices / Total invoices (excluding cancelled)
     */
    private function calculateInvoiceCompletionRate($startDate, $endDate): float
    {
        $totalInvoices = Invoices::whereNotIn('status', ['Cancelled'])
            ->whereBetween('created_at', [$startDate, $endDate])->count();
        $paidInvoices = Invoices::where('status', 'Paid')
            ->whereBetween('created_at', [$startDate, $endDate])->count();

        return $totalInvoices > 0 ? round(($paidInvoices / $totalInvoices) * 100, 2) : 0;
    }

    private function calculateCollectionRate($startDate, $endDate): float
    {
        $totalInvoiced = Invoices::whereBetween('created_at', [$startDate, $endDate])->sum('total_amount');
        $totalPaid = Invoices::where('status', 'Paid')
            ->whereBetween('created_at', [$startDate, $endDate])->sum('total_amount');

        return $totalInvoiced > 0 ? round(($totalPaid / $totalInvoiced) * 100, 2) : 0;
    }

    private function getDateFormat($groupBy): string
    {
        return match($groupBy) {
            'day' => 'Y-m-d',
            'week' => 'Y-\WW',
            'month' => 'Y-m',
            'year' => 'Y',
            default => 'Y-m'
        };
    }

    /**
     * Generate export data methods (simplified for demo)
     */
    private function generateSalesExportData($request): array
    {
        return JobOrder::with('customer')
            ->whereBetween('created_at', [$request->start_date, $request->end_date])
            ->get()
            ->toArray();
    }

    private function generateFinancialExportData($request): array
    {
        return Invoices::with('customer')
            ->whereBetween('created_at', [$request->start_date, $request->end_date])
            ->get()
            ->toArray();
    }

    private function generateOperationalExportData($request): array
    {
        return DeliveryOrder::with(['customer', 'driver', 'vehicle'])
            ->whereBetween('created_at', [$request->start_date, $request->end_date])
            ->get()
            ->toArray();
    }

    private function generateCustomerExportData($request): array
    {
        return Customers::with('jobOrders')
            ->whereHas('jobOrders', function($q) use ($request) {
                $q->whereBetween('created_at', [$request->start_date, $request->end_date]);
            })
            ->get()
            ->toArray();
    }

    /**
     * Export Analytics Report as PDF
     * 
     * Generates a professionally designed PDF report with:
     * - Executive Summary (KPI Cards, Sales & Operational Summary)
     * - Top Customers by Revenue
     * - Detail Job Orders Table with Zebra Striping
     * - Status Distribution
     * 
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function exportAnalyticsPdf(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);

        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();

        // ==========================================
        // GATHER ALL DATA FOR PDF
        // ==========================================

        // 1. Sales Summary Data (from Invoices for accuracy)
        $paidInvoices = Invoices::where('status', 'Paid')
            ->whereBetween('created_at', [$startDate, $endDate]);
        
        $activeJobOrders = JobOrder::whereNotIn('status', ['Cancelled'])
            ->whereBetween('created_at', [$startDate, $endDate]);
        
        $completedJobOrders = JobOrder::where('status', 'Completed')
            ->whereBetween('created_at', [$startDate, $endDate]);

        $totalJoCount = (clone $activeJobOrders)->count();
        $completedJoCount = (clone $completedJobOrders)->count();
        $completionRate = $totalJoCount > 0 ? round(($completedJoCount / $totalJoCount) * 100, 1) : 0;

        $activeInvoicedCustomers = Invoices::whereNotIn('status', ['Cancelled'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->distinct('customer_id')
            ->count('customer_id');

        $summary = [
            'total_revenue' => (clone $paidInvoices)->sum('paid_amount'),
            'total_orders' => $totalJoCount,
            'total_customers' => $activeInvoicedCustomers,
            'avg_order_value' => (clone $paidInvoices)->avg('paid_amount') ?? 0,
            'completion_rate' => $completionRate,
        ];

        // 2. Operational Summary Data
        $deliveryOrders = DeliveryOrder::whereBetween('created_at', [$startDate, $endDate])->get();
        $allManifests = Manifests::whereBetween('created_at', [$startDate, $endDate])->get();
        
        $manifests = Manifests::with('drivers')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotNull('driver_id')
            ->get();
        
        $driverPerformance = $manifests->groupBy('driver_id')->map(function ($driverManifests) {
            return ['total_deliveries' => $driverManifests->count()];
        });

        $operational = [
            'delivery_success_rate' => $deliveryOrders->count() > 0 
                ? round(($deliveryOrders->where('status', 'Delivered')->count() / $deliveryOrders->count()) * 100, 1) 
                : 0,
            'active_drivers' => Drivers::whereIn('status', ['Available', 'On Duty'])->count(),
            'active_vehicles' => Vehicles::where('status', 'Available')->count(),
            'avg_deliveries_per_driver' => $driverPerformance->count() > 0 
                ? round($driverPerformance->avg('total_deliveries'), 1) 
                : 0,
            'manifest_completion_rate' => $allManifests->count() > 0 
                ? round(($allManifests->where('status', 'Completed')->count() / $allManifests->count()) * 100, 1) 
                : 0,
        ];

        // 3. Top Customers Data
        $topCustomers = Customers::select('customers.customer_name')
            ->selectRaw('COUNT(invoices.invoice_id) as order_count')
            ->selectRaw('SUM(CASE WHEN invoices.status = ? THEN invoices.paid_amount ELSE 0 END) as total_revenue', ['Paid'])
            ->leftJoin('invoices', 'customers.customer_id', '=', 'invoices.customer_id')
            ->where(function($q) use ($startDate, $endDate) {
                $q->whereBetween('invoices.created_at', [$startDate, $endDate])
                  ->whereNotIn('invoices.status', ['Cancelled']);
            })
            ->groupBy('customers.customer_id', 'customers.customer_name')
            ->havingRaw('COUNT(invoices.invoice_id) > 0')
            ->orderByDesc('total_revenue')
            ->limit(10)
            ->get()
            ->map(function($customer) {
                return [
                    'customer_name' => $customer->customer_name,
                    'order_count' => $customer->order_count,
                    'total_revenue' => $customer->total_revenue,
                ];
            });

        // 4. Job Orders for Detail Table
        $jobOrders = JobOrder::with('customer')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereNotIn('status', ['Cancelled'])
            ->orderBy('created_at', 'desc')
            ->get();

        // ==========================================
        // PREPARE PDF DATA
        // ==========================================
        
        $data = [
            'dateRange' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
                'formatted_start' => $startDate->locale('id')->translatedFormat('d F Y'),
                'formatted_end' => $endDate->locale('id')->translatedFormat('d F Y'),
            ],
            'generatedAt' => Carbon::now()->locale('id')->translatedFormat('d F Y, H:i') . ' WIB',
            'summary' => $summary,
            'operational' => $operational,
            'topCustomers' => $topCustomers,
            'jobOrders' => $jobOrders,
        ];

        // ==========================================
        // GENERATE PDF
        // ==========================================
        
        $pdf = Pdf::loadView('pdf.analytics_report', $data);
        
        // Set paper size and orientation
        $pdf->setPaper('A4', 'portrait');
        
        // Optional: Set PDF options for better rendering
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'defaultFont' => 'sans-serif',
        ]);

        // Generate filename
        $filename = 'Laporan_Analitik_' . $startDate->format('Ymd') . '_' . $endDate->format('Ymd') . '.pdf';

        // Return as download
        return $pdf->download($filename);
    }
}