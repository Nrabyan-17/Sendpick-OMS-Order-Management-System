# 📱 SendPick Driver Mobile App - API Documentation

**Base URL:** `https://your-domain.com/api/driver`

---

## 🔐 Authentication

Semua endpoint (kecuali Login) memerlukan **Bearer Token** di header request.

```
Authorization: Bearer <token>
```

Token didapatkan dari response login dan berlaku selama **1 tahun**.

---

## 📋 Daftar Endpoint

### 🔐 Authentication & Profile

| No | Method | Endpoint | Deskripsi |
|----|--------|----------|-----------|
| 1 | `POST` | `/login` | Login driver |
| 2 | `POST` | `/logout` | Logout driver |
| 3 | `GET` | `/profile` | Get profil driver |

### 👤 Driver Management

| No | Method | Endpoint | Deskripsi |
|----|--------|----------|-----------|
| 4 | `PUT` | `/status` | Update status driver |
| 5 | `PUT` | `/fcm-token` | Update FCM Token (Push Notification) |

### 📦 Job Order

| No | Method | Endpoint | Deskripsi |
|----|--------|----------|-----------|
| 6 | `GET` | `/jobs` | Get daftar job orders |
| 7 | `GET` | `/jobs/{jobOrderId}` | Get detail job order |
| 8 | `POST` | `/jobs/{jobOrderId}/accept` | Terima order |
| 9 | `POST` | `/jobs/{jobOrderId}/reject` | Tolak order |
| 10 | `PUT` | `/jobs/{jobOrderId}/status` | Update status job |

### 📸 POD & QR Code

| No | Method | Endpoint | Deskripsi |
|----|--------|----------|-----------|
| 11 | `POST` | `/jobs/{jobOrderId}/pod` | Upload Proof of Delivery |
| 12 | `POST` | `/scan-qr` | Scan QR Code |

### 📍 GPS & History

| No | Method | Endpoint | Deskripsi |
|----|--------|----------|-----------|
| 13 | `POST` | `/gps/bulk` | Kirim data GPS batch |
| 14 | `GET` | `/history` | Get riwayat order |
| 15 | `GET` | `/history/stats` | Get statistik driver |

### 🚗 Vehicle

| No | Method | Endpoint | Deskripsi |
|----|--------|----------|-----------|
| 16 | `GET` | `/vehicles/available` | Get daftar kendaraan tersedia |
| 17 | `POST` | `/vehicles/select` | Pilih kendaraan |
| 18 | `GET` | `/vehicles/{vehicleId}/check` | Cek ketersediaan kendaraan |

---

## 1️⃣ Login

Autentikasi driver untuk mendapatkan access token.

**Request:**

```http
POST /api/driver/login
Content-Type: application/json
```

**Body:**

```json
{
  "email": "driver@example.com",
  "password": "password123"
}
```

**Response Success (200):**

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "driver": {
      "driver_id": "DRV-001",
      "driver_name": "Ahmad Supardi",
      "email": "ahmad@example.com",
      "phone": "+6281234567890",
      "status": "Available",
      "shift": "Pagi"
    },
    "token": "1|abc123xyz...",
    "token_type": "Bearer"
  }
}
```

**Response Error:**

| Status Code | Response |
|-------------|----------|
| 401 | `{"success": false, "message": "Email atau password salah"}` |
| 403 | `{"success": false, "message": "Akun Anda tidak aktif. Silakan hubungi admin."}` |

---

## 2️⃣ Logout

Menghapus token autentikasi driver.

**Request:**

```http
POST /api/driver/logout
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

## 3️⃣ Get Profile

Mendapatkan data profil driver yang sedang login beserta statistik.

**Request:**

```http
GET /api/driver/profile
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "driver_id": "DRV-001",
    "driver_name": "Ahmad Supardi",
    "email": "ahmad@example.com",
    "phone": "+6281234567890",
    "status": "Available",
    "shift": "Pagi",
    "last_lat": -6.2088,
    "last_lng": 106.8456,
    "statistics": {
      "total_orders": 247,
      "total_delivered": 245,
      "total_distance_km": 1250.50
    }
  }
}
```

