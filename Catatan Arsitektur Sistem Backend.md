# **Catatan Arsitektur Backend \- SendPick OMS**

Dokumen ini merangkum arsitektur backend yang direkomendasikan untuk aplikasi SendPick (Laravel & React) berdasarkan SRS dan fungsionalitas UI yang telah disetujui.

## **1\. Model (Total: 14 Model)**

Berikut adalah 14 model Eloquent yang merepresentasikan entitas data utama dalam sistem:

* **Model Profiles & Peran:**  
  1. **`Admin`**: Mengelola data Admin/Super Admin yang bisa login ke dashboard (datanya ada di halaman `users` pada bagian sidebar Dashboard).  
  2. **`Role`**: Mengelola data peran/hak akses (misal: "Super Admin", "Operations Manager", "Admin") ada di halaman `users` pada bagian Role & Permissions.  
       
* **Model Master Data:** 
3. **`Customer`**: Mengelola data master pelanggan. 
4. **`Driver`**: Mengelola data master driver. 
5. **`VehicleType`**: Mengelola kategori/tipe kendaraan. 
6. **`Vehicle`**: Mengelola unit/armada kendaraan.  
    
* **Model Transaksi Inti:** 
7. **`JobOrder`**: Model utama untuk mengelola order pengiriman. 
8. **`Manifest`**: Mengelola dokumen manifest/packing list. 
9. **`DeliveryOrder`**: Mengelola dokumen eksekusi pengiriman. 
10. **`Invoice`**: Mengelola data tagihan/invoice pelanggan.  
    
* **Model Penugasan & Log (Pendukung):**  
11. **`JobOrderAssignment`**: Model pivot (dengan data tambahan) untuk mencatat penugasan driver/kendaraan ke `JobOrder`. 
12. **`ProofOfDelivery`**: Menyimpan log data bukti kirim (foto) dari driver. 
13. **`JobOrderStatusHistory`**: Menyimpan log riwayat perubahan status `JobOrder`.
14. **`GpsTrackingLog`**: Menyimpan log data mentah dari koordinat GPS dari driver.

---

## **2\. Migration (Total: 16 File Migration)**

Berikut adalah 16 tabel database yang perlu dibuat. (Kolom `id`, `created_at`, dan `updated_at` (`timestamps()`) disertakan secara default kecuali disebutkan lain).

### **Grup User & Role**

1. **`create_roles_table`**  
   * **`Id (PK, BigInt)`**  
   * `name` (string, unique): Nama peran.  
   * `description` (text, nullable): Penjelasan peran.  
   * `Timestamps`
   
2. **`create_admin_table`**  
   * `user_id` (string, primary): PK kustom jika diperlukan, atau `id` (bigIncrements).  
   * `name` (string).  
   * `email` (string, unique).  
   * `password` (string).  
   * `Timestamps`   

3. **`create_role_admin_table` (Pivot)**  
   * `id (Pk, BigInt)`  
   * `user_id` (foreignId, constrained ke `users`).  
   * `role_id` (foreignId, constrained ke `roles`).

### **Grup Master Data**

4. **`create_customers_table`**  
   * `customer_id` (string, primary key) atau `id`.  
   * `customer_code` (string, unique): "Kode unik Pelanggan dari form".  
   * `customer_name` (string): "Nama perusahaan Pelanggan".  
   * `customer_type` (string, nullable): "Tipe Pelanggan".  
   * `contact_name` (string, nullable): "Nama Kontak".  
   * `phone` (string, nullable).  
   * `email` (string, nullable).  
   * `address` (text, nullable).  
   * `status` (string, default 'Aktif').  
   * `timestamps`  

5. **`create_drivers_table`**  
   * `driver_id` (string, primary) atau `id`.  
   * `driver_name` (string).  
   * `phone` (string, unique).  
   * `email` (string, unique, nullable).  
   * `status` (string, default 'Aktif').  
   * `shift` (string, nullable).  
   * `last_lat` (decimal, nullable)  
   * `last_lng` (Decimal, Nullable)  
   * `Timestamps`  

