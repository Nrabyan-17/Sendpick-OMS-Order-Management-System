<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VehicleTypes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * VehicleTypeController - Controller untuk mengelola Tipe Kendaraan
 * 
 * Fungsi utama:
 * - Menampilkan daftar tipe kendaraan dengan pencarian
 * - Membuat tipe kendaraan baru (misal: Truck, Van, Motor)
 * - Update data tipe kendaraan dan spesifikasinya
 * - Menghapus tipe kendaraan
 * - Manage kapasitas muat dan dimensi per tipe
 * - Master data untuk vehicle management
 */
class VehicleTypeController extends Controller
{
    /**
     * Display a listing of vehicle types
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = VehicleTypes::query();

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                ->orWhere('description', 'ILIKE', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $vehicleTypes = $query->withCount('vehicles')->orderBy('name')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $vehicleTypes->items(),
            'pagination' => [
                'current_page' => $vehicleTypes->currentPage(),
                'per_page' => $vehicleTypes->perPage(),
                'total' => $vehicleTypes->total(),
                'last_page' => $vehicleTypes->lastPage()
            ]
        ], 200);
    }

    /**
     * Store a newly created vehicle type
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:vehicle_types,name',
            'description' => 'nullable|string',
            'capacity_min_kg' => 'nullable|numeric|min:0',
            'capacity_max_kg' => 'nullable|numeric|min:0|gte:capacity_min_kg',
            'volume_min_m3' => 'nullable|numeric|min:0',
            'volume_max_m3' => 'nullable|numeric|min:0|gte:volume_min_m3',
            'status' => 'in:Aktif,Tidak Aktif'
        ]);

        $vehicleType = VehicleTypes::create([
            'name' => $request->name,
            'description' => $request->description,
            'capacity_min_kg' => $request->capacity_min_kg,
            'capacity_max_kg' => $request->capacity_max_kg,
            'volume_min_m3' => $request->volume_min_m3,
            'volume_max_m3' => $request->volume_max_m3,
            'status' => $request->status ?? 'Aktif'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Vehicle type created successfully',
            'data' => $vehicleType
        ], 201);
    }

    /**
     * Display the specified vehicle type
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $vehicleType = VehicleTypes::with('vehicles')->find($id);

        if (!$vehicleType) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle type not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $vehicleType
        ], 200);
    }

    /**
     * Update the specified vehicle type
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $vehicleType = VehicleTypes::find($id);

        if (!$vehicleType) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle type not found'
            ], 404);
        }

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('vehicle_types', 'name')->ignore($id)
            ],
            'description' => 'nullable|string',
            'capacity_min_kg' => 'nullable|numeric|min:0',
            'capacity_max_kg' => 'nullable|numeric|min:0|gte:capacity_min_kg',
            'volume_min_m3' => 'nullable|numeric|min:0',
            'volume_max_m3' => 'nullable|numeric|min:0|gte:volume_min_m3',
            'status' => 'in:Aktif,Tidak Aktif'
        ]);

        $vehicleType->update($request->only([
            'name',
            'description',
            'capacity_min_kg',
            'capacity_max_kg',
            'volume_min_m3',
            'volume_max_m3',
            'status'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Vehicle type updated successfully',
            'data' => $vehicleType
        ], 200);
    }

    /**
     * Remove the specified vehicle type
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $vehicleType = VehicleTypes::find($id);

        if (!$vehicleType) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle type not found'
            ], 404);
        }

        // Check if vehicle type has associated vehicles
        $hasVehicles = $vehicleType->vehicles()->exists();

        if ($hasVehicles) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete vehicle type. It has associated vehicles.'
            ], 422);
        }

        $vehicleType->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vehicle type deleted successfully'
        ], 200);
    }

    /**
     * Mengambil daftar tipe kendaraan yang statusnya masih 'Aktif'.
     * 
     * @return JsonResponse
     */
    public function getActive(): JsonResponse
    {
        $vehicleTypes = VehicleTypes::where('status', 'Aktif')
            ->select('id', 'name', 'capacity_min_kg', 'capacity_max_kg', 'volume_min_m3', 'volume_max_m3')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $vehicleTypes
        ], 200);
    }
}