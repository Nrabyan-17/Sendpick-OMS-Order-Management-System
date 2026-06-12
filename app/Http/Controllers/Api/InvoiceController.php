<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoices;
use App\Models\Customers;
use App\Models\JobOrder;
use App\Models\Manifests;
use App\Models\DeliveryOrder;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * InvoiceController - Controller untuk mengelola Invoice/Tagihan
 * 
 * Fungsi utama:
 * - Menampilkan daftar invoice dengan pencarian dan filter
 * - Membuat invoice otomatis dari job orders yang completed
 * - Calculate total amount berdasarkan tarif dan jarak
 * - Update status invoice (draft, sent, paid, overdue)
 * - Generate PDF invoice untuk customer
 * - Tracking pembayaran dan reminder
 * - Laporan revenue dan outstanding
 */
class InvoiceController extends Controller
{
    /**
     * Generate PDF for the specified invoice
     * 
     * @param string $invoiceId
     * @return \Illuminate\Http\Response
     */
    public function generatePdf(string $invoiceId)
    {
        $invoice = Invoices::with(['customer', 'payments', 'createdBy'])
            ->where('invoice_id', $invoiceId)
            ->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        $pdf = Pdf::loadView('pdf.invoice', compact('invoice'));
        
        // Define filename
        $fileName = 'Invoice-' . $invoice->invoice_id . '.pdf';

        return $pdf->download($fileName);
    }

    /**
     * Display a listing of invoices
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Invoices::with(['customer', 'createdBy', 'lastPayment', 'payments']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoice_id', 'ILIKE', "%{$search}%")
                ->orWhere('source_id', 'ILIKE', "%{$search}%")
                ->orWhere('notes', 'ILIKE', "%{$search}%")
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

        // Filter by date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('invoice_date', [$request->start_date, $request->end_date]);
        }

        // Filter by due date range
        if ($request->filled('due_start_date') && $request->filled('due_end_date')) {
            $query->whereBetween('due_date', [$request->due_start_date, $request->due_end_date]);
        }

        // Filter overdue invoices
        if ($request->filled('overdue') && $request->overdue == 'true') {
            $query->where('due_date', '<', now()->toDateString())
                ->where('status', '!=', 'Paid');
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        
        $invoices = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Add source information and calculate aging
        $invoices->getCollection()->transform(function ($invoice) {
            $invoice->source_info = $invoice->getSourceAttribute();
            $invoice->days_overdue = $invoice->status !== 'Paid' && Carbon::parse($invoice->due_date)->isPast() 
                ? Carbon::parse($invoice->due_date)->diffInDays(now()) 
                : 0;
            return $invoice;
        });

        return response()->json([
            'success' => true,
            'data' => $invoices->items(),
            'pagination' => [
                'current_page' => $invoices->currentPage(),
                'per_page' => $invoices->perPage(),
                'total' => $invoices->total(),
                'last_page' => $invoices->lastPage()
            ]
        ], 200);
    }

    /**
     * Store a newly created invoice
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'source_type' => 'required|in:JO,MF,DO',
            'source_id' => 'required|string',
            'customer_id' => 'required|exists:customers,customer_id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after:invoice_date',
            'subtotal' => 'required|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string'
        ]);

        // Validate source exists
        $source = null;
        if ($request->source_type === 'JO') {
            $source = JobOrder::where('job_order_id', $request->source_id)->first();
        } elseif ($request->source_type === 'MF') {
            $source = Manifests::where('manifest_id', $request->source_id)->first();
        } elseif ($request->source_type === 'DO') {
            $source = DeliveryOrder::where('do_id', $request->source_id)->first();
        }

        if (!$source) {
            return response()->json([
                'success' => false,
                'message' => 'Source record not found'
            ], 404);
        }

        // cek jika sudah ada invoice untuk source ini
        $existingInvoice = Invoices::where('source_type', $request->source_type)
            ->where('source_id', $request->source_id)
            ->first();

        if ($existingInvoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice already exists for this source'
            ], 422);
        }

        // Generate unique invoice_id
        $invoiceId = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        while (Invoices::where('invoice_id', $invoiceId)->exists()) {
            $invoiceId = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(6));
        }

        // Calculate tax and total
        $subtotal = $request->subtotal;
        $taxRate = $request->tax_rate ?? 11.00; // Default 11%
        $taxAmount = $subtotal * ($taxRate / 100);
        $totalAmount = $subtotal + $taxAmount;

        $invoice = Invoices::create([
            'invoice_id' => $invoiceId,
            'source_type' => $request->source_type,
            'source_id' => $request->source_id,
            'customer_id' => $request->customer_id,
            'invoice_date' => $request->invoice_date,
            'due_date' => $request->due_date,
            'subtotal' => $subtotal,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
            'status' => 'Pending',
            'notes' => $request->notes,
            'created_by' => Auth::id()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Invoice created successfully',
            'data' => $invoice->load(['customer', 'createdBy'])
        ], 201);
    }

    /**
     * Display the specified invoice
     * 
     * @param string $invoiceId
     * @return JsonResponse
     */
    public function show(string $invoiceId): JsonResponse
    {
        $invoice = Invoices::with(['customer', 'createdBy'])
            ->where('invoice_id', $invoiceId)
            ->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        // Add source information and aging
        $invoice->source_info = $invoice->getSourceAttribute();
        $invoice->days_overdue = $invoice->status !== 'Paid' && Carbon::parse($invoice->due_date)->isPast() 
            ? Carbon::parse($invoice->due_date)->diffInDays(now()) 
            : 0;

        return response()->json([
            'success' => true,
            'data' => $invoice
        ], 200);
    }