6. **`create_vehicle_types_table`**  
   * `id` (bigIncrements).  
   * `name` (string, unique): "Nama Tipe".  
   * `description` (text, nullable).  
   * `capacity_min_kg` (decimal, nullable).  
   * `capacity_max_kg` (decimal, nullable).  
   * `volume_min_m3` (decimal, nullable).  
   * `volume_max_m3` (decimal, nullable).  
   * `status` (string, default 'Aktif').  
   * `Timestamps`  

7. **`create_vehicles_table`**  
   * `vehicle_id` (string, primary) atau `id`.  
   * `plate_no` (string, unique): "Nomor Plat".  
   * `vehicle_type_id` (foreignId, constrained ke `vehicle_types`).  
   * `brand` (string, nullable): Merk (misal: Mitsubishi).  
   * `model` (string, nullable): "Model Kendaraan".  
   * `year` (smallInteger, nullable): Tahun.  
   * `capacity_label` (string, nullable): "Kapasitas".  
   * `odometer_km` (integer, default 0).  
   * `status` (string, default 'Aktif').  
   * `condition_label` (string, default 'Baik').  
   * **`fuel_level_pct` (TINYINT, Default 0\)** (untuk "Fuel Level" di UI)  
   * **`last_maintenance_date` (DATE, Nullable)** (untuk "Maintenance" di UI)  
   * **`next_maintenance_date` (DATE, Nullable)** (untuk "Maintenance" di UI)  
   * `timestamps`


### **Grup Transaksi Inti**

8. **`create_job_orders_table`**  
   * `job_order_id` (string, primary) atau `id`.  
   * `customer_id` (foreignId, constrained ke `customers`).  
   * `order_type` (string): "Tipe Order" (LTL/FTL).  
   * `status` (string, default 'Created').  
   * `pickup_address` (text).  
   * `delivery_address` (text).  
   * `goods_desc` (text): "Deskripsi Barang".  
   * `goods_weight` (decimal, default 0).  
   * `ship_date` (date): "Tanggal Kirim".  
   * `order_value` (decimal, nullable): "Nilai Order".  
   * `created_by` (foreignId, constrained ke `users`).  
   * `completed_at` (datetime, nullable).  
   * Timestamsps  

9. **`create_manifests_table`**  
   * `manifest_id` (string, primary) atau `id`.  
   * `origin_city` (string).  
   * `dest_city` (string).  
   * `cargo_summary` (text, nullable): "Packages".  
   * `cargo_weight` (decimal, nullable): "Total Weight".  
   * `planned_departure` (datetime, nullable): "Shipment Date".  
   * `planned_arrival` (DATETIME, Nullable).  
   * `status` (string, default 'Pending').  
   * `created_by` (foreignId, constrained ke `users`).  

10. **`create_delivery_orders_table`**  
    * `do_id` (string, primary) atau `id`.  
    * `source_type` (string): "Tipe Sumber" (JO atau MF).  
    * `source_id` (string): ID dari JO atau MF.  
    * `customer_id` (foreignId, constrained ke `customers`).  
    * `status` (string, default 'Pending').  
    * `do_date` (date): "Tanggal DO".  
    * `delivered_date` (date, nullable).  
    * `goods_summary` (TEXT): Ringkasan barang.  
    * `priority` (string, nullable): "Prioritas".  
    * `temperature` (string, nullable): "Suhu".  
    * `created_by` (foreignId, constrained ke `users`).  

    * `timestamps`  
11. **`create_invoices_table`**  
    * `invoice_id` (string, primary) atau `id`.  
    * `source_type` (string): id dari 'JO', 'MF', 'DO'.  
    * `source_id` (string).  
    * `customer_id` (foreignId, constrained ke `customers`).  
    * `invoice_date` (date).  
    * `due_date` (date).  
    * `subtotal` (DECIMAL).  
    * `tax_amount` (DECIMAL, Default 0).  
    * `total_amount` (decimal).  
    * `status` (string, default 'Pending'): 'Pending', 'Paid', 'Overdue'.  
    * `notes` (TEXT, Nullable).  
    * `created_by` (foreignId, constrained ke `users`).

