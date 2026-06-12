<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Drivers;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

/**
 * DriverController - Controller untuk mengelola data Driver/Sopir
 * 
 * Fungsi utama:
 * - Menampilkan daftar driver dengan pencarian dan filter berdasarkan status dan shift kerja
 * - Membuat driver baru dengan ID otomatis
 * - Melihat detail driver dan history performance
 * - Mengupdate data driver termasuk status dan shift
 * - Menghapus driver
 * - Mendapatkan daftar driver yang tersedia (tidak sedang assignment)
 * - Memperbarui lokasi terakhir driver
 * - Manajemen jadwal dan assignment driver
 */
class DriverController extends Controller
{
    /**
     * Menampilkan daftar driver dengan fitur pencarian dan filter
     * 
     * Fitur yang tersedia:
     * - Pencarian berdasarkan nama driver, telepon, email, atau driver ID
     * - Filter berdasarkan status (aktif, nonaktif, suspended)
     * - Filter berdasarkan shift kerja (pagi, siang, malam)
     * - Pagination dengan default 15 item per halaman
     * - Sorting berdasarkan tanggal pembuatan terbaru
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        // Mencari data driver.
        $query = Drivers::query();

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('driver_name', 'ILIKE', "%{$search}%")
                ->orWhere('phone', 'ILIKE', "%{$search}%")
                ->orWhere('email', 'ILIKE', "%{$search}%")
                ->orWhere('driver_id', 'ILIKE', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by shift
        if ($request->filled('shift')) {
            $query->where('shift', $request->shift);
        }

        // Eager load:
        // 1. assignedVehicle - directly assigned vehicle from vehicles.driver_id (from Vehicle List module)
        // 2. assignments - for fallback vehicle info from job order assignments
        $query->with(['assignedVehicle', 'assignments' => function($q) {
            $q->where('status', 'Active')
              ->whereHas('jobOrder', function($jq) {
                  $jq->whereNotIn('status', ['Completed', 'Cancelled']);
              })
              ->with('vehicle');
        }]);

        // Pagination
        $perPage = $request->get('per_page', 15);
        $drivers = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Transform data to include active_vehicle info
        $drivers->getCollection()->transform(function ($driver) {
            // Priority 1: Use directly assigned vehicle from Vehicle List (vehicles.driver_id)
            if ($driver->assignedVehicle) {
                $driver->active_vehicle_plate = $driver->assignedVehicle->plate_no;
                $driver->active_vehicle_name = $driver->assignedVehicle->brand . ' ' . $driver->assignedVehicle->model;
            } 
            // Priority 2: Fallback to active assignment vehicle
            else {
                $activeAssignment = $driver->assignments->first();
                if ($activeAssignment && $activeAssignment->vehicle) {
                    $driver->active_vehicle_plate = $activeAssignment->vehicle->plate_no;
                    $driver->active_vehicle_name = $activeAssignment->vehicle->brand . ' ' . $activeAssignment->vehicle->model;
                } else {
                    $driver->active_vehicle_plate = '-';
                    $driver->active_vehicle_name = '-';
                }
            }
            
            // Clean up relationships from response to keep it clean
            unset($driver->assignedVehicle);
            unset($driver->assignments);
            
            return $driver;
        });

        return response()->json([
            'success' => true,
            'data' => $drivers->items(),
            'pagination' => [
                'current_page' => $drivers->currentPage(),
                'per_page' => $drivers->perPage(),
                'total' => $drivers->total(),
                'last_page' => $drivers->lastPage()
            ]
        ], 200);
    }

    /**
     * Store a newly created driver
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'driver_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:drivers,phone',
            'email' => 'nullable|email|max:255|unique:drivers,email',
            'password' => 'required|string|min:8',
            'status' => 'in:Available,On Duty,Off Duty,Tidak Aktif',
            'shift' => 'nullable|string|max:50',
            'last_lat' => 'nullable|numeric|between:-90,90',
            'last_lng' => 'nullable|numeric|between:-180,180'
        ]);

        // Generate unique driver_id
        $driverId = 'DRV-' . strtoupper(Str::random(8));
        while (Drivers::where('driver_id', $driverId)->exists()) {
            $driverId = 'DRV-' . strtoupper(Str::random(8));
        }

        $driver = Drivers::create([
            'driver_id' => $driverId,
            'driver_name' => $request->driver_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'status' => $request->status ?? 'Available',
            'shift' => $request->shift,
            'last_lat' => $request->last_lat,
            'last_lng' => $request->last_lng
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Driver berhasil dibuat',
            'data' => $driver
        ], 201);
    }

    /**
     * Display the specified driver
     * 
     * @param string $driverId
     * @return JsonResponse
     */
    public function show(string $driverId): JsonResponse
    {
        $driver = Drivers::with(['assignments.jobOrder', 'assignments.vehicle', 'gpsLogs'])
            ->where('driver_id', $driverId)
            ->first();

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $driver
        ], 200);
    }

    /**
     * Update the specified driver
     * 
     * @param Request $request
     * @param string $driverId
     * @return JsonResponse
     */
    public function update(Request $request, string $driverId): JsonResponse
    {
        $driver = Drivers::where('driver_id', $driverId)->first();

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver not found'
            ], 404);
        }

        $request->validate([
            'driver_name' => 'required|string|max:255',
            'phone' => [
                'required',
                'string',
                'max:20',
                Rule::unique('drivers', 'phone')->ignore($driver->driver_id, 'driver_id')
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('drivers', 'email')->ignore($driver->driver_id, 'driver_id')
            ],
            'status' => 'in:Available,On Duty,Off Duty,Tidak Aktif',
            'shift' => 'nullable|string|max:50',
            'last_lat' => 'nullable|numeric|between:-90,90',
            'last_lng' => 'nullable|numeric|between:-180,180'
        ]);

        $driver->update($request->only([
            'driver_name',
            'phone',
            'email',
            'status',
            'shift',
            'last_lat',
            'last_lng'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Driver updated successfully',
            'data' => $driver
        ], 200);
    }

    /**
     * Remove the specified driver
     * 
     * @param string $driverId
     * @return JsonResponse
     */
    public function destroy(string $driverId): JsonResponse
    {
        $driver = Drivers::where('driver_id', $driverId)->first();

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver not found'
            ], 404);
        }

        // Check jika driver memiliki assignment aktif
        $hasActiveAssignments = $driver->assignments()->where('status', 'Active')->exists();

        if ($hasActiveAssignments) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa menghapus driver dengan assignment aktif'
            ], 422);
        }

        $driver->delete();

        return response()->json([
            'success' => true,
            'message' => 'Driver berhasil dihapus'
        ], 200);
    }

    /**
     * Get available drivers (not currently assigned)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getAvailable(Request $request): JsonResponse
    {

        $request->validate([
            'shift' => 'nullable|string|in:Pagi,Siang,Malam',
            'search' => 'nullable|string|max:100'
        ]);

        // Mendapatkan daftar driver yang statusnya 'Available' atau 'On Duty' dan tidak memiliki assignment aktif.
        // Logic: 
        // 1. Tidak assigned di Job Order aktif (via assignments table)
        // 2. Tidak assigned di Manifest aktif (via manifests table)
        
        $drivers = Drivers::whereIn('status', ['Available', 'On Duty'])
            ->whereDoesntHave('assignments', function($query) {
                // Cek assignment aktif yang job ordernya belum selesai
                $query->where('status', 'Active')
                      ->whereHas('jobOrder', function($q) {
                          $q->whereNotIn('status', ['Completed', 'Cancelled', 'Delivered']);
                      });
            })
            ->whereDoesntHave('manifests', function($query) {
                // Cek manifest yang belum selesai
                $query->whereNotIn('status', ['Completed', 'Cancelled', 'Delivered']);
            });

        if ($request->filled('shift')) {
            $drivers->where('shift', $request->shift);
        }

    if ($request->filled('search')) {
        $search = $request->search;
        $drivers->where(function($q) use ($search) {
            $q->where('driver_name', 'ILIKE', "%{$search}%")
            ->orWhere('phone', 'ILIKE', "%{$search}%")
            ->orWhere('driver_id', 'ILIKE', "%{$search}%");
        });
    }

        $driverss = $drivers->with('assignedVehicle')
            ->select([
            'driver_id',
            'driver_name',
            'phone',
            'status',
            'shift',
            'last_lat',
            'last_lng'
    ])
    ->orderBy('driver_name')
    ->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar driver tersedia',
            'data' => $driverss,
            'count' => $driverss->count()
        ], 200);
    }


    /**
     * Update driver location
     * 
     * @param Request $request
     * @param string $driverId
     * @return JsonResponse
     */
    // public function updateLocation(Request $request, string $driverId): JsonResponse
    // {
    //     $driver = Drivers::where('driver_id', $driverId)->first();

    //     if (!$driver) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Driver not found'
    //         ], 404);
    //     }

    //     $request->validate([
    //         'lat' => 'required|numeric|between:-90,90',
    //         'lng' => 'required|numeric|between:-180,180'
    //     ]);

    //     $driver->update([
    //         'last_lat' => $request->lat,
    //         'last_lng' => $request->lng
    //     ]);

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Driver location updated successfully',
    //         'data' => [
    //             'driver_id' => $driver->driver_id,
    //             'last_lat' => $driver->last_lat,
    //             'last_lng' => $driver->last_lng,
    //             'updated_at' => $driver->updated_at
    //         ]
    //     ], 200);
    // }
}