---

## 4️⃣ Update Status Driver

Mengubah status ketersediaan driver (online/offline).

**Request:**

```http
PUT /api/driver/status
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "status": "Available"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| status | string | ✅ | `Available`, `On Duty`, `Off Duty`, `Tidak Aktif` |

**Response Success (200):**

```json
{
  "success": true,
  "message": "Status driver berhasil diubah",
  "data": {
    "driver_id": "DRV-001",
    "status": "Available"
  }
}
```

---

## 5️⃣ Get Jobs

Mendapatkan daftar order aktif dan order pending yang tersedia.

**Request:**

```http
GET /api/driver/jobs
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "active_orders": [
      {
        "job_order_id": "JO-2024-0001",
        "customer_name": "PT ABC Indonesia",
        "pickup_address": "Jl. Sudirman No. 10, Jakarta",
        "delivery_address": "Jl. Gatot Subroto No. 25, Jakarta",
        "goods_desc": "Paket Dokumen",
        "goods_weight": 2.5,
        "ship_date": "2024-12-14",
        "status": "Processing",
        "order_type": "Reguler",
        "assignment_status": "Active"
      }
    ],
    "pending_orders": [
      {
        "job_order_id": "JO-2024-0002",
        "customer_name": "CV Maju Jaya",
        "pickup_address": "Jl. Kemang Raya No. 5",
        "delivery_address": "Jl. TB Simatupang No. 88",
        "goods_desc": "Elektronik",
        "goods_weight": 10,
        "ship_date": "2024-12-14",
        "order_type": "Express"
      }
    ]
  }
}
```

**Catatan Status Order:**

| Status | Deskripsi |
|--------|-----------|
| Processing | Order sedang diproses/diambil |
| In Transit | Barang sedang dalam perjalanan |
| Pickup Complete | Barang sudah diambil |
| Nearby | Driver sudah dekat/sampai di lokasi tujuan |
| Delivered | Pengiriman selesai |

---

## 6️⃣ Get Job Details

Mendapatkan detail lengkap dari satu job order.

**Request:**

```http
GET /api/driver/jobs/{jobOrderId}
Authorization: Bearer <token>
```

**Path Parameter:**

| Parameter | Type | Deskripsi |
|-----------|------|-----------|
| jobOrderId | string | ID Job Order (contoh: JO-2024-0001) |

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "job_order": {
      "job_order_id": "JO-2024-0001",
      "customer_name": "PT ABC Indonesia",
      "customer_phone": "+6281234567890",
      "delivery_address": "Jl. Gatot Subroto No. 25, Jakarta",
      "delivery_city": "Jakarta",
      "delivery_lat": -6.2088,
      "delivery_lng": 106.8456,
      "recipient_name": "Siti",
      "recipient_phone": "081234567890",
      "goods_desc": "Paket Dokumen",
      "goods_qty": 5,
      "goods_weight": 2.5,
      "goods_volume": 0.5,
      "ship_date": "2024-12-14",
      "delivery_date": "2024-12-14",
      "status": "Processing",
      "order_type": "Reguler",
      "special_instruction": "Barang pecah belah, hati-hati saat handling"
    },
    "assignment": {
      "assignment_id": 1,
      "status": "Active",
      "assigned_at": "2024-12-14T10:00:00.000000Z"
    },
    "delivery_order": {
      "do_id": "DO-2024-0001",
      "status": "Assigned",
      "delivery_location": "Jl. Gatot Subroto No. 25",
      "goods_summary": "Paket Dokumen - 2.5 kg"
    },
    "proof_of_delivery": null
  }
}
```

**Response Error (404):**

```json
{
  "success": false,
  "message": "Job order tidak ditemukan"
}
```

---

## 7️⃣ Accept Order

Driver menerima order pending.

**Request:**

