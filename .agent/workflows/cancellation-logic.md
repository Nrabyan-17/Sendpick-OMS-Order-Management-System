---
description: Logika pembatalan (Cancel) untuk Job Order, Manifest, dan Delivery Order
---

# Cancellation Logic - Blueprint Operasional

Dokumen ini menjelaskan logika pembatalan yang telah diimplementasikan untuk sistem logistik Sendpick.

## 1. Tabel Matriks Logika Pembatalan (Cheat Sheet)

| Aksi Admin (Source) | Status Akhir Job Order | Status Akhir Delivery Order | Status Akhir Manifest | Penjelasan Singkat |
|---------------------|------------------------|-----------------------------|-----------------------|--------------------|
| **Cancel Job Order** (Customer Batal) | ❌ CANCELLED (Order Mati) | ❌ CANCELLED (Hangus Otomatis) | ⚠️ CANCELLED jika satu-satunya JO, ✅ TETAP jika masih ada JO lain | Induk (JO) mati, surat jalan (DO) otomatis tidak berlaku. Manifest di-cancel jika tidak ada JO aktif. |
| **Cancel Manifest** (Truk Batal Jalan) | 🔄 PENDING (Reset & Cari Truk Baru) | ❌ CANCELLED (Hangus Otomatis) | ❌ CANCELLED (Riwayat Batal) | Truk batal, JO diselamatkan (turun dari truk) untuk ikut truk lain. DO lama hangus. |
| **Cancel DO** (Salah Dokumen) | 🔄 PENDING (Reset & Buat DO Baru) | ❌ CANCELLED (Arsip Salah) | ⚠️ CANCELLED jika Manifest kosong | Dokumen salah, JO dikembalikan ke antrean. **Jika tidak ada JO tersisa di Manifest, Manifest ikut CANCELLED.** |

---

## 2. API Endpoints

### Cancel Job Order
```
POST /api/job-orders/{jobOrderId}/cancel
```

**Request Body (Optional):**
```json
{
  "cancellation_reason": "Customer membatalkan pesanan"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Job Order berhasil dibatalkan",
  "data": {
    "job_order_id": "JO-20251219-XXXX",
    "status": "Cancelled",
    "cancelled_at": "2025-12-19T21:48:00Z",
    "cancellation_reason": "Customer membatalkan pesanan",
    "cancelled_delivery_orders": ["DO-20251219-XXXX"],
    "detached_from_manifests": [
      {
        "manifest_id": "MF-20251219-XXXX",
        "remaining_jobs": 2,
        "remaining_weight": 1500
      }
    ]
  }
}
```

**Guard Validasi:**
🛑 DILARANG Cancel Job Order jika Manifest sudah status "In Transit"

---

### Cancel Manifest
```
POST /api/manifests/{manifestId}/cancel
```

**Request Body (Optional):**
```json
{
  "cancellation_reason": "Armada mogok di jalan"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Manifest berhasil dibatalkan. 3 Job Order dikembalikan ke antrian, 2 Delivery Order dibatalkan.",
  "data": {
    "manifest_id": "MF-20251219-XXXX",
    "status": "Cancelled",
    "cancelled_at": "2025-12-19T21:48:00Z",
    "cancellation_reason": "Armada mogok di jalan",
    "reset_job_orders": ["JO-20251219-001", "JO-20251219-002"],
    "cancelled_delivery_orders": ["DO-20251219-001", "DO-20251219-002"]
  }
}
```

---

### Cancel Delivery Order
```
POST /api/delivery-orders/{doId}/cancel
```

**Request Body (Optional):**
```json
{
  "cancellation_reason": "Salah cetak tanggal pengiriman"
}
```

**Response Success (dengan sisa JO di Manifest):**
```json
{
  "success": true,
  "message": "Delivery Order berhasil dibatalkan. Job Order dikembalikan ke antrian untuk dicetak ulang.",
  "data": {
    "do_id": "DO-20251219-XXXX",
    "status": "Cancelled",
    "cancelled_at": "2025-12-19T21:48:00Z",
    "cancellation_reason": "Salah cetak tanggal pengiriman",
    "reset_job_orders": ["JO-20251219-001"],
    "recalculated_manifest": {
      "manifest_id": "MF-20251219-XXXX",
      "status": "Pending",
      "active_jobs": 2,
      "total_weight": 1200,
      "total_koli": 10
    }
  }
}
```

