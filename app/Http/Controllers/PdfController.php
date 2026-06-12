<?php

namespace App\Http\Controllers;

use App\Models\DeliveryOrder;
use App\Models\Manifests;
use App\Models\JobOrder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

/**
 * PdfController - Controller untuk generate dokumen PDF
 * 
 * Fungsi utama:
 * - Generate PDF Delivery Order
 * - Generate PDF Manifest (Packing List)
 */
class PdfController extends Controller
{
    /**
     * Generate PDF untuk Delivery Order
     * 
     * @param string $doId - ID Delivery Order (contoh: DO-20251218-0001)
     * @return \Illuminate\Http\Response
     */
    public function printDeliveryOrder(string $doId)
    {
        // Ambil data Delivery Order dengan relasi
        $deliveryOrder = DeliveryOrder::with(['customer', 'createdBy'])
            ->where('do_id', $doId)
            ->first();

        if (!$deliveryOrder) {
            abort(404, 'Delivery Order tidak ditemukan');
        }

        // Ambil source info (Job Order atau Manifest data)
        $sourceInfo = $deliveryOrder->getSourceAttribute();

        // Tentukan data driver dan vehicle
        $driverName = $deliveryOrder->driver_name ?? 'Belum Ditugaskan';
        $vehiclePlate = $deliveryOrder->vehicle_plate ?? '-';

        // Ambil data tambahan berdasarkan source type
        $jobOrderData = null;
        $manifestData = null;

        if ($deliveryOrder->source_type === 'JO') {
            $jobOrderData = JobOrder::with(['customer', 'assignments.driver', 'assignments.vehicle'])
                ->where('job_order_id', $deliveryOrder->source_id)
                ->first();
            
            if ($jobOrderData) {
                // Ambil driver/vehicle dari assignment terbaru
                $latestAssignment = $jobOrderData->assignments->sortByDesc('created_at')->first();
                if ($latestAssignment) {
                    $driverName = $latestAssignment->driver?->driver_name ?? $driverName;
                    $vehiclePlate = $latestAssignment->vehicle?->plate_no ?? $vehiclePlate;
                }
            }
        } elseif ($deliveryOrder->source_type === 'MF') {
            $manifestData = Manifests::with(['drivers', 'vehicles', 'jobOrders.customer'])
                ->where('manifest_id', $deliveryOrder->source_id)
                ->first();
            
            if ($manifestData) {
                $driverName = $manifestData->drivers?->driver_name ?? $driverName;
                $vehiclePlate = $manifestData->vehicles?->plate_no ?? $vehiclePlate;
            }
        }

        // Siapkan data untuk view
        $data = [
            'deliveryOrder' => $deliveryOrder,
            'sourceInfo' => $sourceInfo,
            'driverName' => $driverName,
            'vehiclePlate' => $vehiclePlate,
            'jobOrder' => $jobOrderData,
            'manifest' => $manifestData,
            'printDate' => now()->format('d/m/Y H:i'),
            'companyName' => 'SendPick Logistics',
            'companyAddress' => 'Jl. Raya Cempaka Putih No. 88, Jakarta Pusat 10510',
            'companyPhone' => '(021) 4287-5500',
        ];

        // Generate PDF dengan DomPDF
        $pdf = Pdf::loadView('pdf.delivery_order', $data);
        
        // Set paper size ke A4
        $pdf->setPaper('A4', 'portrait');

        // Return sebagai stream (view di browser) atau download
        // Gunakan ->download() jika ingin langsung download
        return $pdf->stream("DO-{$doId}.pdf");
    }

    /**
     * Generate PDF untuk Manifest (Packing List)
     * 
     * @param string $manifestId - ID Manifest (contoh: MAN-20251218-001)
     * @return \Illuminate\Http\Response
     */
    public function printManifest(string $manifestId)
    {
        // Ambil data Manifest dengan semua relasi
        $manifest = Manifests::with([
            'createdBy',
            'drivers',
            'vehicles',
            'jobOrders.customer'
        ])->where('manifest_id', $manifestId)->first();

        if (!$manifest) {
            abort(404, 'Manifest tidak ditemukan');
        }

        // Hitung total dari semua Job Orders
        $totalWeight = 0;
        $totalVolume = 0;
        $totalKoli = 0;
        $jobOrdersData = [];

        foreach ($manifest->jobOrders as $index => $jo) {
            $weight = floatval($jo->goods_weight ?? 0);
            $volume = floatval($jo->goods_volume ?? 0);
            $koli = intval($jo->goods_qty ?? 1);

            $totalWeight += $weight;
            $totalVolume += $volume;
            $totalKoli += $koli;

            $jobOrdersData[] = [
                'no' => $index + 1,
                'job_order_id' => $jo->job_order_id,
                'customer_name' => $jo->customer?->customer_name ?? '-',
                'pickup_city' => $jo->pickup_city ?? '-',
                'delivery_city' => $jo->delivery_city ?? '-',
                'goods_desc' => $jo->goods_desc ?? '-',
                'goods_weight' => $weight,
                'goods_volume' => $volume,
                'goods_qty' => $koli,
            ];
        }

        // Siapkan data untuk view
        $data = [
            'manifest' => $manifest,
            'jobOrders' => $jobOrdersData,
            'totalWeight' => $totalWeight,
            'totalVolume' => $totalVolume,
            'totalKoli' => $totalKoli,
            'driverName' => $manifest->drivers?->driver_name ?? 'Belum Ditugaskan',
            'driverPhone' => $manifest->drivers?->phone ?? '-',
            'vehiclePlate' => $manifest->vehicles?->plate_no ?? '-',
            'vehicleBrand' => $manifest->vehicles?->brand ?? '-',
            'vehicleType' => $manifest->vehicles?->type ?? '-',
            'printDate' => now()->format('d/m/Y H:i'),
            'companyName' => 'SendPick Logistics',
            'companyAddress' => 'Jl. Raya Cempaka Putih No. 88, Jakarta Pusat 10510',
            'companyPhone' => '(021) 4287-5500',
        ];

        // Generate PDF dengan DomPDF
        $pdf = Pdf::loadView('pdf.manifest', $data);
        
        // Set paper size ke A4 landscape (karena tabel banyak kolom)
        $pdf->setPaper('A4', 'portrait');

        // Return sebagai stream
        return $pdf->stream("Manifest-{$manifestId}.pdf");
    }
}
