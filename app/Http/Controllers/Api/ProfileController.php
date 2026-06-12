<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Storage;

/**
 * ProfileController - Controller untuk mengelola Profile Admin
 * 
 * Fungsi utama:
 * - Menampilkan profile admin yang sedang login
 * - Update profile data (nama, email)
 * - Ganti password dengan validasi keamanan
 * - Upload dan update foto profile
 * - Setting preferences dan notifikasi
 * - Activity log dan session history
 */
class ProfileController extends Controller
{
    /**
     * Get authenticated user profile
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getMyProfile(Request $request): JsonResponse
    {
        try {
            $admin = $request->user();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            // Untuk mengecek apakah relasi roles ada sebelum mengaksesnya
            $roles = [];
            if (method_exists($admin, 'roles')) {
                try {
                    $roles = $admin->roles()->get(['id', 'name', 'description']);
                } catch (\Exception $e) {
                    // Log the exception or handle it as needed
                    $roles = [];
                }
            }
        
            return response()->json([
                    'success' => true,
                    'message' => 'Profile retrieved successfully',
                    'data' => [
                        'user_id' => $admin->user_id,
                        'name' => $admin->name,
                        'email' => $admin->email,
                        'phone' => $admin->phone ?? null,           // ✅ TAMBAHKAN
                        'address' => $admin->address ?? null,       // ✅ TAMBAHKAN
                        'photo' => $admin->photo ?? null,           // ✅ TAMBAHKAN
                        'email_verified_at' => $admin->email_verified_at,
                        'roles' => $roles,
                        'created_at' => $admin->created_at,
                        'updated_at' => $admin->updated_at
                    ]
                ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil profile: ' . $e->getMessage()
            ], 500);
        }
        
    }

    /**
     * Update authenticated user profile
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateMyProfile(Request $request): JsonResponse
    {
        try {
            $admin = $request->user();

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            // ✅ Validate with additional fields
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'email' => [
                    'sometimes',
                    'required',
                    'email',
                    Rule::unique('admin', 'email')->ignore($admin->user_id, 'user_id')
                ],
                'phone' => 'nullable|string|max:20',           // ✅ TAMBAHKAN
                'address' => 'nullable|string|max:500',        // ✅ TAMBAHKAN
                'photo' => 'nullable|string|max:255',          // ✅ TAMBAHKAN (path foto)  
                'current_password' => 'required_with:new_password|string',
                'new_password' => [
                    'nullable',
                    'confirmed',
                    Password::min(8)->letters()->mixedCase()->numbers()
                ]
            ]);

            // ✅ Update basic information
            if ($request->filled('name')) {
                $admin->name = $request->name;
            }

            if ($request->filled('email')) {
                $admin->email = $request->email;
            }

            // ✅ Update additional profile fields
            if ($request->has('phone')) {
                $admin->phone = $request->phone;
            }

            if ($request->has('address')) {
                $admin->address = $request->address;
            }

            if ($request->hasFile('photo')) {
                // Delete old photo if exists
                if ($admin->photo && str_contains($admin->photo, '/storage/')) {
                    $oldPath = str_replace('/storage/', '', $admin->photo);
                    if (Storage::disk('public')->exists($oldPath)) {
                        Storage::disk('public')->delete($oldPath);
                    }
                }

                $path = $request->file('photo')->store('profile-photos', 'public');
                $admin->photo = '/storage/' . $path;
            } elseif ($request->filled('photo') && is_string($request->photo)) {
                // Fallback for string input (if not file upload)
                $admin->photo = $request->photo;
            }

            // ✅ Update password if provided
            if ($request->filled('new_password')) {
                // Verify current password
                // Note: Frontend must send 'current_password' for this to work securely.
                // If it's missing, validation at 113 might fail if we require it with new_password.
                if (!Hash::check($request->current_password, $admin->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Current password is incorrect'
                    ], 422);
                }

                $admin->password = Hash::make($request->new_password);
            }

            $admin->save();

            // ✅ Get roles safely
            $roles = [];
            if (method_exists($admin, 'roles')) {
                try {
                    $roles = $admin->roles()->get(['id', 'name', 'description']);
                } catch (\Exception $e) {
                    $roles = [];
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'user_id' => $admin->user_id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'phone' => $admin->phone,           // ✅ TAMBAHKAN
                    'address' => $admin->address,       // ✅ TAMBAHKAN
                    'photo' => $admin->photo,           // ✅ TAMBAHKAN
                    'roles' => $roles,
                    'updated_at' => $admin->updated_at
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memperbarui profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}