**Response Success (Manifest menjadi kosong → CANCELLED):**
```json
{
  "success": true,
  "message": "Delivery Order berhasil dibatalkan. Job Order dikembalikan ke antrian untuk dicetak ulang.",
  "data": {
    "do_id": "DO-20251219-XXXX",
    "status": "Cancelled",
    "cancelled_at": "2025-12-19T21:48:00Z",
    "cancellation_reason": "Salah cetak tanggal pengiriman",
    "reset_job_orders": ["JO-20251219-001"],
    "recalculated_manifest": {
      "manifest_id": "MF-20251219-XXXX",
      "status": "Cancelled",
      "active_jobs": 0,
      "total_weight": 0,
      "total_koli": 0
    }
  }
}
```

**Guard Validasi:**
🛑 DILARANG Cancel DO yang sudah berstatus "In Transit", "Delivered", atau "Completed"

---

## 3. Database Changes

Migration menambahkan kolom berikut ke tabel:

### job_orders
- `cancelled_at` (datetime, nullable)
- `cancellation_reason` (string, nullable)

### manifests
- `cancelled_at` (datetime, nullable)
- `cancellation_reason` (string, nullable)

### delivery_orders
- `cancelled_at` (datetime, nullable)
- `cancellation_reason` (string, nullable)

---

## 5. Troubleshooting

### Driver/Armada Masih Muncul Setelah Cancel
**Penyebab**: Frontend mengambil data dari `assignments[0]` sebagai fallback, yang mungkin berisi assignment yang sudah `Cancelled`.

**Solusi**: Frontend sekarang HANYA mengambil assignment dengan status `Active`. Jika tidak ada Active assignment, tampilkan `-`.

**Files yang diperbaiki**:
- `resources/js/features/orders/components/JobOrder.jsx` - `mapJobOrderToRecord()`
- `resources/js/features/orders/components/JobOrderDetail.jsx` - `loadJobOrder()`
- `resources/js/features/manifests/components/Manifest.jsx` - `availableDrivers`, `availableVehicles`, `calculateCombinedData()`

### Delivery Order Tidak Ter-cancel saat Cancel Manifest
**Penyebab**: Query hanya mencari DO dengan `source_type = 'MF'`, tapi tidak mencari DO dengan `source_type = 'JO'` dimana Job Order-nya ada dalam Manifest yang dibatalkan.

**Solusi (2025-12-20)**: Backend sekarang mencari DO dalam 3 cara:
1. `source_type = 'MF' AND source_id = manifestId`
2. `source_type = 'MF' AND selected_job_order_id IN (job_order_ids dari manifest)`
3. ✅ **NEW**: `source_type = 'JO' AND source_id IN (job_order_ids dari manifest)` - untuk kasus FTL dimana DO dibuat dari Job Order langsung

**Files yang diperbaiki**:
- `app/Http/Controllers/Api/ManifestController.php` - `cancel()` method

### Muatan Manifest Tidak Berkurang saat Cancel DO
**Penyebab**: Cancel DO hanya melakukan re-calculate berdasarkan status Job Order, tapi TIDAK men-detach Job Order dari Manifest.

**Solusi (2025-12-20)**: Backend sekarang DETACH Job Order dari Manifest ketika DO dibatalkan, lalu re-calculate cargo:
1. Detach Job Order terkait (`selected_job_order_id`) dari pivot table `manifest_jobs`
2. Re-calculate `cargo_weight` dan `cargo_summary` dari remaining Job Orders

**Files yang diperbaiki**:
- `app/Http/Controllers/Api/DeliveryOrderController.php` - `cancel()` method

### Driver Masih Menempel di Manifest setelah Cancel Job Order
**Penyebab**: Cancel Job Order men-detach JO dari Manifest dan re-calculate cargo, tapi TIDAK me-NULL-kan `driver_id` dan `vehicle_id` di Manifest. Akibatnya:
1. Driver tetap dianggap "sibuk" dan tidak tersedia untuk Manifest lain
2. Manifest menampilkan data driver padahal muatannya sudah 0 kg

**Solusi (2025-12-20)**: 
- Backend sekarang **TIDAK men-detach Job Order** dari Manifest saat cancel
- Job Order tetap terikat ke Manifest untuk keperluan audit trail
- Cargo dihitung **HANYA dari Job Order AKTIF** (bukan Cancelled)
- Jika `activeJobs.count() === 0` → Set `driver_id = NULL` dan `vehicle_id = NULL`
- Driver dan Vehicle kembali tersedia untuk ditugaskan ke Manifest lain

**Files yang diperbaiki**:
- `app/Http/Controllers/Api/JobOrderController.php` - `cancel()` method

### Berat & Koli Manifest Menjadi 0 kg setelah Cancel Job Order
**Penyebab**: Frontend menggunakan `manifest.cargo_weight` dari database yang sudah diupdate menjadi 0, padahal Job Order masih ada di Manifest.