```http
POST /api/driver/jobs/{jobOrderId}/accept
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (Optional):**

```json
{
  "vehicle_id": "VH-001"
}
```

| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| vehicle_id | string | ❌ | ID kendaraan (bisa diisi nanti) |

**Response Success (200):**

```json
{
  "success": true,
  "message": "Order berhasil diterima",
  "data": {
    "job_order_id": "JO-2024-0002",
    "assignment_id": 5
  }
}
```

**Response Error:**

| Status | Response |
|--------|----------|
| 404 | `{"success": false, "message": "Job order tidak ditemukan atau sudah tidak tersedia"}` |
| 422 | `{"success": false, "message": "Anda sudah memiliki 5 order aktif. Selesaikan order terlebih dahulu."}` |
| 422 | `{"success": false, "message": "Kendaraan ini sedang digunakan untuk job order lain yang masih aktif."}` |

---

## 8️⃣ Reject Order

Driver menolak order pending.

**Request:**

```http
POST /api/driver/jobs/{jobOrderId}/reject
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (Optional):**

```json
{
  "reason": "Lokasi terlalu jauh"
}
```

| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| reason | string | ❌ | Alasan penolakan (max 500 karakter) |

**Response Success (200):**

```json
{
  "success": true,
  "message": "Order berhasil ditolak",
  "data": {
    "job_order_id": "JO-2024-0002",
    "reason": "Lokasi terlalu jauh"
  }
}
```

---

## 9️⃣ Update Job Status

Mengubah status order (pickup, on delivery, complete, dll).

**Request:**

```http
PUT /api/driver/jobs/{jobOrderId}/status
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "status": "In Transit",
  "notes": "Barang sudah diambil dari warehouse"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| status | string | ✅ | `Processing`, `In Transit`, `Pickup Complete`, `Nearby`, `Delivered` |
| notes | string | ❌ | Catatan tambahan (max 500 karakter) |

**Response Success (200):**

```json
{
  "success": true,
  "message": "Status order berhasil diubah",
  "data": {
    "job_order_id": "JO-2024-0001",
    "new_status": "In Transit"
  }
}
```

**Response Error (404):**

```json
{
  "success": false,
  "message": "Job order tidak ditemukan atau Anda tidak memiliki akses"
}
```

---

## 🔟 Upload Proof of Delivery (POD)

Upload foto dan/atau tanda tangan sebagai bukti pengiriman.

**Request:**

```http
POST /api/driver/jobs/{jobOrderId}/pod
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**

| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| recipient_name | string | ✅ | Nama penerima barang |
| photo | file (image) | ❌ | Foto barang/penerima (jpg, jpeg, png, max 5MB) |
| signature | file (image) | ❌ | Tanda tangan penerima (jpg, jpeg, png, max 2MB) |
| notes | string | ❌ | Catatan tambahan (max 500 karakter) |

**Response Success (201):**

```json
{
  "success": true,
  "message": "Proof of Delivery berhasil diupload",
  "data": {
    "pod_id": 123,
    "do_id": "DO-2024-0001",
    "photo_url": "/storage/pod/photos/abc123.jpg",
    "signature_url": "/storage/pod/signatures/xyz789.png"
  }
}
```

**Response Error:**

| Status | Response |
|--------|----------|
| 404 | `{"success": false, "message": "Delivery order tidak ditemukan"}` |
| 403 | `{"success": false, "message": "Anda tidak memiliki akses ke order ini"}` |

---

## 1️⃣1️⃣ Scan QR Code

Scan QR code untuk validasi dan update status otomatis.

**Request:**

```http
POST /api/driver/scan-qr
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "qr_code_string": "SPCK-JO-2024-0001-XYZ"
}
```

| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| qr_code_string | string | ✅ | String dari QR code yang di-scan |

**Response Success (200):**

```json
{
  "success": true,
  "message": "QR Code berhasil dipindai",
  "data": {
    "job_order_id": "JO-2024-0001",
    "previous_status": "Assigned",
    "new_status": "Pickup Complete",
    "customer_name": "PT ABC Indonesia",
    "goods_desc": "Paket Dokumen"
  }
}
```

**Auto Status Transition (QR Scan):**

| Current Status | New Status After Scan |
|----------------|----------------------|
| Assigned / Processing | Pickup Complete |
| In Transit | Nearby |
| Nearby | Delivered |

