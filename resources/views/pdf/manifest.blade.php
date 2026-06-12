<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manifest - {{ $manifest->manifest_id }}</title>
    <style>
        /* Page settings for DomPDF */
        @page {
            margin: 12mm;
        }

        /* Reset dan Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 9px;
            line-height: 1.3;
            color: #333;
            background: #fff;
        }

        /* Container */
        .container {
            width: 100%;
            max-width: 100%;
        }

        /* Header Section */
        .header {
            width: 100%;
            border-bottom: 3px solid #059669;
            padding-bottom: 10px;
            margin-bottom: 12px;
        }

        .header-table {
            width: 100%;
            table-layout: fixed;
        }

        .company-info {
            text-align: left;
            width: 55%;
        }

        .company-name {
            font-size: 15px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 3px;
        }

        .company-address {
            font-size: 8px;
            color: #666;
            word-wrap: break-word;
        }

        .doc-info {
            text-align: right;
            width: 45%;
        }

        .doc-title {
            font-size: 13px;
            font-weight: bold;
            color: #333;
            margin-bottom: 2px;
        }

        .doc-subtitle {
            font-size: 8px;
            color: #666;
            margin-bottom: 3px;
        }

        .doc-number {
            font-size: 10px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 3px;
            word-wrap: break-word;
        }

        .doc-date {
            font-size: 8px;
            color: #666;
        }

        /* Status Badge */
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-pending { background: #FEF3C7; color: #D97706; }
        .status-in-transit { background: #DBEAFE; color: #2563EB; }
        .status-arrived { background: #E0E7FF; color: #4F46E5; }
        .status-completed { background: #D1FAE5; color: #059669; }
        .status-cancelled { background: #FEE2E2; color: #DC2626; }

        /* Info Sections */
        .info-section {
            margin-bottom: 12px;
        }

        .section-title {
            font-size: 9px;
            font-weight: bold;
            color: #059669;
            border-bottom: 1px solid #E5E7EB;
            padding-bottom: 3px;
            margin-bottom: 6px;
            text-transform: uppercase;
        }

        .info-table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 3px 0;
            vertical-align: top;
            word-wrap: break-word;
        }

        .info-label {
            width: 90px;
            font-weight: 600;
            color: #666;
        }

        .info-value {
            color: #333;
        }

        /* Two Column Layout */
        .two-column {
            width: 100%;
            table-layout: fixed;
        }

        .two-column td {
            width: 50%;
            vertical-align: top;
            padding-right: 8px;
        }

        .two-column td:last-child {
            padding-right: 0;
            padding-left: 8px;
        }

        /* Route Box */
        .route-box {
            background: #ECFDF5;
            border: 1px solid #059669;
            border-radius: 5px;
            padding: 10px;
            margin: 10px 0;
        }

        .route-table {
            width: 100%;
            table-layout: fixed;
        }

        .route-point {
            width: 44%;
            padding: 6px;
        }

        .route-arrow {
            width: 12%;
            text-align: center;
            vertical-align: middle;
        }

        .route-arrow-icon {
            font-size: 14px;
            color: #059669;
        }

        .route-label {
            font-size: 7px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .route-city {
            font-size: 11px;
            font-weight: bold;
            color: #333;
            word-wrap: break-word;
        }

        /* Job Orders Table */
        .job-orders-table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            margin-top: 6px;
        }

        .job-orders-table th {
            background: #059669;
            color: #fff;
            padding: 6px 4px;
            text-align: left;
            font-size: 8px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .job-orders-table td {
            padding: 6px 4px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 8px;
            word-wrap: break-word;
            overflow: hidden;
        }

        .job-orders-table tr:nth-child(even) {
            background: #F9FAFB;
        }

        .job-orders-table .text-right {
            text-align: right;
        }

        .job-orders-table .text-center {
            text-align: center;
        }

        /* Total Row */
        .total-row {
            background: #ECFDF5 !important;
            font-weight: bold;
        }

        .total-row td {
            border-top: 2px solid #059669;
            padding: 8px 4px;
        }

        /* Summary Box */
        .summary-box {
            background: #F3F4F6;
            border-radius: 5px;
            padding: 10px;
            margin-top: 12px;
        }

        .summary-table {
            width: 100%;
            table-layout: fixed;
        }

        .summary-item {
            text-align: center;
            padding: 6px;
            width: 25%;
        }

        .summary-value {
            font-size: 13px;
            font-weight: bold;
            color: #059669;
        }

        .summary-label {
            font-size: 7px;
            color: #666;
            text-transform: uppercase;
        }

        /* Signature Section */
        .signature-section {
            margin-top: 25px;
            page-break-inside: avoid;
        }

        .signature-table {
            width: 100%;
            table-layout: fixed;
        }

        .signature-box {
            width: 33%;
            text-align: center;
            padding: 6px;
        }

        .signature-title {
            font-size: 8px;
            font-weight: 600;
            color: #333;
            margin-bottom: 40px;
        }

        .signature-line {
            border-top: 1px solid #333;
            width: 80%;
            margin: 0 auto;
        }

        .signature-name {
            font-size: 8px;
            color: #666;
            margin-top: 3px;
        }

        /* Footer */
        .footer {
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px solid #E5E7EB;
            font-size: 7px;
            color: #999;
            text-align: center;
        }

        /* Notes box */
        .notes-box {
            padding: 6px;
            background: #F9FAFB;
            border-radius: 4px;
            font-size: 8px;
            word-wrap: break-word;
        }

        /* Print specific styles */
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }

        /* Page break utility */
        .page-break {
            page-break-after: always;
        }

        /* Page break inside prevention */
        .no-break {
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <table class="header-table">
                <tr>
                    <td class="company-info">
                        <img src="{{ public_path('build/assets/logo_sendpick.aea87447-400x150.png') }}" alt="Logo" style="height: 40px; margin-bottom: 10px;">
                        <div class="company-name">{{ $companyName }}</div>
                        <div class="company-address">
                            {{ $companyAddress }}<br>
                            Telp: {{ $companyPhone }}
                        </div>
                    </td>
                    <td class="doc-info">
                        <div class="doc-title">MANIFEST</div>
                        <div class="doc-subtitle">Packing List / Surat Jalan</div>
                        <div class="doc-number">{{ $manifest->manifest_id }}</div>
                        <div class="doc-date">Tanggal: {{ $manifest->created_at ? $manifest->created_at->format('d/m/Y') : '-' }}</div>
                        <div style="margin-top: 5px;">
                            @php
                                $statusClass = 'status-pending';
                                $status = strtolower($manifest->status ?? 'pending');
                                if (str_contains($status, 'transit')) $statusClass = 'status-in-transit';
                                elseif ($status === 'arrived') $statusClass = 'status-arrived';
                                elseif ($status === 'completed') $statusClass = 'status-completed';
                                elseif ($status === 'cancelled') $statusClass = 'status-cancelled';
                            @endphp
                            <span class="status-badge {{ $statusClass }}">{{ $manifest->status ?? 'Pending' }}</span>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Route Box -->
        <div class="route-box">
            <table class="route-table">
                <tr>
                    <td class="route-point">
                        <div class="route-label">📍 KOTA ASAL</div>
                        <div class="route-city">{{ $manifest->origin_city ?? '-' }}</div>
                    </td>
                    <td class="route-arrow">
                        <span class="route-arrow-icon">→</span>
                    </td>
                    <td class="route-point">
                        <div class="route-label">📍 KOTA TUJUAN</div>
                        <div class="route-city">{{ $manifest->dest_city ?? '-' }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Two Column Info -->
        <table class="two-column">
            <tr>
                <!-- Manifest Info -->
                <td>
                    <div class="info-section">
                        <div class="section-title">Informasi Manifest</div>
                        <table class="info-table">
                            <tr>
                                <td class="info-label">Jadwal Berangkat</td>
                                <td class="info-value">: {{ $manifest->planned_departure ? $manifest->planned_departure->format('d/m/Y H:i') : '-' }}</td>
                            </tr>
                            <tr>
                                <td class="info-label">Estimasi Tiba</td>
                                <td class="info-value">: {{ $manifest->planned_arrival ? $manifest->planned_arrival->format('d/m/Y H:i') : '-' }}</td>
                            </tr>
                            <tr>
                                <td class="info-label">Total Job Order</td>
                                <td class="info-value">: {{ count($jobOrders) }} order</td>
                            </tr>
                        </table>
                    </div>
                </td>

                <!-- Driver/Vehicle Info -->
                <td>
                    <div class="info-section">
                        <div class="section-title">Driver & Kendaraan</div>
                        <table class="info-table">
                            <tr>
                                <td class="info-label">Driver</td>
                                <td class="info-value">: {{ $driverName }}</td>
                            </tr>
                            <tr>
                                <td class="info-label">No. HP Driver</td>
                                <td class="info-value">: {{ $driverPhone }}</td>
                            </tr>
                            <tr>
                                <td class="info-label">Kendaraan</td>
                                <td class="info-value">: {{ $vehiclePlate }} {{ $vehicleBrand ? "($vehicleBrand)" : '' }}</td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Job Orders List -->
        <div class="info-section no-break">
            <div class="section-title">Daftar Job Order ({{ count($jobOrders) }} Item)</div>
            <table class="job-orders-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">No</th>
                        <th style="width: 17%;">Job Order ID</th>
                        <th style="width: 18%;">Customer</th>
                        <th style="width: 12%;">Asal</th>
                        <th style="width: 12%;">Tujuan</th>
                        <th style="width: 16%;">Deskripsi</th>
                        <th style="width: 7%;" class="text-center">Koli</th>
                        <th style="width: 7%;" class="text-right">Kg</th>
                        <th style="width: 6%;" class="text-right">m³</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($jobOrders as $jo)
                    <tr>
                        <td class="text-center">{{ $jo['no'] }}</td>
                        <td>{{ Str::limit($jo['job_order_id'], 18) }}</td>
                        <td>{{ Str::limit($jo['customer_name'], 16) }}</td>
                        <td>{{ Str::limit($jo['pickup_city'], 10) }}</td>
                        <td>{{ Str::limit($jo['delivery_city'], 10) }}</td>
                        <td>{{ Str::limit($jo['goods_desc'], 18) }}</td>
                        <td class="text-center">{{ $jo['goods_qty'] }}</td>
                        <td class="text-right">{{ number_format($jo['goods_weight'], 1) }}</td>
                        <td class="text-right">{{ $jo['goods_volume'] > 0 ? number_format($jo['goods_volume'], 1) : '-' }}</td>
                    </tr>
                    @endforeach
                    
                    <!-- Total Row -->
                    <tr class="total-row">
                        <td colspan="6" class="text-right" style="font-weight: bold;">TOTAL</td>
                        <td class="text-center" style="font-weight: bold;">{{ $totalKoli }}</td>
                        <td class="text-right" style="font-weight: bold;">{{ number_format($totalWeight, 1) }}</td>
                        <td class="text-right" style="font-weight: bold;">{{ $totalVolume > 0 ? number_format($totalVolume, 1) : '-' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Summary Box -->
        <div class="summary-box">
            <table class="summary-table">
                <tr>
                    <td class="summary-item">
                        <div class="summary-value">{{ count($jobOrders) }}</div>
                        <div class="summary-label">Total Job Order</div>
                    </td>
                    <td class="summary-item">
                        <div class="summary-value">{{ $totalKoli }}</div>
                        <div class="summary-label">Total Koli</div>
                    </td>
                    <td class="summary-item">
                        <div class="summary-value">{{ number_format($totalWeight, 1) }} Kg</div>
                        <div class="summary-label">Total Berat</div>
                    </td>
                    <td class="summary-item">
                        <div class="summary-value">{{ $totalVolume > 0 ? number_format($totalVolume, 1) . ' m³' : '-' }}</div>
                        <div class="summary-label">Total Volume</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Notes from Cargo Summary -->
        @if($manifest->cargo_summary)
        <div class="info-section" style="margin-top: 12px;">
            <div class="section-title">Ringkasan Muatan</div>
            <div class="notes-box">
                {{ $manifest->cargo_summary }}
            </div>
        </div>
        @endif

        <!-- Signature Section -->
        <div class="signature-section">
            <table class="signature-table">
                <tr>
                    <td class="signature-box">
                        <div class="signature-title">Petugas Gudang</div>
                        <div class="signature-line"></div>
                        <div class="signature-name">( _________________ )</div>
                    </td>
                    <td class="signature-box">
                        <div class="signature-title">Driver</div>
                        <div class="signature-line"></div>
                        <div class="signature-name">( {{ $driverName !== 'Belum Ditugaskan' ? $driverName : '________________' }} )</div>
                    </td>
                    <td class="signature-box">
                        <div class="signature-title">Penerima</div>
                        <div class="signature-line"></div>
                        <div class="signature-name">( _________________ )</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Dicetak pada: {{ $printDate }} | {{ $companyName }} - Sistem Manajemen Pengiriman</p>
            <p style="margin-top: 3px;">Dokumen ini sah tanpa tanda tangan basah | Harap periksa kelengkapan barang sebelum berangkat</p>
        </div>
    </div>
</body>
</html>
