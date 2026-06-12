<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customers;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * CustomerController - Controller untuk mengelola data Customer/Pelanggan
 * 
 * Fungsi utama:
 * - Menampilkan daftar customer dengan pencarian dan filter
 * - Membuat customer baru dengan kode otomatis
 * - Melihat detail customer
 * - Mengupdate data customer
 * - Menghapus customer
 * - Filter berdasarkan status dan tipe customer
 */
class CustomerController extends Controller
{
    /**
     * Menampilkan daftar customer dengan fitur pencarian dan filter
     * 
     * Fitur yang tersedia:
     * - Pencarian berdasarkan nama customer, kode, kontak, email, atau telepon
     * - Filter berdasarkan status (aktif/nonaktif)
     * - Filter berdasarkan tipe customer
     * - Pagination dengan default 15 item per halaman
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {

        $perPage = $request->input('per_page', 15);
        $status = $request->input('status');
        $customerType = $request->input('customer_type');
        $search = $request->input('search');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');

        // Membuat variabel query untuk mengambil data customer dari database
        $query = Customers::query();

        // Filter berdasarkan status
        if ($status) {
            $query->where('status', $status);
        }

        // Filter berdasarkan tipe customer
        if ($customerType) {
            $query->whereRaw('LOWER(customer_type) = ?', [strtolower($customerType)]);
        }

        // Pencarian input teks berdasarkan nama, kode, kontak, email, atau no. telepon customer
        if ($search) {
            $query->where(function($q) use ($search) {
            $q->where('customer_name', 'ILIKE', "%{$search}%")
                ->orWhere('customer_code', 'ILIKE', "%{$search}%")
                ->orWhere('contact_name', 'ILIKE', "%{$search}%")
                ->orWhere('email', 'ILIKE', "%{$search}%")
                ->orWhere('phone', 'ILIKE', "%{$search}%");
            });
        }

        // Sorting(tambahan)
        $allowedSorts = ['customer_name', 'customer_code', 'created_at', 'customer_type', 'status'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->latest(); // Default: latest created_at
        }

        $customers = $query->paginate($perPage);

        // Mengembalikan response JSON dengan data customer dan informasi pagination
        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar customer',
            'data' => $customers,
            'meta' => [
                'total' => $customers->total(),
                'per_page' => $customers->perPage(),
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
            ]
        ], 200);
    }

    /**
     * Store a newly created customer
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        // Validasi input data
        $validator = Validator::make($request->all(), [
            'customer_code' => [
                'nullable',
                'string',
                'max:50',
                'unique:customers,customer_code'
            ],
        'customer_name' => 'required|string|max:255',
        'customer_type' => 'nullable|string|max:100',
        'contact_name' => 'nullable|string|max:255',
        'phone' => 'nullable|string|max:20',
        'email' => 'nullable|email|max:255',
        'address' => 'nullable|string',
        'status' => ['nullable', Rule::in(['Aktif', 'Nonaktif'])],
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation error',
            'errors' => $validator->errors()
        ], 422);
    }

        // Buat data customer baru
        $customer = Customers::create([
            'customer_id' => Customers::generateCustomerId(),
            'customer_name' => $request->customer_name,
            'customer_code' => $request->customer_code ?? Customers::generateCustomerCode(),
            'customer_type' => $request->customer_type,
            'contact_name' => $request->contact_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'address' => $request->address,
            'status' => $request->status ?? 'Aktif'
        ]);

        // Kembalikan response sukses dengan data customer yang baru dibuat
        return response()->json([
            'success' => true,
            'message' => 'Customer berhasil dibuat',
            'data' => $customer
        ], 201);
    }

    /**
     * Display the specified customer
     * 
     * Supports conditional eager loading via 'include' parameter
     * Example: ?include=jobOrders,invoices
     * 
     * @param Request $request
     * @param string $customerId
     * @return JsonResponse
     */
    public function show(Request $request, string $customerId): JsonResponse
    {
        // Query builder
        $query = Customers::query();

        // Conditional eager loading berdasarkan query parameter
        $includeRelations = $request->input('include', '');
        
        if ($includeRelations) {
            $relations = explode(',', $includeRelations);
            $allowedRelations = ['jobOrders', 'deliveryOrders', 'invoices'];
            
            $validRelations = array_intersect($relations, $allowedRelations);
            
            if (!empty($validRelations)) {
                $query->with($validRelations);
            }
        }

        // Ambil data customer berdasarkan customer_id
        $customer = $query->where('customer_id', $customerId)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil detail customer',
            'data' => $customer
        ], 200);
    }

    /**
     * Update the specified customer
     * 
     * @param Request $request
     * @param string $customerId
     * @return JsonResponse
     */
    public function update(Request $request, string $customerId): JsonResponse
    {
        // Ambil data customer yang akan diupdate dari database berdasarkan customer_id
        $customer = Customers::where('customer_id', $customerId)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer tidak ditemukan'
            ], 404);
        }

        // Validasi input data pada form
        $validator = Validator::make($request->all(), [
            'customer_name' => 'sometimes|required|string|max:255',
            'customer_code' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
                Rule::unique('customers', 'customer_code')->ignore($customer->customer_id, 'customer_id')
            ],
            'customer_type' => 'nullable|string|max:100',
            'contact_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'status' => ['nullable', Rule::in(['Aktif', 'Nonaktif'])]
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Jika validasi berhasil, update data customer ke database
        // Filter data yang akan diupdate, hanya ambil yang tidak null
        $dataToUpdate = array_filter($request->only([
            'customer_name',
            'customer_code',
            'customer_type',
            'contact_name',
            'phone',
            'email',
            'address',
            'status'
        ]), function ($value) {
            return !is_null($value) && $value !== '';
        });

        // Jika validasi berhasil, update data customer ke database
        $customer->update($dataToUpdate);

        return response()->json([
            'success' => true,
            'message' => 'Customer berhasil diupdate',
            'data' => $customer->fresh()
        ], 200);
    }

    /**
     * Remove the specified customer
     * 
     * @param string $customerId
     * @return JsonResponse
     */
    public function destroy(string $customerId): JsonResponse
    {
        // Ambil data customer yang akan dihapus dari database berdasarkan customer_id
        $customer = Customers::where('customer_id', $customerId)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer tidak ditemukan'
            ], 404);
        }

        // Cek apakah customer memiliki relasi dengan job orders atau delivery orders
        if ($customer->jobOrders()->exists() || $customer->deliveryOrders()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus customer yang memiliki Job Order atau Delivery Order aktif'
            ], 409); // 409 Conflict - lebih sesuai untuk dependency conflict
        }

        // Hapus data customer dari database
        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer berhasil dihapus'
        ], 200);
    }
}