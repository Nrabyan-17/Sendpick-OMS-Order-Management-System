<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Analitik Pengiriman - {{ $dateRange['start'] }} s/d {{ $dateRange['end'] }}</title>
    <style>
        @page {
            margin: 25px 30px;
        }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            font-size: 11px;
        }

        /* Header Styles */
        .report-header {
            position: relative;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #1e3a5f;
        }
        
        .header-left {
            float: left;
            width: 50%;
        }
        
        .header-right {
            float: right;
            width: 50%;
            text-align: right;
        }
        
        .company-name {
            font-size: 22px;
            font-weight: bold;
            color: #1e3a5f;
            margin: 0;
        }
        
        .company-tagline {
            font-size: 11px;
            color: #64748b;
            margin: 2px 0 0 0;
        }
        
        .report-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e3a5f;
            margin: 0;
        }
        
        .report-period {
            font-size: 12px;
            color: #64748b;
            margin: 4px 0 0 0;
        }
        
        .report-generated {
            font-size: 9px;
            color: #94a3b8;
            margin-top: 5px;
        }
        
        .clearfix::after {
            content: "";
            display: table;
            clear: both;
        }
        
        /* Page Title */
        .page-title {
            background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
            color: white;
            padding: 12px 15px;
            margin: 20px 0;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
        }
        
        .page-subtitle {
            font-size: 10px;
            font-weight: normal;
            opacity: 0.9;
            margin-top: 2px;
        }
        
        /* KPI Cards */
        .kpi-container {
            margin: 20px 0;
        }
        
        .kpi-card {
            float: left;
            width: 30%;
            margin-right: 5%;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            box-sizing: border-box;
        }
        
        .kpi-card:last-child {
            margin-right: 0;
        }
        
        .kpi-revenue {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            color: white;
        }
        
        .kpi-orders {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: white;
        }
        
        .kpi-completion {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
        }
        
        .kpi-value {
            font-size: 22px;
            font-weight: bold;
            margin: 0;
        }
        
        .kpi-label {
            font-size: 10px;
            opacity: 0.9;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .table-dark-header th {
            background-color: #1e293b;
            color: white;
            font-weight: bold;
            text-align: left;
            padding: 10px 8px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .table-dark-header td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10px;
        }
        
        .table-dark-header tr:nth-child(even) {
            background-color: #f8fafc;
        }
        
        .table-dark-header tr:nth-child(odd) {
            background-color: #ffffff;
        }
        
        .text-right {
            text-align: right !important;
        }
        
        .text-center {
            text-align: center !important;
        }
        
        /* Section Styles */
        .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #1e3a5f;
            margin: 25px 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        /* Summary Box */
        .summary-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        
        .summary-row {
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #e2e8f0;
        }
        
        .summary-row:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        
        .summary-label {
            display: inline-block;
            width: 40%;
            color: #64748b;
            font-size: 10px;
        }
        
        .summary-value {
            display: inline-block;
            width: 55%;
            text-align: right;
            font-weight: bold;
            color: #1e3a5f;
            font-size: 11px;
        }
        
        /* Status Badges */
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-info { background: #dbeafe; color: #1e40af; }
        .badge-secondary { background: #f1f5f9; color: #475569; }
        
        /* Footer */
        .report-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 10px 30px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #64748b;
        }
        
        .footer-left {
            float: left;
        }
        
        .footer-right {
            float: right;
        }
        
        /* Page Break */
        .page-break {
            page-break-before: always;
        }
        
        /* Two Column Layout */
        .two-column {
            width: 100%;
        }
        
        .column-left {
            float: left;
            width: 48%;
        }
        
        .column-right {
            float: right;
            width: 48%;
        }
        
        /* Ranking */
        .rank-number {
            display: inline-block;
            width: 20px;
            height: 20px;
            background: #1e3a5f;
            color: white;
            text-align: center;
            line-height: 20px;
            border-radius: 50%;
            font-size: 9px;
            font-weight: bold;
        }
        
        .rank-gold { background: #eab308; }
        .rank-silver { background: #9ca3af; }
        .rank-bronze { background: #b45309; }
        
        /* Trend Indicator */
        .trend-up { color: #22c55e; }
        .trend-down { color: #ef4444; }
        
        /* Divider */
        .divider {
            border-top: 1px solid #e2e8f0;
            margin: 20px 0;
        }
        
        /* Note Box */
        .note-box {
            background: #fefce8;
            border: 1px solid #fde047;
            border-radius: 5px;
            padding: 10px;
            font-size: 9px;
            color: #854d0e;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    {{-- ============================================== --}}
    {{-- PAGE 1: EXECUTIVE SUMMARY --}}
    {{-- ============================================== --}}
    
    <!-- Header -->
    <div class="report-header clearfix">
        <div class="header-left">
            @php
                $logoPath = public_path('build/assets/logo_sendpick.aea87447-400x150.png');
                $logoData = '';
                if (file_exists($logoPath)) {
                    $logoData = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
                }
            @endphp
            @if($logoData)
                <img src="{{ $logoData }}" alt="Logo" style="height: 35px; margin-bottom: 5px;">
            @endif
            <p class="company-name">SendPick Logistics</p>
            <p class="company-tagline">Order Management System</p>
        </div>
        <div class="header-right">
            <p class="report-title">LAPORAN ANALITIK PENGIRIMAN</p>
            <p class="report-period">Periode: {{ $dateRange['formatted_start'] }} — {{ $dateRange['formatted_end'] }}</p>
            <p class="report-generated">Digenerate pada: {{ $generatedAt }}</p>
        </div>
    </div>
    
    <!-- Page Title -->
    <div class="page-title">
        📊 Executive Summary
        <div class="page-subtitle">Ringkasan performa operasional dan keuangan periode berjalan</div>
    </div>
    
    <!-- KPI Cards -->
    <div class="kpi-container clearfix">
        <div class="kpi-card kpi-revenue">
            <p class="kpi-value">Rp {{ number_format($summary['total_revenue'], 0, ',', '.') }}</p>
            <p class="kpi-label">💰 Total Revenue</p>
        </div>
        <div class="kpi-card kpi-orders">
            <p class="kpi-value">{{ number_format($summary['total_orders']) }}</p>
            <p class="kpi-label">📦 Total Order</p>
        </div>
        <div class="kpi-card kpi-completion">
            <p class="kpi-value">{{ $summary['completion_rate'] }}%</p>
            <p class="kpi-label">✅ Completion Rate</p>
        </div>
    </div>
    
    <div class="clearfix"></div>
    
    <!-- Two Column Summary -->
    <div class="two-column clearfix">
        <div class="column-left">
            <div class="section-title">📈 Ringkasan Penjualan</div>
            <div class="summary-box">
                <div class="summary-row">
                    <span class="summary-label">Total Revenue:</span>
                    <span class="summary-value">Rp {{ number_format($summary['total_revenue'], 0, ',', '.') }}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Total Order:</span>
                    <span class="summary-value">{{ number_format($summary['total_orders']) }} order</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Total Customer Aktif:</span>
                    <span class="summary-value">{{ number_format($summary['total_customers']) }} customer</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Rata-rata Nilai Order:</span>
                    <span class="summary-value">Rp {{ number_format($summary['avg_order_value'], 0, ',', '.') }}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Order Completion Rate:</span>
                    <span class="summary-value">{{ $summary['completion_rate'] }}%</span>
                </div>
            </div>
        </div>
        
        <div class="column-right">
            <div class="section-title">🚚 Ringkasan Operasional</div>
            <div class="summary-box">
                <div class="summary-row">
                    <span class="summary-label">Driver Aktif:</span>
                    <span class="summary-value">{{ number_format($operational['active_drivers']) }} driver</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Kendaraan Aktif:</span>
                    <span class="summary-value">{{ number_format($operational['active_vehicles']) }} unit</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Delivery Success Rate:</span>
                    <span class="summary-value">{{ $operational['delivery_success_rate'] }}%</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Manifest Completion:</span>
                    <span class="summary-value">{{ $operational['manifest_completion_rate'] }}%</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Avg. Pengiriman/Driver:</span>
                    <span class="summary-value">{{ number_format($operational['avg_deliveries_per_driver'], 1) }}</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="clearfix"></div>
    
    <!-- Top 5 Customers -->
    <div class="section-title">🏆 Top 5 Customer by Revenue</div>
    <table class="table-dark-header">
        <thead>
            <tr>
                <th width="8%">Rank</th>
                <th width="42%">Nama Customer</th>
                <th width="15%" class="text-center">Jumlah Order</th>
                <th width="20%" class="text-right">Total Revenue</th>
                <th width="15%" class="text-right">% Share</th>
            </tr>
        </thead>
        <tbody>
            @forelse($topCustomers->take(5) as $index => $customer)
            <tr>
                <td class="text-center">
                    <span class="rank-number {{ $index === 0 ? 'rank-gold' : ($index === 1 ? 'rank-silver' : ($index === 2 ? 'rank-bronze' : '')) }}">
                        {{ $index + 1 }}
                    </span>
                </td>
                <td>{{ $customer['customer_name'] }}</td>
                <td class="text-center">{{ number_format($customer['order_count']) }}</td>
                <td class="text-right">Rp {{ number_format($customer['total_revenue'], 0, ',', '.') }}</td>
                <td class="text-right">{{ number_format(($customer['total_revenue'] / max($summary['total_revenue'], 1)) * 100, 1) }}%</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="text-center" style="color: #94a3b8; padding: 20px;">Tidak ada data customer untuk periode ini</td>
            </tr>
            @endforelse
        </tbody>
    </table>
    
    {{-- ============================================== --}}
    {{-- PAGE 2: DETAIL TABLES --}}
    {{-- ============================================== --}}
    
    <div class="page-break"></div>
    
    <!-- Header on page 2 -->
    <div class="report-header clearfix" style="margin-bottom: 15px; padding-bottom: 10px;">
        <div class="header-left">
            <p class="company-name" style="font-size: 16px;">SendPick Logistics</p>
        </div>
        <div class="header-right">
            <p class="report-period" style="font-size: 10px;">Periode: {{ $dateRange['formatted_start'] }} — {{ $dateRange['formatted_end'] }}</p>
        </div>
    </div>
    
    <!-- Page Title -->
    <div class="page-title">
        📋 Detail Data Order
        <div class="page-subtitle">Daftar transaksi Job Order pada periode laporan</div>
    </div>
    
    <!-- Job Orders Table -->
    <table class="table-dark-header">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="12%">ID Order</th>
                <th width="18%">Customer</th>
                <th width="12%">Tanggal</th>
                <th width="15%">Rute</th>
                <th width="10%" class="text-right">Berat (Kg)</th>
                <th width="15%" class="text-right">Nilai Order</th>
                <th width="13%" class="text-center">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($jobOrders->take(25) as $index => $order)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ $order->job_order_id }}</td>
                <td>{{ Str::limit($order->customer->customer_name ?? '-', 20) }}</td>
                <td>{{ \Carbon\Carbon::parse($order->created_at)->format('d/m/Y') }}</td>
                <td>{{ Str::limit($order->pickup_city, 8) }} → {{ Str::limit($order->delivery_city, 8) }}</td>
                <td class="text-right">{{ number_format($order->weight, 1) }}</td>
                <td class="text-right">Rp {{ number_format($order->order_value, 0, ',', '.') }}</td>
                <td class="text-center">
                    @php
                        $badgeClass = match($order->status) {
                            'Completed' => 'badge-success',
                            'Cancelled' => 'badge-danger',
                            'Pending' => 'badge-warning',
                            default => 'badge-info'
                        };
                    @endphp
                    <span class="badge {{ $badgeClass }}">{{ $order->status }}</span>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="8" class="text-center" style="color: #94a3b8; padding: 20px;">Tidak ada data order untuk periode ini</td>
            </tr>
            @endforelse
        </tbody>
    </table>
    
    @if($jobOrders->count() > 25)
    <div class="note-box">
        <strong>📌 Catatan:</strong> Tabel di atas menampilkan 25 dari {{ number_format($jobOrders->count()) }} total order. 
        Untuk melihat data lengkap, silakan export dalam format Excel.
    </div>
    @endif
    
    <div class="divider"></div>
    
    <!-- Status Distribution Summary -->
    <div class="section-title">📊 Distribusi Status Order</div>
    <table class="table-dark-header">
        <thead>
            <tr>
                <th width="40%">Status</th>
                <th width="30%" class="text-center">Jumlah Order</th>
                <th width="30%" class="text-right">Persentase</th>
            </tr>
        </thead>
        <tbody>
            @php
                $statusCounts = $jobOrders->groupBy('status')->map->count();
                $totalOrders = $jobOrders->count();
            @endphp
            @foreach($statusCounts as $status => $count)
            <tr>
                <td>
                    @php
                        $badgeClass = match($status) {
                            'Completed' => 'badge-success',
                            'Cancelled' => 'badge-danger',
                            'Pending' => 'badge-warning',
                            'In Transit', 'Pickup' => 'badge-info',
                            default => 'badge-secondary'
                        };
                    @endphp
                    <span class="badge {{ $badgeClass }}">{{ $status }}</span>
                </td>
                <td class="text-center">{{ number_format($count) }}</td>
                <td class="text-right">{{ $totalOrders > 0 ? number_format(($count / $totalOrders) * 100, 1) : 0 }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <!-- Report Footer Info -->
    <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
        <table width="100%" style="margin: 0;">
            <tr>
                <td style="border: none; padding: 5px 0; font-size: 9px; color: #64748b;">
                    <strong>Dokumen ini digenerate secara otomatis oleh sistem SendPick Logistics.</strong><br>
                    Periode Laporan: {{ $dateRange['formatted_start'] }} s/d {{ $dateRange['formatted_end'] }}<br>
                    Waktu Generate: {{ $generatedAt }}
                </td>
                <td style="border: none; padding: 5px 0; font-size: 9px; color: #64748b; text-align: right;">
                    SendPick Logistics<br>
                    Order Management System<br>
                    © {{ date('Y') }} All Rights Reserved
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