**Response Error:**

| Status | Response |
|--------|----------|
| 404 | `{"success": false, "message": "QR Code tidak valid atau order tidak ditemukan"}` |
| 403 | `{"success": false, "message": "Anda tidak memiliki akses ke order ini"}` |

---

## 1️⃣2️⃣ Bulk Store GPS

Kirim batch data GPS tracking dari mobile app.

**Request:**

```http
POST /api/driver/gps/bulk
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "locations": [
    {
      "lat": -6.2088,
      "lng": 106.8456,
      "sent_at": "2024-12-14T10:00:00.000Z",
      "order_id": "JO-2024-0001",
      "vehicle_id": "VH-001"
    },
    {
      "lat": -6.2090,
      "lng": 106.8460,
      "sent_at": "2024-12-14T10:00:30.000Z",
      "order_id": "JO-2024-0001",
      "vehicle_id": "VH-001"
    }
  ]
}
```

| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| locations | array | ✅ | Array minimal 1 lokasi |
| locations[].lat | number | ✅ | Latitude (-90 - 90) |
| locations[].lng | number | ✅ | Longitude (-180 - 180) |
| locations[].sent_at | datetime | ✅ | Waktu pengambilan GPS |
| locations[].order_id | string | ❌ | ID Job Order terkait |
| locations[].vehicle_id | string | ❌ | ID Kendaraan |

**Response Success (201):**

```json
{
  "success": true,
  "message": "2 GPS points berhasil disimpan",
  "data": {
    "total_points": 2
  }
}
```

---

## 1️⃣3️⃣ Get Job History

Mendapatkan riwayat order yang sudah selesai.

**Request:**

```http
GET /api/driver/history
Authorization: Bearer <token>
```

**Query Parameters (Optional):**

| Parameter | Type | Default | Deskripsi |
|-----------|------|---------|-----------|
| start_date | date | 30 hari lalu | Tanggal awal filter |
| end_date | date | Hari ini | Tanggal akhir filter |

**Contoh:**

```
GET /api/driver/history?start_date=2024-12-01&end_date=2024-12-14
```

**Response Success (200):**

```json
{
  "success": true,
  "data": [
    {
      "job_order_id": "JO-2024-0001",
      "customer_name": "PT ABC Indonesia",
      "delivery_address": "Jl. Gatot Subroto No. 25, Jakarta",
      "goods_desc": "Paket Dokumen",
      "goods_weight": 2.5,
      "status": "Delivered",
      "completed_at": "2024-12-14T15:30:00.000000Z"
    }
  ]
}
```

---

## 1️⃣4️⃣ Get History Stats

Mendapatkan statistik/KPI driver.

**Request:**

```http
GET /api/driver/history/stats
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "total_delivered": 210,
    "total_weight_kg": 1430.5,
    "total_distance_km": 1250.00,
    "completed_this_month": 45,
    "avg_delivery_time_hours": 4.5
  }
}
```

| Field | Deskripsi |
|-------|-----------|
| total_delivered | Total order yang sudah dikirim |
| total_weight_kg | Total berat barang yang dikirim (kg) |
| total_distance_km | Estimasi jarak tempuh (km) |
| completed_this_month | Order selesai bulan ini |
| avg_delivery_time_hours | Rata-rata waktu pengiriman (jam) |

---

## 1️⃣5️⃣ Update FCM Token

Menyimpan token Firebase Cloud Messaging untuk push notification.

**Request:**

```http
PUT /api/driver/fcm-token
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "fcm_token": "fMjLz9_abc123...your_firebase_token"
}
```

| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| fcm_token | string | ✅ | Token FCM dari Firebase (max 500 karakter) |

**Response Success (200):**

```json
{
  "success": true,
  "message": "FCM token berhasil disimpan",
  "data": {
    "driver_id": "DRV-001"
  }
}
```

---

## 1️⃣6️⃣ Get Available Vehicles

Mendapatkan daftar kendaraan yang tersedia untuk dipilih driver setelah login.

**Request:**

