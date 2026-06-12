<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delivery Order - {{ $deliveryOrder->do_id }}</title>
    <style>
        /* Page settings for DomPDF */
        @page {
            margin: 15mm;
        }

        /* Reset dan Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #333;
            background: #fff;
        }

        /* Container - no extra padding since @page has margin */
        .container {
            width: 100%;
            max-width: 100%;
        }

        /* Header Section */
        .header {
            width: 100%;
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 12px;
            margin-bottom: 15px;
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
            font-size: 16px;
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 4px;
        }

        .company-address {
            font-size: 9px;
            color: #666;
            word-wrap: break-word;
        }

        .doc-info {
            text-align: right;
            width: 45%;
        }

        .doc-title {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            margin-bottom: 4px;
        }

        .doc-number {
            font-size: 11px;
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 4px;
            word-wrap: break-word;
        }

        .doc-date {
            font-size: 9px;
            color: #666;
        }

        /* Status Badge */
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-pending { background: #FEF3C7; color: #D97706; }
        .status-in-transit { background: #DBEAFE; color: #2563EB; }
        .status-delivered { background: #D1FAE5; color: #059669; }
        .status-completed { background: #C7D2FE; color: #4F46E5; }
        .status-cancelled { background: #FEE2E2; color: #DC2626; }

        /* Info Sections */
        .info-section {
            margin-bottom: 15px;
        }

        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #4F46E5;
            border-bottom: 1px solid #E5E7EB;
            padding-bottom: 4px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }

        .info-table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 4px 0;
            vertical-align: top;
            word-wrap: break-word;
        }

        .info-label {
            width: 100px;
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
            padding-right: 10px;
        }

        .two-column td:last-child {
            padding-right: 0;
            padding-left: 10px;
        }

        /* Goods Table */
        .goods-table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            margin-top: 8px;
        }

        .goods-table th {
            background: #4F46E5;
            color: #fff;
            padding: 8px 6px;
            text-align: left;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .goods-table td {
            padding: 8px 6px;
            border-bottom: 1px solid #E5E7EB;
            word-wrap: break-word;
        }

        .goods-table tr:nth-child(even) {
            background: #F9FAFB;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        /* Route Section */
        .route-box {
            background: #F3F4F6;
            border-radius: 6px;
            padding: 12px;
            margin: 12px 0;
        }

        .route-table {
            width: 100%;
            table-layout: fixed;
        }

        .route-point {
            width: 44%;
            padding: 8px;
        }

        .route-arrow {
            width: 12%;
            text-align: center;
            vertical-align: middle;
        }

        .route-arrow-icon {
            font-size: 16px;
            color: #4F46E5;
        }

        .route-label {
            font-size: 8px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 3px;
        }

        .route-city {
            font-size: 12px;
            font-weight: bold;
            color: #333;
            word-wrap: break-word;
        }

        /* Signature Section */
        .signature-section {
            margin-top: 30px;
            page-break-inside: avoid;
        }

        .signature-table {
            width: 100%;
            table-layout: fixed;
        }

        .signature-box {
            width: 33%;
            text-align: center;
            padding: 8px;
        }

        .signature-title {
            font-size: 9px;
            font-weight: 600;
            color: #333;
            margin-bottom: 50px;
        }

        .signature-line {
            border-top: 1px solid #333;
            width: 80%;
            margin: 0 auto;
        }

        .signature-name {
            font-size: 9px;
            color: #666;
            margin-top: 4px;
        }

        /* Footer */
        .footer {
            margin-top: 25px;
            padding-top: 12px;
            border-top: 1px solid #E5E7EB;
            font-size: 8px;
            color: #999;
            text-align: center;
        }

        /* Notes box */
        .notes-box {
            padding: 8px;
            background: #F9FAFB;
            border-radius: 4px;
            font-size: 9px;
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
                        <div class="doc-title">DELIVERY ORDER</div>
                        <div class="doc-number">{{ $deliveryOrder->do_id }}</div>
                        <div class="doc-date">Tanggal: {{ $deliveryOrder->do_date ? $deliveryOrder->do_date->format('d/m/Y') : '-' }}</div>
                        <div style="margin-top: 6px;">
                            @php
                                $statusClass = 'status-pending';
                                $status = strtolower($deliveryOrder->status);
                                if (str_contains($status, 'transit')) $statusClass = 'status-in-transit';
                                elseif ($status === 'delivered') $statusClass = 'status-delivered';
                                elseif ($status === 'completed') $statusClass = 'status-completed';
                                elseif ($status === 'cancelled') $statusClass = 'status-cancelled';
                            @endphp
                            <span class="status-badge {{ $statusClass }}">{{ $deliveryOrder->status }}</span>
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
                        <div class="route-label">📍 ASAL</div>
                        <div class="route-city">{{ $sourceInfo['pickup_city'] ?? $sourceInfo['origin_city'] ?? '-' }}</div>
                    </td>
                    <td class="route-arrow">
                        <span class="route-arrow-icon">→</span>
                    </td>
                    <td class="route-point">
                        <div class="route-label">📍 TUJUAN</div>
                        <div class="route-city">{{ $sourceInfo['delivery_city'] ?? $sourceInfo['dest_city'] ?? '-' }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Two Column Info -->
        <table class="two-column">
            <tr>
                <!-- Customer Info -->
                <td>
                    <div class="info-section">
                        <div class="section-title">Informasi Penerima</div>
                        <table class="info-table">
                            <tr>
                                <td class="info-label">Customer</td>
                                <td class="info-value">: {{ $sourceInfo['customer_name'] ?? $deliveryOrder->customer?->customer_name ?? '-' }}</td>
                            </tr>
                            <tr>
                                <td class="info-label">Sumber</td>
                                <td class="info-value">: 
                                    @if($deliveryOrder->source_type === 'JO')
                                        Job Order: {{ $deliveryOrder->source_id }}
                                    @else
                                        Manifest: {{ $deliveryOrder->source_id }}
                                        @if(isset($sourceInfo['selected_job_order_id']))
                                            <br><small style="color: #666;">→ {{ $sourceInfo['selected_job_order_id'] }}</small>
                                        @endif
                                    @endif
                                </td>
                            </tr>
                            <tr>
                                <td class="info-label">Prioritas</td>
                                <td class="info-value">: {{ ucfirst($deliveryOrder->priority ?? 'Normal') }}</td>
                            </tr>
                        </table>
                    </div>
                </td>

                <!-- Driver/Vehicle Info -->
                <td>
                    <div class="info-section">
                        <div class="section-title">Informasi Pengiriman</div>
                        <table class="info-table">
                            <tr>
                                <td class="info-label">Driver</td>
                                <td class="info-value">: {{ $driverName }}</td>
                            </tr>
                            <tr>
                                <td class="info-label">Kendaraan</td>
                                <td class="info-value">: {{ $vehiclePlate }}</td>
                            </tr>
                            <tr>
                                <td class="info-label">Keberangkatan</td>
                                <td class="info-value">: {{ $deliveryOrder->departure_date ? $deliveryOrder->departure_date->format('d/m/Y H:i') : '-' }}</td>
                            </tr>
                            <tr>
                                <td class="info-label">ETA</td>
                                <td class="info-value">: {{ $deliveryOrder->eta ? $deliveryOrder->eta->format('d/m/Y H:i') : '-' }}</td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Goods Details -->
        <div class="info-section">
            <div class="section-title">Detail Barang</div>
            <table class="goods-table">
                <thead>
                    <tr>
                        <th style="width: 6%;">No</th>
                        <th style="width: 44%;">Deskripsi Barang</th>
                        <th style="width: 14%;" class="text-center">Koli</th>
                        <th style="width: 18%;" class="text-right">Berat (Kg)</th>
                        <th style="width: 18%;" class="text-right">Volume (m³)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="text-center">1</td>
                        <td>{{ $sourceInfo['goods_desc'] ?? $deliveryOrder->goods_summary ?? '-' }}</td>
                        <td class="text-center">{{ $sourceInfo['koli'] ?? $sourceInfo['quantity'] ?? '-' }}</td>
                        <td class="text-right">{{ $sourceInfo['goods_weight'] ? number_format($sourceInfo['goods_weight'], 2) : '-' }}</td>
                        <td class="text-right">{{ $sourceInfo['goods_volume'] ? number_format($sourceInfo['goods_volume'], 2) : '-' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Notes -->
        @if($deliveryOrder->goods_summary)
        <div class="info-section">
            <div class="section-title">Catatan</div>
            <div class="notes-box">
                {{ $deliveryOrder->goods_summary }}
            </div>
        </div>
        @endif

        <!-- Signature Section -->
        <div class="signature-section">
            <table class="signature-table">
                <tr>
                    <td class="signature-box">
                        <div class="signature-title">Pengirim</div>
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
            <p style="margin-top: 4px;">Dokumen ini sah tanpa tanda tangan basah</p>
        </div>
    </div>
</body>
</html>