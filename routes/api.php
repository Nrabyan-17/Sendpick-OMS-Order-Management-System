<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// 1. Import Controllers - Mengimpor semua Controller API yang diperlukan dari folder API.
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\VehicleTypeController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\JobOrderController;
use App\Http\Controllers\Api\ManifestController;
use App\Http\Controllers\Api\DeliveryOrderController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GpsController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\Driver\DriverAppController;

// Terdapat Additional Routes di setiap resource untuk fungsi-fungsi spesifik diluar standar CRUD, spesifiknya untuk kebutuhan proses bisnis.

// Public routes
Route::post('/auth/login', [AuthController::class, 'login'])->name('api.auth.login');
Route::post('/auth/verify-email', [AuthController::class, 'verifyEmail'])->name('api.auth.verify-email');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->name('api.auth.reset-password');

// Protected routes, karena menggunakan middleware 'auth:sanctum'
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.auth.logout');
    Route::get('/auth/saya', [AuthController::class, 'me'])->name('api.auth.saya');

    // Profile
    Route::get('/profile', [ProfileController::class, 'getMyProfile'])->name('api.profile.show');
    Route::put('/profile', [ProfileController::class, 'updateMyProfile'])->name('api.profile.update');

    // Additional Admin routes:
    // 1. Mendapatkan daftar role yang tersedia untuk admin
    Route::get('/admins/roles', [AdminController::class, 'getRoles'])->name('api.admins.roles')->withoutMiddleware('auth:sanctum'); // ada

    // Admins (apiResource)
    Route::apiResource('admins', AdminController::class)
        ->parameters(['admins' => 'userId'])
        ->names([
            'index' => 'api.admins.index', // --> GET /api/admins
            'store' => 'api.admins.store', // --> POST /api/admins
            'show' => 'api.admins.show', // --> GET /api/admins/{userId}
            'update' => 'api.admins.update', // --> PUT /api/admins/{userId}
            'destroy' => 'api.admins.destroy', // --> DELETE /api/admins/{userId}
        ])->withoutMiddleware('auth:sanctum');

    // Additional Roles routes (HARUS SEBELUM apiResource untuk avoid route conflict):
    // 1. Mendapatkan daftar role yang dapat ditugaskan ke admin
    Route::get('/roles/available', [RoleController::class, 'getAvailableRoles'])->name('api.roles.available'); // ada
    // 2. Mendapatkan statistik penggunaan role
    Route::get('/roles/stats', [RoleController::class, 'getStats'])->name('api.roles.stats'); // ada

    // Roles (apiResource untuk manajemen role)
    Route::apiResource('roles', RoleController::class)
        ->parameters(['roles' => 'roleId'])
        ->names([
            'index' => 'api.roles.index', // --> GET /api/roles
            'store' => 'api.roles.store', // --> POST /api/roles
            'show' => 'api.roles.show', // --> GET /api/roles/{roleId}
            'update' => 'api.roles.update', // --> PUT /api/roles/{roleId}
            'destroy' => 'api.roles.destroy', // --> DELETE /api/roles/{roleId}
        ]);

    // 3. Mendapatkan daftar admin yang memiliki role tertentu
    // Route::post('/roles/bulk-assign', [RoleController::class, 'bulkAssignToAdmin'])->name('api.roles.bulk-assign')->withoutMiddleware('auth:sanctum'); // ada 
    // 4. Menugaskan atau menghapus role dari admin
    // Route::post('/roles/{roleId}/assign', [RoleController::class, 'assignToAdmin'])->name('api.roles.assign-admin')->withoutMiddleware('auth:sanctum'); // ada
    // 5. Menghapus role dari admin
    // Route::post('/roles/{roleId}/remove', [RoleController::class, 'removeFromAdmin'])->name('api.roles.remove-admin')->withoutMiddleware('auth:sanctum'); // ada
    // 6. Mendapatkan daftar admin berdasarkan role tertentu
    // Route::get('/roles/{roleId}/admins', [RoleController::class, 'getAdmins'])->name('api.roles.admins')->withoutMiddleware('auth:sanctum'); // ada

    // Customers (apiResource)
    Route::apiResource('customers', CustomerController::class)
        ->parameters(['customers' => 'customerId'])
        ->names([
            'index' => 'api.customers.index', // --> GET /api/customers
            'store' => 'api.customers.store', // --> POST /api/customers
            'show' => 'api.customers.show', // --> GET /api/customers/{customerId}
            'update' => 'api.customers.update', // --> PUT /api/customers/{customerId}
            'destroy' => 'api.customers.destroy', // --> DELETE /api/customers/{customerId}
        ])->withoutMiddleware('auth:sanctum');

    // Additional Driver routes:
    // 1. Mendapatkan daftar driver yang bersedia untuk ditugaskan (tidak memiliki assignment aktif)
    Route::get('/drivers/available', [DriverController::class, 'getAvailable'])->name('api.drivers.available')->withoutMiddleware('auth:sanctum'); // ada

    // Drivers (apiResource)
    Route::apiResource('drivers', DriverController::class)
        ->parameters(['drivers' => 'driverId'])
        ->names([
            'index' => 'api.drivers.index', // --> GET /api/drivers
            'store' => 'api.drivers.store', // --> POST /api/drivers
            'show' => 'api.drivers.show', // --> GET /api/drivers/{driverId}
            'update' => 'api.drivers.update', // --> PUT /api/drivers/{driverId}
            'destroy' => 'api.drivers.destroy', // --> DELETE /api/drivers/{driverId}
        ])->withoutMiddleware('auth:sanctum');
    
    // 2. Memperbarui lokasi driver secara real-time (ini bisa dipindah ke DriverAppController jika ada)
    // Route::patch('/drivers/{driverId}/location', [DriverController::class, 'updateLocation'])->name('api.drivers.update-location')->withoutMiddleware('auth:sanctum');

    // Additional Vehicle Type routes:
    // 1. Mendapatkan daftar tipe kendaraan yang statusnya masih 'Aktif'
    Route::get('/vehicle-types/active', [VehicleTypeController::class, 'getActive'])->name('api.vehicle-types.active')->withoutMiddleware('auth:sanctum');

    // Vehicle Types (apiResource)
    Route::apiResource('vehicle-types', VehicleTypeController::class)
        ->parameters(['vehicle-types' => 'id'])
        ->names([
            'index' => 'api.vehicle-types.index', // --> GET /api/vehicle-types
            'store' => 'api.vehicle-types.store', // --> POST /api/vehicle-types
            'show' => 'api.vehicle-types.show', // --> GET /api/vehicle-types/{id}
            'update' => 'api.vehicle-types.update', // --> PUT /api/vehicle-types/{id}
            'destroy' => 'api.vehicle-types.destroy', // --> DELETE /api/vehicle-types/{id}
        ])->withoutMiddleware('auth:sanctum');

    // Additional Vehicle routes:
    // 1. Mendapatkan daftar kendaraan yang tersedia untuk ditugaskan (tidak memiliki assignment aktif).
    Route::get('/vehicles/available', [VehicleController::class, 'getAvailable'])->name('api.vehicles.available')->withoutMiddleware('auth:sanctum');
    // 2. Memperbarui status maintenance kendaraan
    Route::patch('/vehicles/{vehicleId}/maintenance', [VehicleController::class, 'updateMaintenance'])->name('api.vehicles.update-maintenance')->withoutMiddleware('auth:sanctum');
    // 3. Mendapatkan daftar kendaraan aktif dengan status real-time
    Route::get('/vehicles/active', [VehicleController::class, 'getActiveVehicles'])->name('api.vehicles.active')->withoutMiddleware('auth:sanctum');
    // 4. Mendapatkan histori pengiriman kendaraan (Vehicle History page)
    Route::get('/vehicles/delivery-history', [VehicleController::class, 'getDeliveryHistory'])->name('api.vehicles.delivery-history')->withoutMiddleware('auth:sanctum');
    // 5. Memperbarui level bahan bakar kendaraan (Tidak perlu, karena Controller ini bisa digunakan untuk keperluan lain atau controller lain seperti DriverAppController)
    // Route::patch('/vehicles/{vehicleId}/fuel', [VehicleController::class, 'updateFuelLevel'])->name('api.vehicles.update-fuel')->withoutMiddleware('auth:sanctum');

    // Vehicles (apiResource)
    Route::apiResource('vehicles', VehicleController::class)
        ->parameters(['vehicles' => 'vehicleId'])
        ->names([
            'index' => 'api.vehicles.index', // --> GET /api/vehicles
            'store' => 'api.vehicles.store', // --> POST /api/vehicles
            'show' => 'api.vehicles.show', // --> GET /api/vehicles/{vehicleId}
            'update' => 'api.vehicles.update', // --> PUT /api/vehicles/{vehicleId}
            'destroy' => 'api.vehicles.destroy', // --> DELETE /api/vehicles/{vehicleId}
        ])->withoutMiddleware('auth:sanctum');

    // Additional Job Order routes:
    // 1. Menambahkan assignment ke job order
    Route::post('/job-orders/{jobOrderId}/assignments', [JobOrderController::class, 'storeAssignment'])->name('api.job-orders.store-assignment')->withoutMiddleware('auth:sanctum');
    // 2. Memperbarui status job order (Disarankan dipindah ke DriverAppController jika ada)
    // Route::patch('/job-orders/{jobOrderId}/status', [JobOrderController::class, 'updateStatus'])->name('api.job-orders.update-status')->withoutMiddleware('auth:sanctum');
    // 3. Mendapatkan semua data assignment untuk job order tertentu
    Route::get('/job-orders/{jobOrderId}/assignments', [JobOrderController::class, 'getAssignments'])->name('api.job-orders.assignments')->withoutMiddleware('auth:sanctum');
    // 4. Membatalkan job order (Cancel Job Order - Blueprint Cancellation Logic)
    Route::post('/job-orders/{jobOrderId}/cancel', [JobOrderController::class, 'cancel'])->name('api.job-orders.cancel')->withoutMiddleware('auth:sanctum');

    // Job Orders (apiResource)
    Route::apiResource('job-orders', JobOrderController::class)
        ->parameters(['job-orders' => 'jobOrderId'])
        ->names([
            'index' => 'api.job-orders.index', // --> GET /api/job-orders
            'store' => 'api.job-orders.store', // --> POST /api/job-orders
            'show' => 'api.job-orders.show', // --> GET /api/job-orders/{jobOrderId}
            'update' => 'api.job-orders.update', // --> PUT /api/job-orders/{jobOrderId}
            'destroy' => 'api.job-orders.destroy', // --> DELETE /api/job-orders/{jobOrderId}
        ])->withoutMiddleware('auth:sanctum');

    // Additional Manifest routes:
    // 1. Mendapatkan data daftar job order yang tersedia untuk ditambahkan ke manifest
    Route::get('/manifests/{manifestId}/available-job-orders', [ManifestController::class, 'getAvailableJobOrders'])->name('api.manifests.available-job-orders')->withoutMiddleware('auth:sanctum');
    // 2. Menambahkan job order ke manifest
    Route::post('/manifests/{manifestId}/add-job-orders', [ManifestController::class, 'addJobOrders'])->name('api.manifests.add-job-orders')->withoutMiddleware('auth:sanctum');
    // 3. Menghapus job order dari manifest
    Route::post('/manifests/{manifestId}/remove-job-orders', [ManifestController::class, 'removeJobOrders'])->name('api.manifests.remove-job-orders')->withoutMiddleware('auth:sanctum');
    // 4. Membatalkan manifest
    Route::post('/manifests/{manifestId}/cancel', [ManifestController::class, 'cancel'])->name('api.manifests.cancel')->withoutMiddleware('auth:sanctum');
    // 5. Update status manifest saja (untuk Berangkat/Depart, Arrived, Completed)
    Route::patch('/manifests/{manifestId}/status', [ManifestController::class, 'updateStatus'])->name('api.manifests.update-status')->withoutMiddleware('auth:sanctum');

    // Manifests (apiResource)
    Route::apiResource('manifests', ManifestController::class)
        ->parameters(['manifests' => 'manifestId'])
        ->names([
            'index' => 'api.manifests.index', // --> GET /api/manifests
            'store' => 'api.manifests.store', // --> POST /api/manifests
            'show' => 'api.manifests.show', // --> GET /api/manifests/{manifestId}
            'update' => 'api.manifests.update', // --> PUT /api/manifests/{manifestId}
            'destroy' => 'api.manifests.destroy', // --> DELETE /api/manifests/{manifestId}
        ])->withoutMiddleware('auth:sanctum');

    // Additional Delivery Order routes:
    // 1. Menugaskan driver dan kendaraan ke delivery order
    Route::post('/delivery-orders/{doId}/assign-driver', [DeliveryOrderController::class, 'assignDriverToDO'])->name('api.delivery-orders.assign-driver')->withoutMiddleware('auth:sanctum'); // ada
    // 2. Complete delivery order
    Route::post('/delivery-orders/{doId}/complete', [DeliveryOrderController::class, 'completeDeliveryOrder'])->name('api.delivery-orders.complete')->withoutMiddleware('auth:sanctum'); // ada
    // 3. Cancel delivery order
    Route::post('/delivery-orders/{doId}/cancel', [DeliveryOrderController::class, 'cancel'])->name('api.delivery-orders.cancel')->withoutMiddleware('auth:sanctum');

    // Delivery Orders (apiResource)
    Route::apiResource('delivery-orders', DeliveryOrderController::class)
        ->parameters(['delivery-orders' => 'doId'])
        ->names([
            'index' => 'api.delivery-orders.index', // --> GET /api/delivery-orders
            'store' => 'api.delivery-orders.store', // --> POST /api/delivery-orders
            'show' => 'api.delivery-orders.show', // --> GET /api/delivery-orders/{doId}
            'update' => 'api.delivery-orders.update', // --> PUT /api/delivery-orders/{doId}
            'destroy' => 'api.delivery-orders.destroy', // --> DELETE /api/delivery-orders/{doId}
        ])->withoutMiddleware('auth:sanctum');

    // Additional Invoice routes:
    // 1. Mendapatkan sumber invoice yang tersedia untuk membuat invoice baru
    Route::get('/invoices/available-sources', [InvoiceController::class, 'getAvailableSources'])->name('api.invoices.available-sources')->withoutMiddleware('auth:sanctum'); // ada
    // 2. Menandai invoice sebagai sudah dibayar
    Route::post('/invoices/{invoiceId}/record-payment', [InvoiceController::class, 'recordPayment'])->name('api.invoices.record-payment')->withoutMiddleware('auth:sanctum'); // ada
    // 3. Membatalkan invoice
    Route::post('/invoices/{invoiceId}/cancel', [InvoiceController::class, 'cancel'])->name('api.invoices.cancel')->withoutMiddleware('auth:sanctum');
    // 4. Mendapatkan statistik invoice
    Route::get('/invoices/stats', [InvoiceController::class, 'getStats'])->name('api.invoices.stats')->withoutMiddleware('auth:sanctum'); // ada
    // 5. Generate PDF invoice
    Route::get('/invoices/{invoiceId}/pdf', [InvoiceController::class, 'generatePdf'])->name('api.invoices.pdf')->withoutMiddleware('auth:sanctum');

    // Invoices (apiResource)
    Route::apiResource('invoices', InvoiceController::class)
        ->parameters(['invoices' => 'invoiceId'])
        ->names([
            'index' => 'api.invoices.index', // --> GET /api/invoices
            'store' => 'api.invoices.store', // --> POST /api/invoices
            'show' => 'api.invoices.show', // --> GET /api/invoices/{invoiceId}
            'update' => 'api.invoices.update', // --> PUT /api/invoices/{invoiceId}
            'destroy' => 'api.invoices.destroy', // --> DELETE /api/invoices/{invoiceId}
        ])->withoutMiddleware('auth:sanctum');

    // GPS Tracking (Read-Only untuk Admin Panel):
    // 1. Mendapatkan lokasi terkini semua driver (Real Time Tracking Page)
    Route::get('/gps/current', [GpsController::class, 'getCurrentLocations'])->name('api.gps.current');
    // 2. Mendapatkan riwayat tracking GPS untuk order tertentu (History Route)
    Route::get('/gps/tracking-history', [GpsController::class, 'getTrackingHistory'])->name('api.gps.tracking-history');
    // 3. Mendapatkan live tracking untuk delivery order spesifik
    Route::get('/gps/live/{doId}', [GpsController::class, 'getLiveTracking'])->name('api.gps.live');

    // NOTE: Method bulkStore() dipindah ke DriverAppController (akan dibuat nanti)
    // Karena ini adalah WRITE operation yang hanya boleh dilakukan dari Mobile App Driver

    // Dashboard - Single endpoint untuk semua data dashboard READ ONLY
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('api.dashboard.index')->withoutMiddleware('auth:sanctum');

    // Reports - Read-Only endpoints untuk analytics
    Route::get('/reports/sales', [ReportController::class, 'sales'])->name('api.reports.sales')->withoutMiddleware('auth:sanctum');
    Route::get('/reports/financial', [ReportController::class, 'financial'])->name('api.reports.financial')->withoutMiddleware('auth:sanctum');
    Route::get('/reports/operational', [ReportController::class, 'operational'])->name('api.reports.operational')->withoutMiddleware('auth:sanctum');
    Route::get('/reports/customer-analytics', [ReportController::class, 'customerAnalytics'])->name('api.reports.customer-analytics')->withoutMiddleware('auth:sanctum');
    
    // Reports Export - Endpoints untuk export file (Excel/CSV)
    Route::get('/reports/sales/export', [ReportController::class, 'exportSales'])->name('api.reports.sales.export');
    Route::get('/reports/financial/export', [ReportController::class, 'exportFinancial'])->name('api.reports.financial.export');
    Route::get('/reports/operational/export', [ReportController::class, 'exportOperational'])->name('api.reports.operational.export');
    Route::get('/reports/customer-analytics/export', [ReportController::class, 'exportCustomerAnalytics'])->name('api.reports.customer-analytics.export');
    
    // Reports Export - PDF Analytics Report
    Route::get('/reports/analytics/pdf', [ReportController::class, 'exportAnalyticsPdf'])->name('api.reports.analytics.pdf')->withoutMiddleware('auth:sanctum');


    // ============================================
    // DRIVER MOBILE APP ROUTES
    // ============================================
    // Prefix: /api/driver
    // Authentication: Sanctum Bearer Token
    // Platform: Mobile App Flutter (Android/iOS)

    Route::prefix('driver')->name('driver.')->group(function () {
        // Authentication
        Route::post('/login', [DriverAppController::class, 'login'])->withoutMiddleware('auth:sanctum')->name('login');
        Route::post('/logout', [DriverAppController::class, 'logout'])->name('logout');
        
        // Profile Management
        Route::get('/profile', [DriverAppController::class, 'getProfile'])->name('profile');
        Route::put('/status', [DriverAppController::class, 'updateDriverStatus'])->name('status.update');
        Route::put('/fcm-token', [DriverAppController::class, 'updateFcmToken'])->name('fcm-token.update');
        
        // Job Management
        Route::get('/jobs', [DriverAppController::class, 'getJobs'])->name('jobs.index');
        Route::get('/jobs/{jobOrderId}', [DriverAppController::class, 'getJobDetails'])->name('jobs.show');
        Route::post('/jobs/{jobOrderId}/accept', [DriverAppController::class, 'acceptOrder'])->name('jobs.accept');
        Route::post('/jobs/{jobOrderId}/reject', [DriverAppController::class, 'rejectOrder'])->name('jobs.reject');
        Route::put('/jobs/{jobOrderId}/status', [DriverAppController::class, 'updateJobStatus'])->name('jobs.status.update');
        
        // Proof of Delivery
        Route::post('/jobs/{jobOrderId}/pod', [DriverAppController::class, 'uploadPod'])->name('pod.upload');
        
        // QR Code Scanning
        Route::post('/scan-qr', [DriverAppController::class, 'scanQrCode'])->name('qr.scan');
        
        // GPS Location Updates
        Route::post('/gps/bulk', [DriverAppController::class, 'bulkStoreGps'])->name('gps.bulk');
        
        // Job History & Statistics
        Route::get('/history', [DriverAppController::class, 'getJobHistory'])->name('history');
        Route::get('/history/stats', [DriverAppController::class, 'getHistoryStats'])->name('history.stats');
        
        // Vehicle Selection (Driver pilih kendaraan setelah login)
        Route::get('/vehicles/available', [DriverAppController::class, 'getAvailableVehicles'])->name('vehicles.available');
        Route::post('/vehicles/select', [DriverAppController::class, 'selectVehicle'])->name('vehicles.select');
        
        // Vehicle Availability Check
        Route::get('/vehicles/{vehicleId}/check', [DriverAppController::class, 'checkVehicleAvailability'])->name('vehicles.check');
    });
});