```http
GET /api/driver/vehicles/available
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "success": true,
  "data": [
    {
      "vehicle_id": "VH-001",
      "plate_no": "B 1234 ABC",
      "brand": "Hino",
      "model": "Dutro 130 HD",
      "vehicle_type": "Truck Box",
      "capacity": "3 Ton",
      "status": "Available",
      "is_selected": false
    },
    {
      "vehicle_id": "VH-002",
      "plate_no": "B 5678 XYZ",
      "brand": "Isuzu",
      "model": "NMR 71 HD",
      "vehicle_type": "Truck Engkel",
      "capacity": "4 Ton",
      "status": "In Use",
      "is_selected": true
    }
  ]
}
```

| Field | Type | Deskripsi |
|-------|------|-----------|
| is_selected | boolean | `true` jika kendaraan ini sudah dipilih oleh driver yang sedang login |

---

## 1️⃣7️⃣ Select Vehicle

Driver memilih kendaraan yang akan digunakan setelah login. Satu driver hanya bisa memilih 1 kendaraan pada satu waktu.

**Request:**

```http
POST /api/driver/vehicles/select
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "vehicle_id": "VH-001"
}
```

| Field | Type | Required | Deskripsi |
|-------|------|----------|-----------|
| vehicle_id | string | ✅ | ID Kendaraan yang dipilih |

**Response Success (200):**

```json
{
  "success": true,
  "message": "Kendaraan berhasil dipilih",
  "data": {
    "vehicle_id": "VH-001",
    "plate_no": "B 1234 ABC",
    "brand": "Hino",
    "model": "Dutro 130 HD",
    "vehicle_type": "Truck Box",
    "status": "In Use"
  }
}
```

**Response Error - Kendaraan Digunakan Driver Lain (422):**

```json
{
  "success": false,
  "message": "Kendaraan ini sedang digunakan oleh driver lain: Ahmad Santoso"
}
```

**Response Error - Kendaraan Tidak Tersedia (422):**

```json
{
  "success": false,
  "message": "Kendaraan tidak tersedia. Status: Maintenance"
}
```

---

## 1️⃣8️⃣ Check Vehicle Availability

Mengecek apakah kendaraan tersedia atau sedang digunakan untuk job lain.

**Request:**

```http
GET /api/driver/vehicles/{vehicleId}/check
Authorization: Bearer <token>
```

| Parameter | Type | Deskripsi |
|-----------|------|-----------|
| vehicleId | string | ID Kendaraan yang ingin dicek |

**Response Success - Kendaraan Tersedia (200):**

```json
{
  "success": true,
  "data": {
    "vehicle_id": "VH-001",
    "license_plate": "B 1234 ABC",
    "is_available": true,
    "status": "Available",
    "current_driver": null,
    "current_job_order": null
  }
}
```

**Response Success - Kendaraan Sedang Digunakan (200):**

```json
{
  "success": true,
  "data": {
    "vehicle_id": "VH-001",
    "license_plate": "B 1234 ABC",
    "is_available": false,
    "status": "In Use",
    "current_driver": {
      "driver_id": "DRV-002",
      "driver_name": "Budi Santoso"
    },
    "current_job_order": {
      "job_order_id": "JO-2024-0005",
      "status": "In Transit"
    }
  }
}
```

**Response Error (404):**

```json
{
  "success": false,
  "message": "Kendaraan tidak ditemukan"
}
```

---

## ⚠️ Error Response Format

Semua endpoint menggunakan format error response yang konsisten:

```json
{
  "success": false,
  "message": "Deskripsi error"
}
```

### HTTP Status Codes

| Code | Deskripsi |
|------|-----------|
| 200 | Success |
| 201 | Created (untuk resource baru) |
| 400 | Bad Request |
| 401 | Unauthorized (token tidak valid/expired) |
| 403 | Forbidden (tidak punya akses) |
| 404 | Not Found |
| 422 | Unprocessable Entity (validasi gagal) |
| 500 | Internal Server Error |

---

## 📌 Status Driver

