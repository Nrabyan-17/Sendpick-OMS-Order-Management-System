<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

/**
 * AdminController - Controller untuk mengelola data Admin
 * 
 * Fungsi utama:
 * - Menampilkan daftar admin dengan pencarian dan filter
 * - Membuat admin baru dengan role tertentu
 * - Melihat detail admin
 * - Mengupdate data admin
 * - Menghapus admin
 * - Mengubah status aktif/nonaktif admin
 */
class AdminController extends Controller
{
    /**
     * Menampilkan daftar admin dengan fitur pencarian dan filter
     * 
     * Fitur yang tersedia:
     * - Pencarian berdasarkan nama, email, atau user_id
     * - Filter berdasarkan role
     * - Pagination dengan default 15 item per halaman
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        // Inisialisasi variabel query untuk mengambil data admin & role dari database.
        $query = Admin::with('roles');

        // Pencarian input teks berdasarkan nama, email, atau user_id
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                ->orWhere('email', 'ILIKE', "%{$search}%")
                ->orWhere('user_id', 'ILIKE', "%{$search}%");
            });
        }

        // Filter berdasarkan role
        if ($request->filled('role_id')) {
            $query->whereHas('roles', function($q) use ($request) {
                $q->where('role_id', $request->role_id);
            });
        }

        // Pagination dengan default 15 item per halaman
        $perPage = $request->get('per_page', 15);
        $admins = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Kembalikan response sukses dengan data admin dan info pagination
        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar admin',
            'data' => $admins->items(),
            'pagination' => [
                'current_page' => $admins->currentPage(),
                'per_page' => $admins->perPage(),
                'total' => $admins->total(),
                'last_page' => $admins->lastPage()
            ]
        ], 200);
    }

    /**
     * Membuat admin baru dengan validasi ketat
     * 
     * Proses yang dilakukan:
     * - Validasi input (nama, email unik, password kompleks, role)
     * - Generate user_id otomatis dengan format USR-XXXXXXXX
     * - Hash password untuk keamanan
     * - Assign role sesuai yang dipilih
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {

            // Validasi input request
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:admin,email',
                'password' => [
                    'required',
                    'confirmed',
                    Password::min(8)->letters()->mixedCase()->numbers()
                ],
                'role_ids' => 'required|array',
                'role_ids.*' => 'exists:roles,id',
                'phone' => 'nullable|string|max:20',
                'department' => 'nullable|string|max:255',
            ]);
    
            // Generate unique user_id secara otomatis
            $userId = 'USR-' . strtoupper(Str::random(8));
            while (Admin::where('user_id', $userId)->exists()) {
                $userId = 'USR-' . strtoupper(Str::random(8));
            }
    
            // Buat data admin baru ke database
            $admin = Admin::create([
                'user_id' => $userId,
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'department' => $request->department,
            ]);
    
            // Assign rolenya sesuai yang dipilih.
            $admin->roles()->attach($request->role_ids);
    
            // Kembalikan response sukses dengan data admin yang berhasil dibuat.
            return response()->json([
                'success' => true,
                'message' => 'Admin created successfully',
                'data' => $admin->load('roles')
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat data admin',
                'error' => $e->getMessage()
            ], 500);

        }
    }

    /**
     * Display the specified admin
     * 
     * @param string $userId
     * @return JsonResponse
     */
    public function show(string $userId): JsonResponse
    {
        // Cari admin berdasarkan user_id yang diberikan
        $admin = Admin::with('roles')->where('user_id', $userId)->first();

        // Jika data Admin tidak ditemukan, kembalikan pesan error.
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak ditemukan'
            ], 404);
        }

        // Kembalikan response sukses dengan data Admin yang berhasil ditemukan.
        return response()->json([
            'success' => true,
            'data' => $admin
        ], 200);
    }

    /**
     * Update admin berdasarkan id yg spesifik
     * 
     * @param Request $request
     * @param string $userId
     * @return JsonResponse
     */
    public function update(Request $request, string $userId): JsonResponse
    {
        // Cari admin berdasarkan user_id yang diberikan
        $admin = Admin::where('user_id', $userId)->first();

        // Jika data admin tidak ditemukan, kembalikan pesan kesalahan
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak ditemukan'
            ], 404);
        }

        // Validasi input
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('admin', 'email')->ignore($admin->user_id, 'user_id')
            ],
            'password' => [
                'nullable',
                'confirmed',
                Password::min(8)->letters()->mixedCase()->numbers()
            ],
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id',
            'phone' => 'nullable|string|max:20',
            'department' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ]);

        // Jika data berhasil diupdate, simpan data nama & email admin
        $admin->name = $request->name;
        $admin->email = $request->email;
        $admin->phone = $request->phone;
        $admin->department = $request->department;

        if ($request->filled('status')) {
            $admin->status = $request->status;
        }

        // Update password jika diisi oleh Admin
        if ($request->filled('password')) {
            $admin->password = Hash::make($request->password);
        }

        // Simpan perubahan ke dlm database
        $admin->save();

        // Sync roles
        $admin->roles()->sync($request->role_ids);

        // Kembalikan response sukses dengan data admin yang berhasil diperbarui.
        return response()->json([
            'success' => true,
            'message' => 'Data Admin berhasil diubah',
            'data' => $admin->load('roles')
        ], 200);
    }

    /**
     * Remove the specified admin
     * 
     * @param string $userId
     * @return JsonResponse
     */
    public function destroy(string $userId): JsonResponse
    {
        // Cari admin berdasarkan user_id yang diberikan dari database
        $admin = Admin::where('user_id', $userId)->first();

        // Jika data admin tidak ditemukan, kembalikan pesan kesalahan
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak ditemukan'
            ], 404);
        }

        // Cek apakah admin memiliki catatan yang terkait (job orders, manifests, delivery orders, invoices)
        $hasJobOrders = $admin->jobOrders()->exists();
        $hasManifests = $admin->manifests()->exists();
        $hasDeliveryOrders = $admin->deliveryOrders()->exists();
        $hasInvoices = $admin->invoices()->exists();

        // Jika admin memiliki catatan yang terkait, maka tidak bisa menghapus data.
        if ($hasJobOrders || $hasManifests || $hasDeliveryOrders || $hasInvoices) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus admin. Admin memiliki catatan yang terkait.'
            ], 422);
        }

        // Hapus data admin dari database
        $admin->delete();

        // Kembalikan response sukses dengan pesan "Data Admin berhasil dihapus".
        return response()->json([
            'success' => true,
            'message' => 'Data Admin berhasil dihapus'
        ], 200);
    }

    /**
     * Mengambil semua roles yang tersedia untuk admin
     * 
     * @return JsonResponse
     */
    public function getRoles(): JsonResponse
    {
        // Ambil semua data roles dari database.
        $roles = Role::select('id', 'name', 'description')->get();

        // Kembalikan response sukses dengan data roles yang diambil.
        return response()->json([
            'success' => true,
            'data' => $roles
        ], 200);
    }
}