### **Grup Log (pendukung) & Pivot**

12. **`create_job_order_assignments_table`**  
    * `assignment_id` (bigIncrements).  
    * `job_order_id` (foreignId, constrained ke `job_orders`).  
    * `driver_id` (foreignId, constrained ke `drivers`).  
    * `vehicle_id` (foreignId, constrained ke `vehicles`).  
    * `status` (string, nullable): "Active", "Standby".  
    * `notes` (text, nullable): "Catatan".  
    * `assigned_at` (datetime).  

13. **`create_manifest_jobs_table` (Pivot)**  
    * **`id` (PK, BigInt)**  
    * `manifest_id` (foreignId, constrained ke `manifests`).  
    * `job_order_id` (foreignId, constrained ke `job_orders`).  

14. **`create_proof_of_deliveries_table`**  
    * `pod_id` (bigIncrements).  
    * `job_order_id` (foreignId, constrained ke `job_orders`).  
    * `photo_url` (string, nullable).  
    * `signature_url` (string, nullable).  
    * `uploaded_at` (datetime).  

15. **`create_order_status_history_table`**  
    * `history_id` (bigIncrements).  
    * `job_order_id` (foreignId, constrained ke `job_orders`).  
    * `status` (string).  
    * `changed_by` (string): 'System', 'Admin', 'Driver'.  
    * `changed_at` (datetime).  

16. **`create_gps_tracking_logs_table`**  
    * `id` (bigIncrements).  
    * `driver_id` (foreignId, constrained ke `drivers`).  
    * `vehicle_id` (FK ke `vehicles.vehicle_id`, Nullable).  
    * `order_id` (VARCHAR, Nullable): ID JO atau DO yang sedang aktif.  
    * `lat` (decimal).  
    * `lng` (decimal).  
    * `sent_at` (datetime): Waktu dari HP driver.  
    * `received_at` (timestamp): Waktu diterima server.

---

## **3\. Controller (Total: 15 Controller)**

Berikut adalah 15 controller API dan tanggung jawab utamanya:

1. **`AuthController`**: Menangani `login` dan `logout` (termasuk validasi).  

2. **`ProfileController`**: Menangani `getMyProfile` (mengambil data user yang sedang login) dan `updateMyProfile` (update data user yang sedang login).  

3. **`AdminController`**: Menangani CRUD untuk Halaman "Users" (Daftar Admin & Pegawai). 
   * Mengambil semua data roles yang tersedia untuk admin `getRoles`

4. **`RoleController`**: Menangani CRUD untuk section "Role & Permissions" pada halaman  .  


5. **`CustomerController`**: Menangani CRUD untuk Halaman "Customers".
   * Mendapatkan data statistik `getStats` dari customer tertentu.


6. **`DriverController`**: Menangani CRUD untuk Halaman "Drivers".  
   * Mendapatkan data driver yang bersedia (dalam status sedang tidak bertugas) `getAvailable` dari driver tertentu.
   * Mengubah lokasi `updateLocation` dari posisi driver saat ini.


7. **`VehicleTypeController`**: Menangani CRUD untuk Halaman "Vehicle Types".  
   * Mengambil semua data dari tipe kendaraan yg statusnya masih 'aktif' `getActive`


8. **`VehicleController`**: Menangani CRUD untuk Halaman "Vehicle List".  
   * Mengambil semua data kendaraan yang tersedia (statusnya belum ditugaskan ke driver) `getAvailable`
   * Mengubah info  `updateMaintenance`
   * `updateFuelLevel`


