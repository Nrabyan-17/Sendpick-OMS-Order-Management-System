# 💻 SendPick Web Dashboard - API Documentation

Base URL: `https://your-domain.com/api`

## 🔐 Authentication

Semua endpoint (kecuali Login) memerlukan **Bearer Token** di header request.

`Authorization: Bearer <token>`

---

## 📋 Daftar Endpoint

| No | Method | Endpoint | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Auth** | | | |
| 1 | POST | `/auth/login` | Login admin/user |
| 2 | POST | `/auth/logout` | Logout |
| 3 | GET | `/auth/saya` | Get profil user login |
| 4 | GET | `/profile` | Get detail profile saya |
| 5 | PUT | `/profile` | Update profile saya |
| **Dashboard** | | | |
| 6 | GET | `/dashboard` | Get statistik dashboard utama |
| **Job Orders** | | | |
| 7 | GET | `/job-orders` | Get daftar job order |
| 8 | POST | `/job-orders` | Buat job order baru |
| 9 | GET | `/job-orders/{id}` | Get detail job order |
| 10 | POST | `/job-orders/{id}/assignments` | Assign driver & kendaraan |
| 11 | GET | `/job-orders/{id}/assignments` | Get assignment history dari JO |
| 12 | POST | `/job-orders/{id}/cancel` | Batalkan job order |
| **Manifests** | | | |
| 13 | GET | `/manifests` | Get daftar manifest |
| 14 | POST | `/manifests` | Buat manifest baru |
| 15 | GET | `/manifests/{id}/available-job-orders` | Get JO yang available untuk manifest ini |
| 16 | POST | `/manifests/{id}/add-job-orders` | Tambah job ke manifest |
| 17 | POST | `/manifests/{id}/remove-job-orders` | Hapus job dari manifest |
| 18 | PUT | `/manifests/{id}` | Update data manifest |
| 19 | PATCH | `/manifests/{id}/status` | Update status manifest |
| 20 | POST | `/manifests/{id}/cancel` | Batalkan manifest |
| **Delivery Orders** | | | |
| 21 | GET | `/delivery-orders` | Get daftar delivery order |
| 22 | POST | `/delivery-orders/{id}/assign-driver` | Assign driver ke DO (Direct) |
| 23 | POST | `/delivery-orders/{id}/complete` | Selesaikan delivery order |
| 24 | POST | `/delivery-orders/{id}/cancel` | Batalkan delivery order |
| **Invoices** | | | |
| 25 | GET | `/invoices` | Get daftar invoice |
| 26 | GET | `/invoices/stats` | Get statistik invoice |
| 27 | POST | `/invoices` | Buat invoice baru |
| 28 | PUT | `/invoices/{id}` | Update invoice |
| 29 | POST | `/invoices/{id}/record-payment` | Catat pembayaran |
| 30 | POST | `/invoices/{id}/cancel` | Batalkan invoice |
| 31 | GET | `/invoices/{id}/pdf` | Generate Invoice PDF |
| **GPS** | | | |
| 32 | GET | `/gps/current` | Get lokasi driver realtime |
| 33 | GET | `/gps/tracking-history` | Get history tracking |
| 34 | GET | `/gps/live/{doId}` | Get live tracking untuk DO tertentu |
| **Master Data: Customers** | | | |
| 35 | GET | `/customers` | List Customers |
| 36 | POST | `/customers` | Create Customer |
| 37 | GET | `/customers/{id}` | Detail Customer |
| 38 | PUT | `/customers/{id}` | Update Customer |
| 39 | DELETE | `/customers/{id}` | Delete Customer |
| **Master Data: Drivers** | | | |
| 40 | GET | `/drivers` | List Drivers |
| 41 | GET | `/drivers/available` | List Available Drivers |
| 42 | POST | `/drivers` | Create Driver |
| 43 | GET | `/drivers/{id}` | Detail Driver |
| 44 | PUT | `/drivers/{id}` | Update Driver |
| 45 | DELETE | `/drivers/{id}` | Delete Driver |
| **Master Data: Vehicles** | | | |
| 46 | GET | `/vehicles` | List Vehicles |
| 47 | GET | `/vehicles/active` | List Active Vehicles (Tracking) |
| 48 | GET | `/vehicles/available` | List Available Vehicles |
| 49 | POST | `/vehicles` | Create Vehicle |
| 50 | GET | `/vehicles/{id}` | Detail Vehicle |
| 51 | PUT | `/vehicles/{id}` | Update Vehicle |
| 52 | DELETE | `/vehicles/{id}` | Delete Vehicle |
| **Master Data: Vehicle Types** | | | |
| 53 | GET | `/vehicle-types` | List Tipe Kendaraan |
| 54 | GET | `/vehicle-types/active` | List Tipe Kendaraan Aktif (Simplified) |
| 55 | POST | `/vehicle-types` | Create Tipe Kendaraan |
| 56 | PUT | `/vehicle-types/{id}` | Update Tipe Kendaraan |
| 57 | DELETE | `/vehicle-types/{id}` | Delete Tipe Kendaraan |
| **Master Data: Admins & Roles** | | | |
| 58 | GET | `/admins` | List Admin Users |
| 59 | POST | `/admins` | Create Admin |
| 60 | PUT | `/admins/{id}` | Update Admin |
| 61 | DELETE | `/admins/{id}` | Delete Admin |
| 62 | GET | `/admins/roles` | List Roles for Assignment |
| **Reports** | | | |
| 63 | GET | `/reports/sales` | Get laporan penjualan |
| 64 | GET | `/reports/financial` | Get laporan keuangan |
| 65 | GET | `/reports/operational` | Get laporan operasional |

