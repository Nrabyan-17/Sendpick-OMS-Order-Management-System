# 📋 Catatan Struktur Source Code - Folder API Controllers

## 🏗️ Arsitektur Umum Sistem SendPick

Sistem SendPick adalah aplikasi manajemen logistik dan pengiriman yang terdiri dari beberapa modul utama yang saling terhubung. Setiap controller mengelola domain bisnis tertentu dengan pola yang konsisten.

---

## 📁 Detail Controller dan Fungsinya

### 1. **AdminController.php** 👥
**Fungsi Utama**: Mengelola data Admin/Pengguna Sistem
- ✅ CRUD admin dengan role-based access
- 🔍 Pencarian berdasarkan nama, email, user_id
- 🏷️ Filter berdasarkan role
- 🔐 Generate user_id otomatis (USR-XXXXXXXX)
- 🔒 Password hashing dan validasi kompleks
- 📊 Pagination dan sorting

### 2. **AuthController.php** 🔐
**Fungsi Utama**: Sistem Autentikasi Admin
- 🔑 Login dengan email & password
- 🎟️ Generate API token untuk akses
- 🚪 Logout dan invalidasi token
- ✅ Validasi kredensial dengan Hash
- 👤 Return data user dan role setelah login

### 3. **CustomerController.php** 🏢
**Fungsi Utama**: Manajemen Data Customer/Pelanggan
- 📝 CRUD customer dengan kode otomatis
- 🔍 Pencarian multi-field (nama, kode, kontak, email, telepon)
- 🏷️ Filter berdasarkan status dan tipe customer
- 📋 Manage data kontak dan alamat customer
- 📊 History dan mengambil data statistics per customer

### 4. **DashboardController.php** 📊
**Fungsi Utama**: Analytics dan Dashboard Bisnis
- 📈 Overview statistics (orders, revenue, customers, drivers)
- 📉 Grafik tren orders dan revenue
- 🚚 Status pengiriman dan utilisasi kendaraan
- 🕐 Aktivitas terbaru sistem
- 🏆 Top customers dan performa driver
- ⏰ Filter berdasarkan timeframe (hari/minggu/bulan/tahun)

### 5. **DeliveryOrderController.php** 📦
**Fungsi Utama**: Mengelola Delivery Order (DO)
- 📋 CRUD delivery order dengan nomor otomatis
- 🔍 Pencarian berdasarkan DO ID, customer, barang
- 🏷️ Filter status, customer, tipe sumber
- 📊 Tracking progress delivery
- 🔗 Relasi dengan job orders dan manifest

### 6. **DriverController.php** 🚛
**Fungsi Utama**: Manajemen Data Driver/Sopir
- 👤 CRUD driver dengan ID otomatis
- 🔍 Pencarian berdasarkan nama, telepon, email
- 🏷️ Filter berdasarkan status dan shift
- 📅 Manajemen jadwal dan assignment
- 📊 History performa dan rating

### 7. **GpsController.php** 🗺️
**Fungsi Utama**: GPS Tracking dan Monitoring
- 📍 Real-time location tracking
- 🚚 Tracking kendaraan dan driver
- 📅 Filter berdasarkan periode tracking
- 🛣️ History rute perjalanan
- ⚡ Monitor kecepatan dan status
- 📊 Analytics efisiensi rute

### 8. **InvoiceController.php** 💰
**Fungsi Utama**: Sistem Invoice/Tagihan
- 🧾 Generate invoice dari job orders completed
- 💵 Calculate total berdasarkan tarif dan jarak
- 📋 Status tracking (draft, sent, paid, overdue)
- 📄 Generate PDF invoice
- 💳 Tracking pembayaran dan reminder
- 📊 Laporan revenue dan outstanding

### 9. **JobOrderController.php** 📋
**Fungsi Utama**: Mengelola Job Order (Pesanan Kerja)
- 📝 CRUD job order dengan ID otomatis
- 👥 Assignment driver dan vehicle
- 📊 Status tracking dengan history
- 🔍 Pencarian multi-field
- 🏷️ Filter status, customer, prioritas
- 📦 Generate manifest dan assignment

### 10. **ManifestController.php** 📄
**Fungsi Utama**: Manajemen Manifest Pengiriman
- 📋 CRUD manifest dengan ID otomatis
- 📦 Menambahkan job orders ke manifest
- 📊 Status tracking (draft → finalized → in_transit → completed)
- 🏙️ Filter berdasarkan kota asal dan tujuan
- 📄 Generate laporan manifest untuk driver

### 11. **ProfileController.php** 👤
**Fungsi Utama**: Manajemen Profile Admin
- 👤 View profile admin yang login
- ✏️ Update data profile
- 🔐 Ganti password dengan validasi
- 📸 Upload foto profile
- ⚙️ Setting preferences
- 📊 Activity log dan session history

### 12. **ReportController.php** 📊
**Fungsi Utama**: Sistem Pelaporan dan Analytics
- 💰 Laporan penjualan berdasarkan periode
- 🚛 Performa driver dan utilisasi kendaraan
- 📈 Analytics revenue dan profitability
- 👥 Laporan customer dan tren
- 📤 Export ke Excel/PDF
- 📊 KPI monitoring dan dashboard analytics

### 13. **RoleController.php** 🛡️
**Fungsi Utama**: Manajemen Role dan Permission
- 🏷️ CRUD role dengan permissions
- 👥 Assign/unassign admin ke role
- 🔐 Access control dan authorization
- 📋 Master data sistem permission
- ✅ Validasi usage sebelum delete role

### 14. **VehicleController.php** 🚚
**Fungsi Utama**: Manajemen Data Kendaraan
- 🚛 CRUD kendaraan dengan validasi lengkap
- 🔍 Pencarian berdasarkan plat, brand, model
- 🏷️ Filter berdasarkan tipe dan status
- 🔧 Tracking maintenance dan kondisi
- 📊 Monitor utilisasi dan performa

### 15. **VehicleTypeController.php** 🚛
**Fungsi Utama**: Master Data Tipe Kendaraan
- 📋 CRUD tipe kendaraan (Truck, Van, Motor, dll)
- 📐 Manage kapasitas muat dan dimensi
- 📋 Spesifikasi per tipe kendaraan
- 🏗️ Master data untuk vehicle management

---

## 🔄 Pola Umum dalam Setiap Controller

### 1. **Struktur Method Standar**:
- `index()` - List dengan pagination, search, filter
- `store()` - Create baru dengan validasi
- `show()` - Detail single record
- `update()` - Update dengan validasi
- `destroy()` - Delete dengan konfirmasi

### 2. **Fitur Umum**:
- 🔍 **Search**: Pencarian text di multiple field
- 🏷️ **Filter**: Filter berdasarkan status, tipe, dll
- 📊 **Pagination**: Default 15 item per halaman
- ✅ **Validation**: Validasi input dari admin
- 🔗 **Relations**: Include data relasi (with eloquent)
- 📅 **Timestamps**: Tracking created_at dan updated_at

### 3. **Response Format**:
```json
{
    "success": true/false,
    "message": "Pesan sukses/error",
    "data": {...},
    "pagination": {...} // khusus untuk list
}
```

---

## 🎯 Kesimpulan

Sistem SendPick memiliki arsitektur yang well-structured dengan separation of concerns yang jelas. Setiap controller mengelola domain bisnis spesifik dan mengikuti pola REST API yang konsisten. Sistem ini mendukung operasional logistik end-to-end dari customer management, job order creation, driver assignment, tracking, hingga invoicing dan reporting.

---