| Status | Deskripsi | Dikontrol Oleh |
|--------|-----------|----------------|
| Available | Driver tersedia menerima order | 🟢 Driver (Toggle di Mobile App) |
| On Duty | Driver sedang mengerjakan order | 🔵 Sistem (Otomatis saat ada job aktif) |
| Off Duty | Driver sedang tidak bertugas/offline | 🟢 Driver (Toggle di Mobile App) |
| Tidak Aktif | Akun driver non-aktif (tidak bisa login) | 🔴 Admin (Dashboard) |

### Catatan Kontrol Status:

1. **Driver melalui Mobile App:**
   - Toggle ON → Status menjadi `Available`
   - Toggle OFF → Status menjadi `Off Duty`

2. **Sistem Otomatis:**
   - Saat driver menerima job order → Status menjadi `On Duty`
   - Saat job order selesai/dibatalkan → Status kembali ke `Available`

3. **Admin melalui Dashboard:**
   - Admin hanya bisa mengubah status ke `Off Duty` atau `Tidak Aktif`
   - `Available` dan `On Duty` tidak bisa diubah oleh admin

---

## 📌 Status Job Order

| Status | Deskripsi |
|--------|-----------|
| Pending | Order baru, belum ada driver |
| Assigned | Sudah di-assign ke driver |
| Processing | Driver sedang proses pickup |
| Pickup Complete | Barang sudah diambil |
| In Transit | Dalam perjalanan ke tujuan |
| Nearby | Driver sudah dekat/sampai di lokasi tujuan |
| Delivered | Pengiriman selesai |
| Cancelled | Order dibatalkan |

---

## 💡 Tips Implementasi

1. **Token Storage:** Simpan token di secure storage (Keychain iOS / EncryptedSharedPreferences Android)
2. **GPS Tracking:** Kirim data GPS dalam batch setiap 30 detik untuk menghemat bandwidth
3. **Offline Mode:** Simpan data GPS secara lokal dan sync saat online
4. **QR Scanner:** Gunakan library camera native untuk performa optimal
5. **Image Compression:** Kompres foto POD sebelum upload (max 1MB recommended)
6. **FCM Token:** Simpan dan update FCM token setiap kali app dibuka untuk push notification

---

## 📝 Catatan Perubahan (Changelog)

### v2.1 (4 Januari 2026)

**Perubahan API:**
- ❌ Menghapus field `pickup_address`, `pickup_contact`, `pickup_location` dari response (model Delivery Only)
- ✅ Menambahkan field `delivery_city`, `delivery_lat`, `delivery_lng`, `recipient_name`, `recipient_phone`, `goods_qty` ke response job details
- 🔄 Update kontrol status driver: `Available`/`Off Duty` dikontrol driver, `On Duty` otomatis sistem, `Tidak Aktif` oleh admin

**Endpoint Baru:**
- ✅ `GET /vehicles/available` - Mendapatkan daftar kendaraan yang tersedia untuk dipilih driver
- ✅ `POST /vehicles/select` - Driver memilih kendaraan setelah login

**Perubahan Dashboard Admin:**
- ❌ Menghapus field vehicle dari form assignment Job Order dan Manifest (driver pilih sendiri via mobile app)

---

### v2.0 (17 Desember 2024)

**Perubahan API:**
- ❌ Menghapus `qr_code_string` dari response `GET /jobs` (active_orders & pending_orders)
- ❌ Menghapus `delivery_contact` dari response `GET /jobs/{jobOrderId}`
- ❌ Menghapus `qr_code_string` dari response `GET /jobs/{jobOrderId}`
- 🔄 Mengganti status `At Destination` menjadi `Nearby`
- ✅ Menambahkan validasi kendaraan di `POST /jobs/{id}/accept` (cek apakah sedang dipakai)

**Endpoint Baru:**
- ✅ `PUT /fcm-token` - Menyimpan FCM Token untuk push notification
- ✅ `GET /vehicles/{vehicleId}/check` - Mengecek ketersediaan kendaraan

**Database:**
- ✅ Menambahkan kolom `fcm_token` ke tabel `drivers`

---
