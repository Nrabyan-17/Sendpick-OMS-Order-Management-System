# 🚚 SendPick Order Management System (OMS)

**SendPick OMS** adalah sistem manajemen pemesanan (*Order Management System*) untuk operasional logistik dan pengiriman barang. Aplikasi ini terdiri dari **dashboard admin berbasis web** (Laravel + React) dan **REST API** yang juga melayani **aplikasi mobile driver** (Flutter).

Sistem ini mencakup siklus pengiriman dari awal sampai akhir: pembuatan *Job Order*, penyusunan *Manifest*, penerbitan *Delivery Order*, penugasan driver dan kendaraan, pelacakan GPS real-time, bukti pengiriman (POD), sampai penagihan (*Invoice*) dan pelaporan.

---

## 📑 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Arsitektur & Alur Bisnis](#-arsitektur--alur-bisnis)
- [Struktur Folder](#-struktur-folder)
- [Instalasi](#-instalasi)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Akun Default (Seeder)](#-akun-default-seeder)
- [Dokumentasi API](#-dokumentasi-api)
- [Logika Pembatalan](#-logika-pembatalan-cancellation)
- [Notifikasi Push (Firebase)](#-notifikasi-push-firebase)
- [Testing](#-testing)
- [Dokumentasi Tambahan](#-dokumentasi-tambahan)
- [Catatan Keamanan](#-catatan-keamanan)
- [Kontribusi](#-kontribusi)

---

## ✨ Fitur Utama

### 🖥️ Dashboard Admin (Web)
| Modul | Deskripsi |
|-------|-----------|
| **Dashboard** | Ringkasan data operasional dalam satu endpoint, dengan grafik (Chart.js / Recharts). |
| **Job Order** | Pembuatan order pengiriman (LTL/FTL), penugasan driver & kendaraan, QR code, riwayat status. |
| **Manifest** | Pengelompokan beberapa Job Order ke satu manifest; status Berangkat, Tiba, Selesai. |
| **Delivery Order** | Dokumen eksekusi pengiriman dari Job Order atau Manifest; cetak PDF. |
| **Invoice** | Penerbitan tagihan, pencatatan pembayaran, pembatalan, statistik, dan cetak PDF. |
| **Real-Time Tracking** | Posisi terkini semua driver dan riwayat rute pada peta (Leaflet). |
| **Customer** | Manajemen data master pelanggan. |
| **Driver** | Manajemen driver, termasuk driver yang tersedia untuk ditugaskan. |
| **Kendaraan & Tipe Kendaraan** | Armada, status maintenance, kendaraan aktif, riwayat pengiriman kendaraan. |
| **Laporan & Analitik** | Laporan Sales, Finansial, Operasional, dan Customer Analytics; ekspor CSV/Excel dan PDF. |
| **Admin & Role** | Manajemen admin dan hak akses (Super Admin / Admin). |
| **Autentikasi** | Login, verifikasi email, reset password, profil pengguna. |

### 📱 Driver Mobile App API
- Login driver dan manajemen profil/status
- Menerima atau menolak order (*accept/reject*)
- Update status pengiriman
- Upload **Proof of Delivery** (foto bukti kirim)
- **Scan QR Code** Job Order
- Pengiriman data **GPS secara batch** (*bulk*)
- Pemilihan kendaraan setelah login
- Riwayat dan statistik pengiriman
- Notifikasi push via **Firebase Cloud Messaging**

---

## 🛠️ Teknologi yang Digunakan

**Backend**
- PHP `^8.2` · [Laravel 12](https://laravel.com)
- [Laravel Sanctum](https://laravel.com/docs/sanctum) — autentikasi token API
- [Laravel Socialite](https://laravel.com/docs/socialite)
- [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission) — role & permission
- [barryvdh/laravel-dompdf](https://github.com/barryvdh/laravel-dompdf) — cetak PDF
- [Intervention Image](https://image.intervention.io) — pengolahan gambar (POD)
- [kreait/laravel-firebase](https://github.com/kreait/laravel-firebase) — Firebase Cloud Messaging
- Pest — testing

**Frontend**
- React 19 + React Router DOM 7
- Vite 7 + Tailwind CSS 4
- Chart.js / react-chartjs-2 / Recharts — visualisasi data
- Leaflet / react-leaflet — peta dan tracking
- jsPDF dan react-csv — ekspor dokumen
- Lucide React / React Icons — ikon
- Firebase JS SDK

**Database**
- PostgreSQL

**Mobile (repo terpisah)**
- Flutter (Android/iOS) untuk aplikasi driver

---

## 🧭 Arsitektur & Alur Bisnis

Proyek ini menggunakan **Laravel sebagai backend API** dan **React SPA** yang di-*serve* lewat Blade (`resources/views/dashboard/index.blade.php`).

```
Admin Dashboard (React)  ──┐
                           ├──►  Laravel REST API  ──►  Database
Driver App (Flutter)     ──┘          │
                                      └──►  Firebase FCM ──► Notifikasi ke Driver
```

**Alur utama operasional:**

```
Customer ─► Job Order ─► Manifest (opsional) ─► Delivery Order ─► Assign Driver & Kendaraan
                                                                      │
Invoice ◄── Completed ◄── Proof of Delivery ◄── In Transit ◄──────────┘
```

**Entitas utama (model):** `Admin`, `Role`, `Customers`, `Drivers`, `VehicleTypes`, `Vehicles`, `JobOrder`, `Manifests`, `DeliveryOrder`, `Invoices`, `Payment`, `Assignment`, `ProofOfDelivery`, `JobOrderStatusHistory`, `Gps`.

---

## 📂 Struktur Folder

```
.
├── app/
│   ├── Http/Controllers/
│   │   ├── Api/                 # Controller REST API (Auth, JobOrder, Manifest, Invoice, dst.)
│   │   │   └── Driver/          # DriverAppController (API aplikasi mobile)
│   │   └── PdfController.php    # Cetak PDF Delivery Order & Manifest
│   ├── Http/Middleware/
│   ├── Models/                  # Model Eloquent
│   ├── Observers/               # JobOrderObserver
│   └── Services/                # FirebaseNotificationService
├── config/                      # Konfigurasi (firebase.php, sanctum.php, dll.)
├── database/
│   ├── migrations/              # Skema database
│   └── seeders/                 # Data awal & data dummy
├── docs/                        # Dokumentasi API (Dashboard & Driver)
├── notes/                       # Catatan arsitektur, autentikasi, panduan Firebase
├── resources/
│   ├── js/
│   │   ├── components/common/   # Modal, pagination, map picker, dll.
│   │   ├── context/             # ThemeContext, UserContext
│   │   ├── features/            # Modul: admin, auth, customers, drivers,
│   │   │                        #   invoices, manifests, orders, tracking, vehicles
│   │   └── pages/               # Home, Report, Guide, Support, Notifications
│   └── views/                   # Blade (dashboard, pdf)
├── routes/
│   ├── api.php                  # Endpoint REST API
│   └── web.php                  # Halaman web & rute cetak PDF
├── tests/                       # Pest tests
└── SendPick API.postman_collection.json
```

---

## 🚀 Instalasi

### Prasyarat
- PHP **8.2** atau lebih baru (ekstensi umum Laravel, `gd` untuk Intervention Image)
- [Composer](https://getcomposer.org)
- Node.js **18+** dan npm
- Database bebas, bisa menggunakan MySQL, SQLite, PostgreSQL.

### Langkah-langkah

```bash
# 1. Clone repositori
git clone https://github.com/Nrabyan-17/Sendpick-OMS-Order-Management-System.git
cd Sendpick-OMS-Order-Management-System

# 2. Install dependensi backend
composer install

# 3. Install dependensi frontend
npm install

# 4. Siapkan file environment (lihat bagian Konfigurasi Environment)
cp .env.example .env      # jika file ini tidak ada, buat .env secara manual
php artisan key:generate

# 5. Siapkan database
#    SQLite (default):
touch database/database.sqlite
#    atau atur DB_* untuk MySQL di file .env

# 6. Jalankan migrasi dan seeder
php artisan migrate --seed

# 7. Buat symbolic link storage (untuk file upload / POD)
php artisan storage:link

# 8. Jalankan aplikasi (server + queue + Vite sekaligus)
composer run dev
```

Aplikasi berjalan di `http://localhost:8000`.

Atau jalankan secara terpisah:

```bash
php artisan serve        # backend
npm run dev              # frontend (Vite)
php artisan queue:listen # queue worker
```

**Build untuk produksi:**
```bash
npm run build
```

---

## ⚙️ Konfigurasi Environment

Contoh isi `.env` minimal:

```env
APP_NAME=SendPick
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database (SQLite - default)
DB_CONNECTION=sqlite

# Database (MySQL - opsional)
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=sendpick
# DB_USERNAME=root
# DB_PASSWORD=

# Sanctum / SPA
SANCTUM_STATEFUL_DOMAINS=localhost:8000

# Firebase Cloud Messaging (notifikasi ke driver)
FIREBASE_CREDENTIALS=storage/app/firebase/service-account.json
```

> 🔔 Untuk fitur push notification, letakkan file *service account* Firebase pada path yang diatur di `FIREBASE_CREDENTIALS`. Jangan commit file ini ke repositori.

---

## 🔑 Akun Default (Seeder)

Setelah menjalankan `php artisan migrate --seed`:

**Admin Dashboard**

| Email | Password | Role |
|-------|----------|------|
| `admin@sendpick.com` | `password` | Super Admin |

**Driver (Mobile App)** — contoh data seeder

| Nama | Email | Password |
|------|-------|----------|
| Budi Santoso | `budi.santoso@sendpick.com` | `password123` |
| Ahmad Hidayat | `ahmad.hidayat@sendpick.com` | `password123` |

> ⚠️ **Ganti semua kredensial default sebelum deploy ke produksi.**

**Hak akses role:**
- **Super Admin** — akses penuh (CRUD pada semua data)
- **Admin** — akses terbatas (hanya melihat data)

---

## 📡 Dokumentasi API

Semua endpoint berada di bawah prefix `/api`. Autentikasi memakai **Bearer Token** (Laravel Sanctum):

```
Authorization: Bearer <token>
```

### Ringkasan Endpoint Admin

| Grup | Endpoint | Keterangan |
|------|----------|------------|
| **Auth** | `POST /auth/login` · `POST /auth/logout` · `GET /auth/saya` · `POST /auth/verify-email` · `POST /auth/reset-password` | Autentikasi admin |
| **Profile** | `GET/PUT /profile` | Profil pengguna login |
| **Admins & Roles** | `/admins` · `/roles` · `/roles/available` · `/roles/stats` | Manajemen admin & role |
| **Customers** | `/customers` | CRUD pelanggan |
| **Drivers** | `/drivers` · `GET /drivers/available` | CRUD driver |
| **Vehicle Types** | `/vehicle-types` · `GET /vehicle-types/active` | CRUD tipe kendaraan |
| **Vehicles** | `/vehicles` · `/vehicles/available` · `/vehicles/active` · `/vehicles/delivery-history` · `PATCH /vehicles/{id}/maintenance` | Armada kendaraan |
| **Job Orders** | `/job-orders` · `POST /job-orders/{id}/assignments` · `GET /job-orders/{id}/assignments` · `POST /job-orders/{id}/cancel` | Order pengiriman |
| **Manifests** | `/manifests` · `add-job-orders` · `remove-job-orders` · `available-job-orders` · `cancel` · `PATCH status` | Manifest |
| **Delivery Orders** | `/delivery-orders` · `assign-driver` · `complete` · `cancel` | Delivery Order |
| **Invoices** | `/invoices` · `available-sources` · `record-payment` · `cancel` · `stats` · `pdf` | Penagihan |
| **GPS** | `GET /gps/current` · `GET /gps/tracking-history` · `GET /gps/live/{doId}` | Tracking (read-only) |
| **Dashboard** | `GET /dashboard` | Data dashboard |
| **Reports** | `/reports/sales` · `financial` · `operational` · `customer-analytics` (+ `/export`) · `/reports/analytics/pdf` | Laporan & ekspor |

### Endpoint Driver Mobile App (`/api/driver`)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/login` | Login driver |
| `POST` | `/logout` | Logout driver |
| `GET` | `/profile` | Profil driver |
| `PUT` | `/status` | Update status driver |
| `PUT` | `/fcm-token` | Update FCM token |
| `GET` | `/jobs` · `/jobs/{id}` | Daftar & detail job |
| `POST` | `/jobs/{id}/accept` · `/jobs/{id}/reject` | Terima / tolak order |
| `PUT` | `/jobs/{id}/status` | Update status job |
| `POST` | `/jobs/{id}/pod` | Upload Proof of Delivery |
| `POST` | `/scan-qr` | Scan QR Code |
| `POST` | `/gps/bulk` | Kirim GPS batch |
| `GET` | `/history` · `/history/stats` | Riwayat & statistik |
| `GET` | `/vehicles/available` | Kendaraan tersedia |
| `POST` | `/vehicles/select` | Pilih kendaraan |
| `GET` | `/vehicles/{id}/check` | Cek ketersediaan kendaraan |

### Rute Web Cetak PDF

| Endpoint | Keterangan |
|----------|------------|
| `/print/delivery-order/{doId}` | Cetak Delivery Order |
| `/print/manifest/{manifestId}` | Cetak Manifest |
| `/reports/analytics/pdf` | Laporan analitik PDF |

📘 **Dokumentasi lengkap:** lihat [`docs/DASHBOARD_API_DOCS.md`](docs/DASHBOARD_API_DOCS.md) dan [`docs/DRIVER_API_DOCS.md`](docs/DRIVER_API_DOCS.md).
📮 **Postman:** import file [`SendPick API.postman_collection.json`](SendPick%20API.postman_collection.json) untuk mencoba semua endpoint.

---

## 🔄 Logika Pembatalan (Cancellation)

| Aksi Admin | Job Order | Delivery Order | Manifest |
|------------|-----------|----------------|----------|
| **Cancel Job Order** | `Cancelled` | `Cancelled` otomatis | `Cancelled` jika JO tersebut satu-satunya; tetap jika masih ada JO lain |
| **Cancel Manifest** | Kembali `Pending` | `Cancelled` otomatis | `Cancelled` |
| **Cancel Delivery Order** | Kembali `Pending` | `Cancelled` | `Cancelled` jika manifest menjadi kosong |

🛑 Job Order **tidak dapat dibatalkan** jika manifest-nya sudah berstatus *In Transit*.

Detail lengkap: [`.agent/workflows/cancellation-logic.md`](.agent/workflows/cancellation-logic.md).

---

## 🔔 Notifikasi Push (Firebase)

1. Driver login di aplikasi mobile, lalu mengirim **FCM token** ke `PUT /api/driver/fcm-token`.
2. Admin menugaskan order ke driver.
3. Backend (`FirebaseNotificationService`) mengirim notifikasi lewat Firebase Cloud Messaging.
4. Driver menerima notifikasi, lalu *accept/reject* order lewat API.

Panduan lengkap (Firebase, Flutter, backend, testing): lihat folder [`notes/`](notes/).

---

## 🧪 Testing

Proyek ini menggunakan **Pest**.

```bash
composer test
# atau
php artisan test
```

Format kode dengan Laravel Pint:

```bash
./vendor/bin/pint
```

---

## 📚 Dokumentasi Tambahan

| File | Isi |
|------|-----|
| [`notes/Catatan Arsitektur Sistem Backend.md`](notes/Catatan%20Arsitektur%20Sistem%20Backend.md) | Rancangan model, migration, dan relasi |
| [`notes/AUTHENTICATION.md`](notes/AUTHENTICATION.md) | Alur autentikasi Sanctum |
| [`notes/CATATAN_STRUKTUR_API_CONTROLLERS.md`](notes/CATATAN_STRUKTUR_API_CONTROLLERS.md) | Struktur API controller |
| [`notes/FIREBASE_NOTIFICATION_GUIDE (1).md`](notes/FIREBASE_NOTIFICATION_GUIDE%20(1).md) | Panduan push notification |
| [`docs/DASHBOARD_API_DOCS.md`](docs/DASHBOARD_API_DOCS.md) | Dokumentasi API dashboard |
| [`docs/DRIVER_API_DOCS.md`](docs/DRIVER_API_DOCS.md) | Dokumentasi API driver |

---

## 🔒 Catatan Keamanan

Sebelum menggunakan di produksi, pastikan:

- Ganti seluruh password default dari seeder.
- Jangan commit file kredensial (`.env`, service account Firebase). File `google-services.json` sebaiknya ditinjau ulang.
- Tinjau kembali rute API yang saat ini memakai `withoutMiddleware('auth:sanctum')` di `routes/api.php`, lalu aktifkan kembali autentikasi untuk endpoint yang seharusnya terlindungi.
- Set `APP_DEBUG=false` dan gunakan HTTPS.

---

## 🤝 Kontribusi

1. Fork repositori ini
2. Buat branch fitur: `git checkout -b feature/nama-fitur`
3. Commit perubahan: `git commit -m "feat: deskripsi singkat"`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Buat **Pull Request** ke branch `development`

---

## 👤 Author

**Nrabyan-17** — [github.com/Nrabyan-17](https://github.com/Nrabyan-17)

---

Dibuat untuk memudahkan operasional logistik 🚛