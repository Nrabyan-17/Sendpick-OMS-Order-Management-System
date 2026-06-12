<?php

namespace App\Observers;

use App\Models\JobOrder;
use App\Models\Manifests;
use Illuminate\Support\Facades\Log;

/**
 * ============================================================
 * JOB ORDER OBSERVER
 * ============================================================
 * 
 * Observer ini memantau perubahan pada Job Order dan secara otomatis
 * melakukan recalculate pada semua Manifest yang terkait.
 * 
 * TRIGGER:
 * - Setiap kali Job Order di-update (termasuk perubahan status)
 * - Setiap kali Job Order dihapus
 * 
 * AKSI:
 * - Recalculate cargo_weight dan cargo_summary dari semua Job Order AKTIF
 * - Jika tidak ada Job Order aktif, kosongkan driver_id dan vehicle_id
 */
class JobOrderObserver
{
    /**
     * Handle the JobOrder "created" event.
     */
    public function created(JobOrder $jobOrder): void
    {
        // Tidak perlu aksi untuk created - Manifest belum terkait
    }

    /**
     * Handle the JobOrder "updated" event.
     * 
     * Ini adalah event UTAMA yang akan trigger recalculate Manifest
     * setiap kali Job Order berubah (status, berat, koli, dll)
     */
    public function updated(JobOrder $jobOrder): void
    {
        // Recalculate semua Manifest yang terkait dengan Job Order ini
        $this->recalculateRelatedManifests($jobOrder);
    }

    /**
     * Handle the JobOrder "deleted" event.
     */
    public function deleted(JobOrder $jobOrder): void
    {
        // Recalculate semua Manifest yang terkait
        $this->recalculateRelatedManifests($jobOrder);
    }

    /**
     * Handle the JobOrder "restored" event.
     */
    public function restored(JobOrder $jobOrder): void
    {
        // Recalculate semua Manifest yang terkait
        $this->recalculateRelatedManifests($jobOrder);
    }

    /**
     * Handle the JobOrder "force deleted" event.
     */
    public function forceDeleted(JobOrder $jobOrder): void
    {
        // Recalculate semua Manifest yang terkait
        $this->recalculateRelatedManifests($jobOrder);
    }

    /**
     * ============================================================
     * RECALCULATE MANIFEST CARGO
     * ============================================================
     * 
     * Menghitung ulang total berat dan koli dari semua Job Order AKTIF
     * yang terikat pada setiap Manifest yang terkait dengan Job Order ini.
     * 
     * @param JobOrder $jobOrder
     * @return void
     */
    private function recalculateRelatedManifests(JobOrder $jobOrder): void
    {
        try {
            // Ambil semua Manifest yang memiliki Job Order ini
            $manifests = $jobOrder->manifests()->get();

            if ($manifests->isEmpty()) {
                Log::debug("[JobOrderObserver] Job Order {$jobOrder->job_order_id} tidak terkait dengan Manifest manapun.");
                return;
            }

            foreach ($manifests as $manifest) {
                $this->recalculateManifestCargo($manifest);
            }

        } catch (\Exception $e) {
            Log::error("[JobOrderObserver] Error recalculating manifests for Job Order {$jobOrder->job_order_id}: " . $e->getMessage());
        }
    }

    /**
     * Recalculate cargo untuk satu Manifest
     * 
     * ✅ PENTING: Menghitung dari SEMUA Job Order (termasuk Cancelled)
     * Kenapa? Karena Manifest adalah "wadah" yang menunjukkan rencana pengiriman.
     * Meskipun ada Job Order yang dibatalkan, totalnya tetap ditampilkan untuk audit.
     * 
     * @param Manifests $manifest
     * @return void
     */
    private function recalculateManifestCargo(Manifests $manifest): void
    {
        try {
            // ✅ Hitung dari SEMUA Job Order yang terikat (termasuk Cancelled)
            // Ini sesuai dengan kebutuhan bisnis: Manifest menampilkan total rencana muatan
            $allJobOrders = $manifest->jobOrders()->get();
            
            // Juga hitung Job Order aktif untuk keperluan driver assignment
            $activeJobOrders = $manifest->jobOrders()
                ->where('status', '!=', 'Cancelled')
                ->get();

            $totalWeight = $allJobOrders->sum('goods_weight');
            $totalKoli = $allJobOrders->sum('goods_qty');

            // Buat cargo summary dari SEMUA Job Order
            $cargoSummary = $allJobOrders->count() . ' packages';
            if ($allJobOrders->count() > 0) {
                $descriptions = $allJobOrders->pluck('goods_desc')->unique()->take(3);
                $cargoSummary .= ': ' . $descriptions->implode(', ');
                if ($allJobOrders->count() > 3) {
                    $cargoSummary .= ', etc.';
                }
            }

            // ✅ Jika tidak ada Job Order AKTIF, kosongkan driver & vehicle
            // (Driver tidak perlu jika semua barang dibatalkan)
            if ($activeJobOrders->count() === 0) {
                $manifest->update([
                    'cargo_weight' => $totalWeight,
                    'cargo_summary' => $cargoSummary,
                    'driver_id' => null,
                    'vehicle_id' => null
                ]);
                Log::info("[JobOrderObserver] Manifest {$manifest->manifest_id} recalculated: {$allJobOrders->count()} total JOs, 0 active. Weight: {$totalWeight} kg. Driver released.");
            } else {
                $manifest->update([
                    'cargo_weight' => $totalWeight,
                    'cargo_summary' => $cargoSummary
                ]);
                Log::info("[JobOrderObserver] Manifest {$manifest->manifest_id} recalculated: {$allJobOrders->count()} total JOs, {$activeJobOrders->count()} active. Weight: {$totalWeight} kg.");
            }

        } catch (\Exception $e) {
            Log::error("[JobOrderObserver] Error recalculating Manifest {$manifest->manifest_id}: " . $e->getMessage());
        }
    }
}
