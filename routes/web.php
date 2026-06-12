<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\Api\ReportController;

Route::get('/login', function () {
    return view('welcome');
})->name('login');

Route::get('/auth/forgot-password', function () {
    return view('welcome');
})->name('password.request');

Route::get('/dashboard', function () {
    return view('dashboard.index');
})->name('dashboard');

// Add fallback route for SPA navigation
Route::get('/job-orders', function () {
    return view('dashboard.index');
})->name('job-orders');

// ========================================
// PDF Print Routes (Public - No Auth)
// ========================================
// Cetak Delivery Order ke PDF
Route::get('/print/delivery-order/{doId}', [PdfController::class, 'printDeliveryOrder'])
    ->name('print.delivery-order');

// Cetak Manifest ke PDF
Route::get('/print/manifest/{manifestId}', [PdfController::class, 'printManifest'])
    ->name('print.manifest');

// Export Analytics Report ke PDF (from Report & Analytics page)
Route::get('/reports/analytics/pdf', [ReportController::class, 'exportAnalyticsPdf'])
    ->name('reports.analytics.pdf');

require __DIR__.'/auth.php';