---

## 1️⃣ Login

**Kegunaan:**
Melakukan otentikasi user (Admin/Staff) untuk mendapatkan token akses.

**Request:**
`POST /api/auth/login`

**Body:**
```json
{
  "email": "admin@sendpick.com",
  "password": "password"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": { "id": 1, "name": "Super Admin", "email": "admin@sendpick.com", "role": "super_admin" },
    "token": "1|abc...",
    "token_type": "Bearer"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Email atau password salah"
}
```

---

## 2️⃣ Logout

**Kegunaan:**
Menghapus token akses user saat ini (keluar dari sistem).

**Request:**
`POST /api/auth/logout`

**Response Success:**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Token tidak valid"
}
```

---

## 3️⃣ Get Profile (Saya)

**Kegunaan:**
Mendapatkan informasi dasar user yang sedang login.

**Request:**
`GET /api/auth/saya`

**Response Success:**
```json
{
  "success": true,
  "data": { "id": 1, "name": "Admin", "email": "admin@example.com" }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Unauthenticated."
}
```

---

## 4️⃣ Get Profile Detail

**Kegunaan:**
Mendapatkan detail lengkap profil user yang sedang login.

**Request:**
`GET /api/profile`

**Response Success:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@sendpick.com",
    "role": "super_admin",
    "phone": "08123456789",
    "avatar_url": "..."
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Unauthenticated."
}
```

---

## 5️⃣ Update Profile

**Kegunaan:**
Memperbarui informasi profil user yang sedang login.

**Request:**
`PUT /api/profile`

**Body:**
```json
{
  "name": "Super Admin Baru",
  "email": "newemail@sendpick.com",
  "password": "newpassword123" // Optional
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "name": "Super Admin Baru",
    "email": "newemail@sendpick.com"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": { "email": ["Email has already been taken."] }
}
```

---

## 6️⃣ Dashboard Stats

**Kegunaan:**
Mendapatkan ringkasan statistik dan data grafik untuk halaman utama dashboard.

**Request:**
`GET /api/dashboard`