**Solusi (2025-12-20)**: 
- Frontend sekarang menghitung berat & koli **langsung dari Job Orders yang AKTIF**
- Filter `jobOrders.filter(jo => jo.status !== 'Cancelled')` sebelum kalkulasi
- `totalWeight` dan `totalPackages` dihitung dari SEMUA jobOrders (termasuk Cancelled)
- Fallback ke `manifest.cargo_weight` jika tidak ada jobOrders (backward compatibility)

**Files yang diperbaiki**:
- `resources/js/features/manifests/components/Manifest.jsx` - `mapManifestFromApi()`

### Observer untuk Auto-Recalculate (BARU)
**Implementasi Observer** pada model JobOrder untuk memastikan Manifest cargo selalu ter-update ketika Job Order berubah.

**Cara Kerja**:
- Setiap kali Job Order di-update (status, berat, koli, dll), Observer akan:
  1. Mencari semua Manifest yang terkait dengan Job Order
  2. Recalculate `cargo_weight` dan `cargo_summary` dari SEMUA Job Order (termasuk Cancelled)
  3. Jika tidak ada Job Order aktif, kosongkan `driver_id` dan `vehicle_id`

**Files yang ditambahkan**:
- `app/Observers/JobOrderObserver.php` - Observer class
- `app/Models/JobOrder.php` - Registered Observer di `booted()` method

### Artisan Commands untuk Perbaikan Data
Untuk memperbaiki data Manifest yang sudah ada:

```bash
# Recalculate cargo dari semua Manifest
php artisan manifest:recalculate-cargo

# Cek dulu tanpa membuat perubahan
php artisan manifest:recalculate-cargo --dry-run

# Untuk manifest tertentu saja
php artisan manifest:recalculate-cargo --manifest=MF-20251220-AAJKSV

# Re-attach Job Order yang ter-detach (berdasarkan kecocokan rute)
php artisan manifest:reattach-jobs --dry-run
php artisan manifest:reattach-jobs
```

**Files yang ditambahkan**:
- `app/Console/Commands/RecalculateManifestCargo.php`
- `app/Console/Commands/ReattachCancelledJobOrders.php`

### Berat & Koli Manifest Masih Ada Setelah Cancel Manifest
**Penyebab**: Backend sudah meng-update `cargo_weight = 0` dan `cargo_summary = '0 packages'`, tapi Frontend menggunakan fallback ke `manifest.cargo_weight` dari database yang mungkin falsy (karena 0) atau menggunakan kalkulasi dari jobOrders.

**Solusi (2025-12-21)**: 
- Frontend sekarang mendeteksi status `Cancelled` dan langsung menampilkan **0 kg, 0 koli, 0 packages**
- Variabel `isCancelled` di-check sebelum kalkulasi cargo:
  ```javascript
  const isCancelled = manifest.status?.toLowerCase() === 'cancelled';
  const totalPackages = isCancelled ? 0 : jobOrders.reduce(...);
  const totalWeight = isCancelled ? 0 : jobOrders.reduce(...);
  const cargoSummary = isCancelled ? '0 packages' : ...;
  ```
- Fix falsy check untuk `cargo_weight = 0` dengan menggunakan `!== null && !== undefined` instead of truthy check

**Files yang diperbaiki**:
- `resources/js/features/manifests/components/Manifest.jsx` - `mapManifestFromApi()`

**Catatan Penting**: 
- Driver & Armada tetap ditampilkan pada Cancelled Manifest untuk keperluan audit
- Hanya data cargo (Berat, Koli, Packages) yang di-reset ke 0

### Manifest Tidak Berkurang Berat/Koli Setelah Cancel Job Order (BARU 2025-12-22)
**Penyebab**: Frontend menghitung berat & koli dari SEMUA `jobOrders` array (termasuk yang Cancelled), sehingga meskipun satu JO dibatalkan, total Manifest tetap sama.

**Solusi (2025-12-22)**:
- Frontend sekarang FILTER Job Order yang aktif terlebih dahulu sebelum kalkulasi:
  ```javascript
  const activeJobOrders = jobOrders.filter(jo => jo.status !== 'Cancelled');
  const totalWeight = isCancelled ? 0 : activeJobOrders.reduce(...);
  const totalPackages = isCancelled ? 0 : activeJobOrders.reduce(...);
  ```
- Manifest AKTIF menampilkan total dari JO AKTIF saja (bukan semua JO)
- Manifest CANCELLED tetap menampilkan 0

**Files yang diperbaiki**:
- `resources/js/features/manifests/components/Manifest.jsx` - `mapManifestFromApi()`