9. **`JobOrderController`**:  
   * Menangani CRUD untuk "Job Order".  
   * Menangani logika untuk menyimpan data penugasan `storeAssignment` (Tab "Assignment Management").  
   * Mengubah status job order `updateStatus` sampai statusnya 'Completed'.
   * Mengambil daftar penugasan (driver & kendaraan) `getAssignments` untuk satu Job Order tertentu.
   * Menyimpan log riwayat perubahan status pada Job Order `(private method). createStatusHistory` (misal: dari "Created" ke "Assigned"). 


10. **`ManifestController`**: Menangani CRUD untuk "Manifest/Packing List". 
   * Menambahkan satu atau beberapa Job Order `addJobOrders` ke dalam Manifest tertentu. 
   * Menghapus satu atau beberapa Job Order dari Manifest tertentu `removeJobOrders`.
   * Mengambil daftar Job Order yang belum terhubung ke Manifest manapun `getAvailableJobOrders` (siap dimasukkan ke Manifest) 
   * Menghitung dan memperbarui `priv. updateManifestCargo` ringkasan barang/cargo di Manifest setelah ada perubahan Job Order di dalamnya.


11. **`DeliveryOrderController`**:  
    * Menangani CRUD untuk "Delivery Order".  
    * Menangani logika untuk `assignDriverToDO` (Pop-up "Assign Driver").  

12. **`InvoiceController`**: Menangani CRUD untuk Halaman "Invoices". 
   * `markAsPaid`
   * `updateOverdueStatus`
   * `getStats` 
   * `getAvailableSources`

13. **`DashboardController`**: Menyediakan data KPI untuk Halaman "Home".  
   * `priv. getOverviewStats`
   * `priv. getOrdersTrend`
   * `priv. getRevenueTrend`
   * `priv. getDeliveryStatus`
   * `priv. getVehicleUtilization`
   * `priv. getRecentActivities`
   * `priv. getTopCustomers`
   * `priv. getDriverPerformance`
   * `priv. getStartDate`
   * `priv. getDateFormat`
   * `priv. getDisplayFormat`
   * `priv. getDaysCount`
   * `priv. getKpiSummary`
   * `priv. calculateDeliveryRate`

14. **`GpsController`**: Menyediakan data GPS, khusus untuk Halaman "Real Time Tracking".  
   * `getCurrentLocations`
   * `getTrackingHistory`
   * `getLiveTracking`
   * `bulkStore`
   * `priv. calculateTotalDistance`
   * `priv. haversineDistance`

15. **`ReportController`**: Menyediakan data & chart, khsusus untuk Halaman "Reports & Analytics".
   * `salesReport`
   * `financialReport`
   * `operationalReport`
   * `customerAnalytics`
   * `exportReport`
   * `getSingleCustomerAnalytics`
   * `priv. calculateCompletionRate`
   * `priv. calculateCollectionRate`
   * `priv. getDateFormat`
   * `priv. generateSalesExportData`
   * `priv. generateFinancialExportData`
   * `priv. generateOperationalExportData`
   * `priv. generateCustomerExportData`

---

## **4\. Logika Relasi Antar Tabel**

* **`Admin` \<-\> `Role`**: Relasi Many-to-Many melalui tabel `role_admin`.  
Penjelasan simpel: Ini adalah relasi Many-to-Many (Banyak-ke-Banyak). Jadi Satu User (Admin) bisa memiliki banyak Role (misal: "Admin" dan "Finance"), dan satu Role (misal: "Admin") bisa dimiliki oleh banyak User. Tabel pivot role_user adalah "jembatan" yang menghubungkan keduanya.

* **`Manifest` \<-\> `JobOrder`**: Relasi Many-to-Many melalui tabel `manifest_jobs`.  
relasinya Many-to-Many untuk mendukung konsolidasi LTL (banyak JO dalam 1 Manifest).

* **`Admin` \-\> Transaksi**: Relasi One-to-Many ke `JobOrder`, `Manifest`, `DeliveryOrder`, `Invoice` (melalui *foreign key* `created_by`).  
Penjelasan: Ini adalah relasi One-to-Many (Satu-ke-Banyak). Satu Customer (misal: "PT Maju Jaya") bisa memiliki banyak JobOrders, banyak Invoices, dan banyak DeliveryOrders dari waktu ke waktu.