    /**
     * Update the specified invoice
     * 
     * @param Request $request
     * @param string $invoiceId
     * @return JsonResponse
     */
    public function update(Request $request, string $invoiceId): JsonResponse
    {
        $invoice = Invoices::where('invoice_id', $invoiceId)->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        // Cannot edit paid invoices
        if ($invoice->status === 'Paid') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit paid invoice'
            ], 422);
        }

        $request->validate([
            'customer_id' => 'required|exists:customers,customer_id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after:invoice_date',
            'subtotal' => 'required|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'status' => 'in:Pending,Paid,Overdue',
            'notes' => 'nullable|string'
        ]);

        // Calculate tax and total
        $subtotal = $request->subtotal;
        $taxRate = $request->tax_rate ?? ($invoice->tax_rate ?? 11.00);
        $taxAmount = $subtotal * ($taxRate / 100);
        $totalAmount = $subtotal + $taxAmount;

        // PROTECTION: If there are existing payments, prevent lowering total below paid amount
        $paidAmount = $invoice->paid_amount ?? 0;
        if ($paidAmount > 0 && $totalAmount < $paidAmount) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat mengubah total tagihan menjadi lebih rendah dari jumlah yang sudah dibayar',
                'details' => [
                    'paid_amount' => $paidAmount,
                    'new_total_amount' => $totalAmount,
                    'minimum_allowed' => $paidAmount
                ]
            ], 422);
        }

        // If there are existing payments, only allow updating non-financial fields
        // to prevent any manipulation of amounts
        if ($paidAmount > 0) {
            // Only update non-financial fields
            $invoice->update([
                'invoice_date' => $request->invoice_date,
                'due_date' => $request->due_date,
                'notes' => $request->notes
            ]);
        } else {
            // No payments yet, allow full update
            $invoice->update([
                'customer_id' => $request->customer_id,
                'invoice_date' => $request->invoice_date,
                'due_date' => $request->due_date,
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'status' => $request->status ?? $invoice->status,
                'notes' => $request->notes
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Invoice updated successfully',
            'data' => $invoice->load(['customer', 'createdBy'])
        ], 200);
    }

    /**
     * Remove the specified invoice
     * 
     * @param string $invoiceId
     * @return JsonResponse
     */
    public function destroy(string $invoiceId): JsonResponse
    {
        $invoice = Invoices::where('invoice_id', $invoiceId)->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        // Cannot delete paid invoices
        if ($invoice->status === 'Paid') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete paid invoice'
            ], 422);
        }

        $invoice->delete();

        return response()->json([
            'success' => true,
            'message' => 'Invoice deleted successfully'
        ], 200);
    }

    /**
     * Cancel the specified invoice
     * 
     * DOMINO EFFECT: When cancelled, the linked Job Order/Manifest/DO is "released"
     * so it can be selected again for a new invoice.
     * 
     * @param Request $request
     * @param string $invoiceId
     * @return JsonResponse
     */
    public function cancel(Request $request, string $invoiceId): JsonResponse
    {
        $invoice = Invoices::where('invoice_id', $invoiceId)->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found'
            ], 404);
        }

        // Cannot cancel paid invoices
        if ($invoice->status === 'Paid') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel paid invoice'
            ], 422);
        }

        $reason = $request->input('reason');
        
        // Store the source info before clearing it (for audit trail in notes)
        $sourceInfo = "Original source: {$invoice->source_type}-{$invoice->source_id}";
        
        $updateData = [
            'status' => 'Cancelled',
            // Clear source relationship to "release" the Job Order/Manifest/DO
            'source_type' => null,
            'source_id' => null,
        ];
        
        if ($reason) {
            // Include original source info in cancellation note for audit
            $updateData['cancellation_note'] = $reason . "\n\n[{$sourceInfo}]";
        } else {
            $updateData['cancellation_note'] = "[{$sourceInfo}]";
        }

        $invoice->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Invoice cancelled successfully. Job Order has been released and can be used for new invoices.',
            'data' => $invoice
        ], 200);
    }

    /**
     * Record a payment for invoice (support partial and full payment)
     * 
     * @param Request $request
     * @param string $invoiceId
     * @return JsonResponse
     */
    /**
     * Record a payment for invoice (support partial and full payment)
     * 
     * @param Request $request
     * @param string $invoiceId
     * @return JsonResponse
     */
    public function recordPayment(Request $request, string $invoiceId): JsonResponse
    {
        $invoice = Invoices::where('invoice_id', $invoiceId)->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice tidak ditemukan'
            ], 404);
        }

        if ($invoice->status === 'Paid') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice ini sudah lunas'
            ], 422);
        }

        // Validate payment amount
        $request->validate([
            'payment_amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'payment_method' => 'required|string',
            'payment_notes' => 'nullable|string|max:500'
        ]);

        $paymentAmount = $request->payment_amount;
        $currentPaidAmount = $invoice->paid_amount ?? 0;
        $newPaidAmount = $currentPaidAmount + $paymentAmount;

        // Check if overpayment
        if ($newPaidAmount > $invoice->total_amount) {
            return response()->json([
                'success' => false,
                'message' => 'Payment amount exceeds outstanding balance',
                'details' => [
                    'total_amount' => $invoice->total_amount,
                    'paid_amount' => $currentPaidAmount,
                    'outstanding_amount' => $invoice->total_amount - $currentPaidAmount,
                    'payment_amount' => $paymentAmount,
                    'overpayment' => $newPaidAmount - $invoice->total_amount
                ]
            ], 422);
        }

        // Create Payment Record
        Payment::create([
            'invoice_id' => $invoice->invoice_id,
            'amount' => $paymentAmount,
            'payment_date' => $request->payment_date,
            'payment_method' => $request->payment_method,
            'notes' => $request->payment_notes,
            'created_by' => Auth::id()
        ]);

        // Determine new status based on payment amount
        $newStatus = 'Pending';

        if ($newPaidAmount > 0 && $newPaidAmount < $invoice->total_amount) {
            $newStatus = 'Partial';
        } elseif ($newPaidAmount >= $invoice->total_amount) {
            $newStatus = 'Paid';
        }

        // Update invoice
        $invoice->update([
            'paid_amount' => $newPaidAmount,
            'payment_date' => $request->payment_date, // Update last payment date
            'status' => $newStatus
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded successfully',
            'data' => [
                'invoice' => $invoice->load(['customer', 'createdBy', 'lastPayment']),
                'payment_summary' => [
                    'total_amount' => $invoice->total_amount,
                    'paid_amount' => $newPaidAmount,
                    'outstanding_amount' => $invoice->outstanding_amount,
                    'payment_progress' => $invoice->payment_progress . '%',
                    'status' => $newStatus
                ]
            ]
        ], 200);
    }

    /**
     * Get invoice statistics for Payment Tracking
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getStats(Request $request): JsonResponse
    {
        // 1. This Month Paid: Sum of payments made in current month
        $startOfMonth = Carbon::now()->startOfMonth()->toDateString();
        $endOfMonth = Carbon::now()->endOfMonth()->toDateString();
        
        // Try using Eloquent first
        $thisMonthPaid = Payment::whereBetween('payment_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');
        
        // If no payments table data, fall back to invoices.paid_amount
        // for invoices that were paid this month
        if ($thisMonthPaid == 0) {
            $thisMonthPaid = Invoices::whereBetween('payment_date', [$startOfMonth, $endOfMonth])
                ->sum('paid_amount');
        }

        // 2. Outstanding: Total unpaid amount for non-cancelled, non-paid invoices
        // Using PHP calculation for reliability
        $activeInvoices = Invoices::where('status', '!=', 'Cancelled')
            ->where('status', '!=', 'Paid')
            ->get(['total_amount', 'paid_amount']);
        
        $outstanding = $activeInvoices->sum(function ($invoice) {
            $total = floatval($invoice->total_amount ?? 0);
            $paid = floatval($invoice->paid_amount ?? 0);
            return max(0, $total - $paid); // Prevent negative values
        });

        // 3. Overdue Amount: Same as outstanding but only for overdue invoices
        $overdueInvoices = Invoices::where('status', '!=', 'Cancelled')
            ->where('status', '!=', 'Paid')
            ->where('due_date', '<', Carbon::now()->toDateString())
            ->get(['total_amount', 'paid_amount']);
        
        $overdueAmount = $overdueInvoices->sum(function ($invoice) {
            $total = floatval($invoice->total_amount ?? 0);
            $paid = floatval($invoice->paid_amount ?? 0);
            return max(0, $total - $paid);
        });

        // 4. Average Payment Time: Average days between invoice_date and payment_date
        $paidInvoices = Invoices::where('status', 'Paid')
            ->whereNotNull('payment_date')
            ->whereNotNull('invoice_date')
            ->get(['invoice_date', 'payment_date']);
        
        $avgPaymentTime = 0;
        if ($paidInvoices->count() > 0) {
            $totalDays = $paidInvoices->sum(function ($invoice) {
                $invoiceDate = Carbon::parse($invoice->invoice_date);
                $paymentDate = Carbon::parse($invoice->payment_date);
                return $paymentDate->diffInDays($invoiceDate);
            });
            $avgPaymentTime = $totalDays / $paidInvoices->count();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'this_month_paid' => (float) $thisMonthPaid,
                'outstanding' => (float) $outstanding,
                'overdue_amount' => (float) $overdueAmount,
                'avg_payment_time' => round((float) $avgPaymentTime, 1)
            ]
        ], 200);
    }

    /**
     * Get available sources for creating invoices
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getAvailableSources(Request $request): JsonResponse
    {
        $sources = [];

        // Get Job Orders without ACTIVE invoices (exclude cancelled invoices)
        $jobOrders = JobOrder::with('customer')
            ->whereNotIn('job_order_id', function($query) {
                $query->select('source_id')
                    ->from('invoices')
                    ->where('source_type', 'JO')
                    ->where('status', '!=', 'Cancelled') // Only exclude if invoice is NOT cancelled
                    ->whereNotNull('source_id'); // Also check source_id is not null
            })
            ->where('status', '!=', 'Cancelled')
            ->select('job_order_id as id', 'customer_id', 'goods_desc', 'order_value')
            ->get()
            ->map(function($jo) {
                $jo->type = 'JO';
                $jo->title = $jo->id . ' - ' . $jo->goods_desc;
                $jo->amount = $jo->order_value;
                return $jo;
            });

        // Get Manifests without ACTIVE invoices
        $manifests = Manifests::whereNotIn('manifest_id', function($query) {
                $query->select('source_id')
                    ->from('invoices')
                    ->where('source_type', 'MF')
                    ->where('status', '!=', 'Cancelled')
                    ->whereNotNull('source_id');
            })
            ->where('status', 'Completed')
            ->select('manifest_id as id', 'origin_city', 'dest_city', 'cargo_weight')
            ->get()
            ->map(function($mf) {
                $mf->type = 'MF';
                $mf->title = $mf->id . ' - ' . $mf->origin_city . ' to ' . $mf->dest_city;
                $mf->amount = null; // Manifests don't have predefined amounts
                return $mf;
            });

        // Get Delivery Orders without ACTIVE invoices
        $deliveryOrders = DeliveryOrder::with('customer')
            ->whereNotIn('do_id', function($query) {
                $query->select('source_id')
                    ->from('invoices')
                    ->where('source_type', 'DO')
                    ->where('status', '!=', 'Cancelled')
                    ->whereNotNull('source_id');
            })
            ->where('status', 'Delivered')
            ->select('do_id as id', 'customer_id', 'goods_summary')
            ->get()
            ->map(function($do) {
                $do->type = 'DO';
                $do->title = $do->id . ' - ' . $do->goods_summary;
                $do->amount = null;
                return $do;
            });

        $sources = $jobOrders->concat($manifests)->concat($deliveryOrders);

        return response()->json([
            'success' => true,
            'data' => $sources
        ], 200);
    }

}