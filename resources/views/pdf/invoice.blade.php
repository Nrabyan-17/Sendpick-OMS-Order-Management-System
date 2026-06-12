<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_id }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
        }
        .header {
            margin-bottom: 30px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
        }
        .company-info h1 {
            color: #2c3e50;
            margin: 0 0 5px 0;
            font-size: 24px;
        }
        .company-info p {
            margin: 0;
            font-size: 12px;
            color: #7f8c8d;
        }
        .invoice-details {
            float: right;
            text-align: right;
        }
        .invoice-details h2 {
            margin: 0;
            color: #2c3e50;
            font-size: 20px;
        }
        .invoice-details p {
            margin: 2px 0;
            font-size: 12px;
        }
        .billing-info {
            margin-bottom: 30px;
            overflow: hidden;
        }
        .bill-to {
            float: left;
            width: 45%;
        }
        .bill-to h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #7f8c8d;
            text-transform: uppercase;
        }
        .bill-to p {
            margin: 0;
            font-size: 14px;
            font-weight: bold;
        }
        .meta-info {
            float: right;
            width: 45%;
            text-align: right;
        }
        .meta-row {
            margin-bottom: 5px;
        }
        .meta-label {
            font-size: 12px;
            color: #7f8c8d;
            display: inline-block;
            width: 100px;
        }
        .meta-value {
            font-size: 14px;
            font-weight: bold;
            display: inline-block;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th {
            background-color: #f8f9fa;
            color: #2c3e50;
            font-weight: bold;
            text-align: left;
            padding: 12px;
            font-size: 12px;
            text-transform: uppercase;
            border-bottom: 2px solid #eee;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .totals {
            float: right;
            width: 40%;
        }
        .total-row {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .total-row.final {
            border-bottom: none;
            border-top: 2px solid #2c3e50;
            margin-top: 10px;
            padding-top: 10px;
        }
        .total-label {
            display: inline-block;
            width: 50%;
            font-size: 13px;
            color: #7f8c8d;
        }
        .total-value {
            display: inline-block;
            width: 45%;
            text-align: right;
            font-weight: bold;
            font-size: 14px;
        }
        .final .total-value {
            font-size: 18px;
            color: #2c3e50;
        }
        .payment-info {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #7f8c8d;
        }
        
        /* Watermark Styles */
        .watermark {
            position: absolute;
            top: 20%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            font-weight: bold;
            opacity: 0.15;
            z-index: -1;
            border: 5px solid;
            padding: 10px 40px;
            text-transform: uppercase;
        }
        .status-paid {
            color: #22c55e;
            border-color: #22c55e;
        }
        .status-pending {
            color: #ef4444; 
            border-color: #ef4444;
        }
        .status-cancelled {
            color: #94a3b8;
            border-color: #94a3b8;
            opacity: 0.2;
            font-size: 120px;
        }
        
        /* Badge for PDF header */
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 5px;
        }
        .badge-paid { background: #dcfce7; color: #166534; }
        .badge-pending { background: #fee2e2; color: #991b1b; }
        .badge-partial { background: #fef3c7; color: #92400e; }
        .badge-overdue { background: #fecaca; color: #7f1d1d; }
        .badge-cancelled { background: #f1f5f9; color: #475569; }

        .payment-history-box {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        .payment-history-title {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 10px;
            color: #2c3e50;
        }
    </style>
</head>
<body>
    
    <!-- Watermark Logic -->
    @if ($invoice->status == 'Paid')
        <div class="watermark status-paid">LUNAS</div>
    @elseif ($invoice->status == 'Pending')
        <div class="watermark status-pending">UNPAID</div>
    @elseif ($invoice->status == 'Overdue')
        <div class="watermark status-pending">OVERDUE</div>
    @elseif ($invoice->status == 'Cancelled')
        <div class="watermark status-cancelled">VOID</div>
    @endif

    <div class="header">
        <div style="float: left; width: 60%;" class="company-info">
            <img src="{{ public_path('build/assets/logo_sendpick.aea87447-400x150.png') }}" alt="Logo" style="height: 40px; margin-bottom: 10px;">
            <h1>SendPick Logistics</h1>
            <p>Order Management System</p>
            <p>Jl. Logistics Raya No. 123, Jakarta</p>
            <p>Email: finance@sendpick.com | Phone: (021) 555-0123</p>
        </div>
        <div class="invoice-details">
            <h2>INVOICE</h2>
            <p>#{{ $invoice->invoice_id }}</p>
            @php
                $statusColor = match($invoice->status) {
                    'Paid' => 'badge-paid',
                    'Pending' => 'badge-pending',
                    'Partial' => 'badge-partial',
                    'Overdue' => 'badge-overdue',
                    'Cancelled' => 'badge-cancelled',
                    default => 'badge-pending'
                };
            @endphp
            <div class="status-badge {{ $statusColor }}">
                {{ $invoice->status }}
            </div>
        </div>
        <div style="clear: both;"></div>
    </div>

    <div class="billing-info">
        <div class="bill-to">
            <h3>Tagihan Kepada:</h3>
            <p>{{ $invoice->customer->customer_name ?? 'N/A' }}</p>
            <p style="font-weight: normal; font-size: 12px; margin-top: 4px;">
                {{ $invoice->customer->address ?? '-' }}<br>
                {{ $invoice->customer->email ?? '' }}
                {{ $invoice->customer->phone ? ' | ' . $invoice->customer->phone : '' }}
            </p>
        </div>
        <div class="meta-info">
            <div class="meta-row">
                <span class="meta-label">Tanggal Invoice:</span>
                <span class="meta-value">{{ \Carbon\Carbon::parse($invoice->invoice_date)->format('d/m/Y') }}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Jatuh Tempo:</span>
                <span class="meta-value">{{ \Carbon\Carbon::parse($invoice->due_date)->format('d/m/Y') }}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">ID Sumber:</span>
                <span class="meta-value">{{ $invoice->source_type ?? '-' }} #{{ $invoice->source_id ?? '-' }}</span>
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th width="50%">Deskripsi</th>
                <th width="15%" class="text-right">Qty</th>
                <th width="15%" class="text-right">Harga Satuan</th>
                <th width="20%" class="text-right">Jumlah</th>
            </tr>
        </thead>
        <tbody>
            @php
                // Logic to display item description based on source type if notes is empty
                $description = $invoice->notes;
                if (empty($description)) {
                    if ($invoice->source_type == 'JO') {
                       $description = "Jasa Pengiriman (Job Order)";
                    } elseif ($invoice->source_type == 'MF') {
                       $description = "Konsolidasi Pengiriman (Manifest)";
                    } else {
                       $description = "Delivery Order Service";
                    }
                }
            @endphp
            <tr>
                <td>
                    <b>{{ $description }}</b><br>
                    <span style="font-size: 11px; color: #7f8c8d;">
                        Ref: {{ $invoice->source_id }}
                    </span>
                </td>
                <td class="text-right">1</td>
                <td class="text-right">Rp {{ number_format($invoice->subtotal, 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($invoice->subtotal, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="totals">
        <div class="total-row">
            <span class="total-label">Subtotal</span>
            <span class="total-value">Rp {{ number_format($invoice->subtotal, 0, ',', '.') }}</span>
        </div>
        @if($invoice->tax_amount > 0)
        <div class="total-row">
            <span class="total-label">Pajak ({{ $invoice->tax_rate }}%)</span>
            <span class="total-value">Rp {{ number_format($invoice->tax_amount, 0, ',', '.') }}</span>
        </div>
        @endif
        <div class="total-row final">
            <span class="total-label">Total Tagihan</span>
            <span class="total-value">Rp {{ number_format($invoice->total_amount, 0, ',', '.') }}</span>
        </div>
        
        <div style="margin-top: 15px;">
            <div class="total-row" style="border-bottom: 1px dashed #ccc; color: #22c55e;">
                <span class="total-label">Sudah Dibayar</span>
                <span class="total-value">- Rp {{ number_format($invoice->paid_amount, 0, ',', '.') }}</span>
            </div>
            <div class="total-row final" style="border-top: none; padding-top: 5px;">
                <span class="total-label" style="color: #c0392b;">Sisa Tagihan (Due)</span>
                <span class="total-value" style="color: #c0392b;">Rp {{ number_format($invoice->total_amount - $invoice->paid_amount, 0, ',', '.') }}</span>
            </div>
        </div>
    </div>
    
    <div style="clear: both;"></div>

    @if($invoice->payments && $invoice->payments->count() > 0)
    <div class="payment-history-box">
        <div class="payment-history-title">Riwayat Pembayaran Terakhir:</div>
        <table style="margin-bottom: 0; background: transparent;">
            @foreach($invoice->payments->sortByDesc('payment_date')->take(3) as $payment)
            <tr>
                <td style="padding: 4px 0; border: none; font-size: 11px; color: #555;">
                    {{ \Carbon\Carbon::parse($payment->payment_date)->format('d/m/Y') }}
                </td>
                <td style="padding: 4px 0; border: none; font-size: 11px; color: #555;">
                    {{ $payment->payment_method }}
                </td>
                <td style="padding: 4px 0; border: none; font-size: 11px; font-weight: bold; text-align: right; color: #2c3e50;">
                    Rp {{ number_format($payment->amount, 0, ',', '.') }}
                </td>
            </tr>
            @endforeach
        </table>
    </div>
    @endif

    <div class="payment-info">
        <p><strong>Info Pembayaran:</strong></p>
        <p>Silakan transfer pembayaran ke rekening berikut:</p>
        <p>Bank BCA: 123-456-7890 (a.n PT SendPick Logistics)<br>
        Mohon cantumkan ID Invoice ({{ $invoice->invoice_id }}) pada berita transfer.</p>
    </div>

</body>
</html>