* **`Customer` \-\> Transaksi**: Relasi One-to-Many ke `JobOrder`, `DeliveryOrder`, `Invoice` (melalui *foreign key* `customer_id`).  

* **`VehicleType` \-\> `Vehicle`**: Relasi One-to-Many (satu tipe memiliki banyak unit kendaraan).  

* **`JobOrder` \-\> Penugasan**: Relasi One-to-Many ke `JobOrderAssignment`. (Satu JO bisa punya banyak assignment, misal "Active" dan "Backup").  

* **`Driver` \-\> Penugasan**: Relasi One-to-Many ke `JobOrderAssignment`.  

* **`Vehicle` \-\> Penugasan**: Relasi One-to-Many ke `JobOrderAssignment`.  

* **`JobOrder` \-\> Logs**: Relasi One-to-Many ke `OrderStatusHistory` dan `ProofOfDelivery`.  

* **`Driver` \-\> Logs**: Relasi One-to-Many ke `GpsTrackingLog`.  

* **Relasi Polimorfik**:  
  * `DeliveryOrder` memiliki `source_type` ('JO'/'MF') dan `source_id` yang merujuk ke tabel `job_orders` atau `manifests`.  

  * `Invoice` memiliki `source_type` ('JO'/'MF'/'DO') dan `source_id` yang merujuk ke tiga tabel tersebut `job_orders`, `manifests`, dan `delivery_orders`.  


## **Rute API**

  1. Rute Publik (Tanpa Login)
POST /api/login (Untuk login Admin Dashboard)

POST /api/driver/login (Untuk login Driver App)

2. Rute Admin Dashboard (Dilindungi Autentikasi)
Semua endpoint ini memerlukan token autentikasi.

Auth & Profile
POST /api/logout (Logout admin)

GET /api/profile (Ambil data profil user yang sedang login)

PUT /api/profile (Update data profil user yang sedang login)

Manajemen User & Peran
CRUD /api/users (Menangani semua kebutuhan CRUD di Halaman Users/Tim Admin)

CRUD /api/roles (Menangani semua kebutuhan CRUD untuk Role & Permissions)

Master Data
1. CRUD /api/customers (Menangani CRUD Customers)

2. CRUD /api/drivers (Menangani CRUD Drivers)

3. CRUD /api/vehicle-types (Menangani CRUD Tipe Kendaraan)

4. CRUD /api/vehicles (Menangani CRUD Kendaraan)

Transaksi & Operasional
CRUD /api/job-orders (Menangani CRUD Job Order)

POST /api/job-orders/{id}/assignments (Menambah assignment baru ke Job Order)

CRUD /api/manifests (Menangani CRUD Manifest)

CRUD /api/delivery-orders (Menangani CRUD Delivery Order)

POST /api/delivery-orders/{id}/assign (Assign driver/kendaraan ke Delivery Order)

CRUD /api/invoices (Menangani CRUD Invoice)

Insights & Analytics:
GET /api/dashboard (Mengambil data KPI untuk halaman Home)

GET /api/tracking (Mengambil data lokasi driver untuk halaman Real Time Tracking)

GET /api/reports (Meng-generate data untuk halaman Reports & Analytics)


3. Rute Driver App (Dilindungi Autentikasi)
Semua endpoint ini memerlukan token autentikasi driver dan memiliki prefix /api/driver.

POST /api/driver/logout (Logout driver)

GET /api/driver/jobs (Mengambil daftar pekerjaan yang ditugaskan)

GET /api/driver/jobs/{id} (Mengambil detail satu pekerjaan)

POST /api/driver/jobs/{id}/status (Mengubah status pekerjaan, misal: "Barang Diambil", "Selesai")

POST /api/driver/jobs/{id}/pod (Mengunggah file foto/tanda tangan Bukti Kirim)

POST /api/driver/location (Mengirim update lokasi GPS secara periodik)