### Delivery Order Cancelled Masih Menampilkan Data Cargo (BARU 2025-12-22)
**Penyebab**: `mapDeliveryOrderFromApi` tidak mengecek status Cancelled dan tetap menampilkan weight, qty, volume, goods_desc dari `source_info`.

**Solusi (2025-12-22)**:
- Frontend sekarang mengecek `isCancelled` dan mengosongkan data cargo untuk DO yang dibatalkan:
  ```javascript
  const isCancelled = status === 'cancelled';
  const weight = isCancelled ? '-' : (sourceInfo.goods_weight ?? ...);
  const qty = isCancelled ? '-' : (sourceInfo.koli ?? ...);
  const volume = isCancelled ? '-' : (sourceInfo.goods_volume ?? ...);
  const goodsDesc = isCancelled ? '-' : (deliveryOrder.goods_summary || ...);
  const eta = isCancelled ? '-' : ...;
  ```
- Driver & Armada **TETAP ditampilkan** untuk keperluan audit (tidak berubah jadi "Belum ditugaskan")

**Files yang diperbaiki**:
- `resources/js/features/orders/components/DeliveryOrder.jsx` - `mapDeliveryOrderFromApi()`

### Manifest Status Tidak Berubah ke Cancelled Ketika Satu-satunya JO Dibatalkan (BARU 2025-12-22)
**Penyebab**: Backend hanya menghapus driver/vehicle dari Manifest ketika `activeJobs.count() === 0`, tapi tidak mengubah status Manifest ke "Cancelled".

**Solusi (2025-12-22)**:
- Backend sekarang mengubah status Manifest ke "Cancelled" ketika tidak ada JO aktif tersisa:
  ```php
  if ($activeJobs->count() === 0) {
      $manifest->update([
          'status' => 'Cancelled',
          'cancelled_at' => now(),
          'cancellation_reason' => "Semua Job Order dalam Manifest ini sudah dibatalkan",
          'cargo_weight' => 0,
          'cargo_summary' => '0 packages',
          'driver_id' => null,
          'vehicle_id' => null
      ]);
  }
  ```

**Files yang diperbaiki**:
- `app/Http/Controllers/Api/JobOrderController.php` - `cancel()` method

### Driver/Armada di DO Cancelled Menampilkan "Belum ditugaskan" (BARU 2025-12-22)
**Penyebab**: Accessor `getDriverNameAttribute()` dan `getVehiclePlateAttribute()` hanya mencari assignment dengan status `Active`. Ketika JO dibatalkan, assignment berubah ke `Cancelled`, sehingga accessor tidak menemukan data.

**Solusi (2025-12-22)**:
- Accessor sekarang juga mencari assignment dengan status `Cancelled` atau `Inactive` untuk keperluan audit:
  ```php
  // First try Active
  $assignment = $this->jobOrder->assignments()
      ->where('status', 'Active')
      ->first();
  
  // If not found, look for cancelled/inactive (for audit)
  if (!$assignment) {
      $assignment = $this->jobOrder->assignments()
          ->whereIn('status', ['Cancelled', 'Inactive'])
          ->orderBy('assigned_at', 'desc')
          ->first();
  }
  ```

**Files yang diperbaiki**:
- `app/Models/DeliveryOrder.php` - `getDriverNameAttribute()` dan `getVehiclePlateAttribute()`

---

## 6. Kesimpulan

- **Cancel JO** = Mematikan Order (Stop Proses) - Job Order tetap terikat ke Manifest untuk audit
  - **Manifest CANCELLED** jika itu adalah satu-satunya JO (tidak ada JO aktif lain)
  - **Manifest TETAP** jika masih ada JO aktif lain (hanya cargo yang berkurang)
- **Cancel Manifest/DO** = Mereset Order (Mundur satu langkah untuk diperbaiki/dijadwalkan ulang)
- **Manifest CANCELLED** = Menampilkan **0 Koli, 0 Berat, 0 Packages** (Truk kosong)
  - Driver & Armada dilepas (tersedia untuk Manifest lain)
- **Manifest AKTIF (dengan JO Cancelled)** = Menampilkan total berat dari **JO AKTIF saja** (berkurang sesuai JO yang dibatalkan)
- **Delivery Order CANCELLED** = Menampilkan **- (dash)** untuk Koli, Berat, Volume, Barang, ETA
  - Driver & Armada **TETAP ditampilkan** untuk keperluan audit riwayat

**Catatan Penting**:
- Untuk data lama dimana Job Order sudah ter-detach dari Manifest, gunakan Edit Manifest untuk re-attach Job Order
- Jalankan `php artisan manifest:recalculate-cargo` setelah perbaikan data

Gunakan logika ini, maka data di sistem akan rapi dan sesuai dengan operasional logistik dunia nyata! 🚀