**Response Success:**
```json
{
  "success": true,
  "data": {
    "metric": {
      "total_delivered_orders_this_month": 15,
      "total_active_manifests": 3,
      "total_processed_orders": 8,
      "total_revenue_this_month": 45000000
    },
    "charts": {
      "revenue_trend": [100, 200, 150, 400],
      "order_volume": [10, 20, 15, 30]
    }
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## 7️⃣ Get Job Orders

**Kegunaan:**
Mendapatkan daftar Job Order dengan fitur paginasi, pencarian, dan filter status.

**Request:**
`GET /api/job-orders?page=1&status=Pending&search=keyword`

**Response Success:**
```json
{
  "success": true,
  "data": [
    {
      "job_order_id": "JO-2024-001",
      "customer_name": "PT Maju Jaya",
      "status": "Pending",
      "pickup_city": "Jakarta",
      "delivery_city": "Bandung",
      "created_at": "2024-12-20T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 50
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Data not found"
}
```

---

## 8️⃣ Create Job Order

**Kegunaan:**
Membuat Job Order baru.

**Request:**
`POST /api/job-orders`

**Body:**
```json
{
  "customer_id": 1,
  "order_type": "LTL",
  "pickup_address": "Jakarta",
  "delivery_address": "Bandung",
  "goods_desc": "Elektronik",
  "goods_weight": 100,
  "goods_volume": 1,
  "ship_date": "2024-12-20"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Job Order created successfully",
  "data": { 
    "job_order_id": "JO-2024-1220-ABCDE", 
    "status": "Pending" 
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": { "customer_id": ["The customer id field is required."] }
}
```

---

## 9️⃣ Get Job Order Detail

**Kegunaan:**
Mendapatkan detail lengkap dari satu Job Order tertentu.

**Request:**
`GET /api/job-orders/{id}`

**Response Success:**
```json
{
  "success": true,
  "data": {
      "job_order_id": "JO-2024-001",
      "customer_name": "PT Maju Jaya",
      "pickup_address": "Jl Sudirman No 1",
      "delivery_address": "Jl Asia Afrika No 2",
      "goods_desc": "Elektronik",
      "status": "Assigned",
      "assignments": [
        { "driver_name": "Budi", "vehicle": "B 1234 XX" }
      ]
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Job Order not found"
}
```

---

## 🔟 Assign Driver to Job Order

**Kegunaan:**
Menugaskan driver dan kendaraan ke sebuah Job Order (FTL) atau Assignment manual.

**Request:**
`POST /api/job-orders/{id}/assignments`

**Body:**
```json
{
  "driver_id": "DRV-001",
  "vehicle_id": "VH-001",
  "status": "Active",
  "notes": "Urgent"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "assignment_id": 10,
    "status": "Active"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Driver is currently assigned to another active job order"
}
```

---

## 1️⃣1️⃣ Get Assignment History

**Kegunaan:**
Melihat riwayat penugasan driver pada suatu Job Order.

**Request:**
`GET /api/job-orders/{id}/assignments`

**Response Success:**
```json
{
  "success": true,
  "data": [
    {
      "assignment_id": 1,
      "driver_name": "Budi",
      "vehicle_plate": "B 1234 XX",
      "status": "Cancelled",
      "assigned_at": "2024-12-20 10:00"
    }
  ]
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Job Order not found"
}
```

---

## 1️⃣2️⃣ Cancel Job Order

**Kegunaan:**
Membatalkan Job Order. Tidak bisa dilakukan jika Manifest terkait sudah 'In Transit'.

**Request:**
`POST /api/job-orders/{id}/cancel`

**Body:**
```json
{
  "reason": "Salah input data"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Job Order berhasil dibatalkan",
  "data": { 
    "status": "Cancelled",
    "cancellation_reason": "Salah input data" 
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Tidak dapat membatalkan Job Order karena Manifest sudah dalam status In Transit..."
}
```

---

## 1️⃣3️⃣ Get Manifests

**Kegunaan:**
Mendapatkan daftar Manifest.

**Request:**
`GET /api/manifests`

**Response Success:**
```json
{
  "success": true,
  "data": [
    {
      "manifest_id": "MNF-2024-001",
      "route": "Jakarta -> Surabaya",
      "status": "In Transit",
      "driver_name": "Budi",
      "cargo_weight": 2500
    }
  ]
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## 1️⃣4️⃣ Create Manifest

**Kegunaan:**
Membuat Manifest baru untuk konsolidasi pengiriman.

**Request:**
`POST /api/manifests`

**Body:**
```json
{
  "origin_city": "Jakarta",
  "dest_city": "Surabaya",
  "planned_departure": "2024-12-25 08:00",
  "driver_id": "DRV-001"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Manifest berhasil dibuat",
  "data": { "manifest_id": "MNF-2024-002" }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Validation Error"
}
```

---

## 1️⃣5️⃣ Add Jobs directly to Manifest

**Kegunaan:**
Menambahkan daftar Job Order ke dalam Manifest.

**Request:**
`POST /api/manifests/{id}/add-job-orders`

**Body:**
```json
{ "job_order_ids": ["JO-001", "JO-002"] }
```

**Response Success:**
```json
{
  "success": true,
  "message": "2 Job Orders added to manifest"
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Job Order JO-001 already assigned to another manifest"
}
```

---

## 1️⃣6️⃣ Update Manifest

**Kegunaan:**
Memperbarui data Manifest (Driver, Rute, dll).

**Request:**
`PUT /api/manifests/{id}`

**Body:**
```json
{
  "origin_city": "Jakarta",
  "dest_city": "Malang",
  "driver_id": "DRV-002"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Manifest updated successfully"
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Manifest not found"
}
```

---

## 1️⃣7️⃣ Update Manifest Status

**Kegunaan:**
Memperbarui status perjalanan manifest (Pending -> In Transit -> Arrived -> Completed).

**Request:**
`PATCH /api/manifests/{id}/status`

**Body:**
```json
{ "status": "In Transit" }
```

**Response Success:**
```json
{
  "success": true,
  "message": "Manifest status updated"
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Invalid status transition"
}
```

---

## 1️⃣8️⃣ Get Delivery Orders

**Kegunaan:**
Mendapatkan daftar Delivery Order.

**Request:**
`GET /api/delivery-orders`

**Response Success:**
```json
{
  "success": true,
  "data": [
    {
      "do_id": "DO-2024-001",
      "status": "Delivered",
      "recipient": "Pak Rudi"
    }
  ]
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Error fetching data"
}
```

---

## 1️⃣9️⃣ Assign Driver to Delivery Order

**Kegunaan:**
Khusus untuk DO Direct/Non-Manifest, menugaskan driver untuk pengiriman last-mile.

**Request:**
`POST /api/delivery-orders/{id}/assign-driver`

**Body:**
```json
{ "driver_id": "DRV-005", "vehicle_id": "VH-010" }
```

**Response Success:**
```json
{
  "success": true,
  "message": "Driver assigned to DO successfully"
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "DO not found"
}
```

---

## 2️⃣0️⃣ Complete Delivery Order

**Kegunaan:**
Menandai Delivery Order telah selesai (barang diterima & dokumen kembali).

**Request:**
`POST /api/delivery-orders/{id}/complete`

**Body:**
```json
{ "notes": "Diterima oleh Pak Satpam" }
```

**Response Success:**
```json
{
  "success": true,
  "message": "Delivery Order completed"
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "DO is not In Transit"
}
```

---

## 2️⃣1️⃣ Get Invoices

**Kegunaan:**
Mendapatkan daftar Invoice.

**Request:**
`GET /api/invoices`

**Response Success:**
```json
{
  "success": true,
  "data": [
    { "invoice_id": "INV-001", "amount": 1000000, "status": "Unpaid" }
  ]
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## 2️⃣2️⃣ Create Invoice

**Kegunaan:**
Membuat tagihan (invoice) dari Job Order yang sudah selesai.

**Request:**
`POST /api/invoices`

**Body:**
```json
{
  "customer_id": 1,
  "source_type": "job_order",
  "source_ids": ["JO-001"],
  "due_date": "2024-12-31"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": { "invoice_id": "INV-2024-005" }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Source IDs invalid"
}
```

---

## 2️⃣3️⃣ Record Payment

**Kegunaan:**
Mencatat pembayaran yang diterima untuk invoice tertentu.

**Request:**
`POST /api/invoices/{id}/record-payment`

**Body:**
```json
{ "amount_paid": 500000, "payment_method": "Transfer", "payment_date": "2024-12-21" }
```

**Response Success:**
```json
{
  "success": true,
  "message": "Payment recorded successfully"
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Amount exceeds remaining balance"
}
```

---

## 2️⃣4️⃣ GPS - Current Locations

**Kegunaan:**
Mendapatkan lokasi real-time semua driver yang aktif.

**Request:**
`GET /api/gps/current`

**Response Success:**
```json
{
  "success": true,
  "data": [
    { "driver_id": "DRV-001", "lat": -6.200, "lng": 106.816, "updated_at": "..." }
  ]
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "No active drivers found"
}
```

---

## 2️⃣5️⃣ GPS - Tracking History

**Kegunaan:**
Melihat riwayat perjalanan driver/truk pada tanggal tertentu.

**Request:**
`GET /api/gps/tracking-history?driver_id=DRV-001&date=2024-12-20`

**Response Success:**
```json
{
  "success": true,
  "data": [
    { "lat": -6.200, "lng": 106.816, "timestamp": "10:00:00" },
    { "lat": -6.201, "lng": 106.817, "timestamp": "10:05:00" }
  ]
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Data not available"
}
```

---

## 2️⃣6️⃣ Master Data: Customer List

**Kegunaan:**
Mendapatkan daftar semua customer.

**Request:**
`GET /api/customers`

**Response Success:**
```json
{
  "success": true,
  "data": [
    { "customer_id": 1, "customer_name": "PT ABC" }
  ]
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## 2️⃣7️⃣ Master Data: Create Customer

**Kegunaan:**
Menambahkan customer baru.

**Request:**
`POST /api/customers`

**Body:**
```json
{
  "customer_name": "PT ABC",
  "customer_code": "CUST-001",
  "phone": "021-123456",
  "email": "contact@abc.com",
  "address": "Jakarta"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Customer created successfully"
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Validation Error"
}
```

---

## 2️⃣8️⃣ Master Data: Driver List

**Kegunaan:**
Mendapatkan daftar semua driver.

**Request:**
`GET /api/drivers`

**Response Success:**
```json
{
  "success": true,
  "data": [
    { "driver_id": "DRV-001", "driver_name": "Suparman", "status": "Active" }
  ]
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## 2️⃣9️⃣ Master Data: Active Vehicles

**Kegunaan:**
Mendapatkan daftar kendaraan yang sedang beroperasi (aktif).

**Request:**
`GET /api/vehicles/active`

**Response Success:**
```json
{
  "success": true,
  "data": [
    { "vehicle_id": "VH-001", "plate_no": "B 1234 XX", "current_location": "Jakarta" }
  ]
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "No active vehicles"
}
```

---

## 3️⃣0️⃣ Reports: Sales

**Kegunaan:**
Mendapatkan laporan penjualan berdasarkan periode waktu.

**Request:**
`GET /api/reports/sales?start_date=2024-01-01&end_date=2024-01-31`

**Response Success:**
```json
{
  "success": true,
  "data": {
    "total_revenue": 150000000,
    "total_orders": 50
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Server Error"
}
```

