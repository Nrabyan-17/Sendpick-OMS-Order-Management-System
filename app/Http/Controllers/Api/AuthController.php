<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Admin;
use App\Models\Drivers;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\JsonResponse;

/**
 * AuthController - Controller untuk mengelola autentikasi admin
 * 
 * Fungsi utama:
 * - Login admin (web) & driver (mobile) dengan email dan password
 * - Logout admin/driver dan menghapus token
 * - Validasi kredensial dan generate API token
 * - Manajemen session admin
 */
class AuthController extends Controller
{
    /**
     * Login untuk admin (web) & driver (Mobile) dengan validasi email dan password
     * 
     * Proses yang dilakukan:
     * - Validasi format email dan password
     * - Cek admin berdasarkan email
     * - Verifikasi password dengan Hash
     * - Generate API token untuk akses selanjutnya
     * - Return data admin dan role-nya
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'type' => 'required|in:admin,driver' // Ada kemungkinan nambah input baru di form
        ]);

        $user = null;
        $tokenName = '';
        $expiresAt = null;

        // Login sebagai Admin (Web)
        if ($request->type === 'admin') {
            $user = Admin::with('roles')->where('email', $request->email)->first();
            $tokenName = 'web-admin-token';
            $expiresAt = now()->addDays(7); // Token admin 7 hari

            // ✅ CEK: User ditemukan DAN password benar
            if ($user && Hash::check($request->password, $user->password)) {
                $user->update(['last_login' => now()]);
                $token = $user->createToken($tokenName, ['*'], $expiresAt)->plainTextToken;
                
                return response()->json([
                    'success' => true,
                    'message' => 'Login berhasil',
                    'data' => [
                        'user' => [
                            'user_id' => $user->user_id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'phone' => $user->phone,
                            'roles' => $user->roles->pluck('name')->values()->toArray(),
                        ],
                        'token' => $token,
                        'token_type' => 'Bearer',
                        'user_type' => 'admin',
                        'expires_at' => $expiresAt->toDateTimeString(),
                    ]
                ], 200);
            }

        // Login sebagai Driver (Mobile)
        } elseif ($request->type === 'driver') {
            $user = Drivers::where('email', $request->email)->first();
            $tokenName = 'mobile-driver-token';
            $expiresAt = now()->addYear(); // Token driver 1 tahun

            // ✅ CEK: User ditemukan DAN password benar
            if ($user && Hash::check($request->password, $user->password)) {
                $token = $user->createToken($tokenName, ['*'], $expiresAt)->plainTextToken;

                return response()->json([
                    'success' => true,
                    'message' => 'Login successful',
                    'data' => [
                        'user' => [
                            'driver_id' => $user->driver_id,
                            'driver_name' => $user->driver_name,
                            'email' => $user->email,
                            'phone' => $user->phone,
                            'status' => $user->status,
                        ],
                        'token' => $token,
                        'token_type' => 'Bearer',
                        'user_type' => 'driver',
                        'expires_at' => $expiresAt->toDateTimeString(),
                    ]
                ], 200);
            }
        }

        // Jika kredensial salah (email tidak ditemukan ATAU password salah)
        throw ValidationException::withMessages([
            'email' => ['Kredensial yang diberikan tidak valid.'],
        ]);
    }

    /**
     * Logout admin user
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        // Delete current access token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful'
        ], 200);
    }

    /**
     * Get authenticated user data
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        // Cek tipe user
        $userType = $user instanceof Admin ? 'admin' : 'driver';

        $userData = [
            'user_type' => $userType,
        ];

        // ← TAMBAHKAN: Format response berdasarkan tipe
        if ($userType === 'admin') {
        $userData['user'] = [
            'user_id' => $user->user_id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'roles' => $user->roles->pluck('name')->values()->toArray(),
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
        } else {
            $userData['user'] = [
                'driver_id' => $user->driver_id,
                'driver_name' => $user->driver_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status,
                'shift' => $user->shift,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ];
        }
        
        return response()->json([
            'success' => true,
            'data' => $userData
        ], 200);
    }

    /**
     * Verifikasi apakah email admin terdaftar di sistem
     * 
     * Step 1 dari flow Forgot Password:
     * - Cek apakah email ada di tabel admin
     * - Jika ada, return success + nama admin (untuk konfirmasi visual)
     * - Jika tidak, return error
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $admin = Admin::where('email', $request->email)->first();

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Email tidak terdaftar dalam sistem.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Email ditemukan.',
            'data' => [
                'name' => $admin->name,
            ]
        ], 200);
    }

    /**
     * Reset password admin secara langsung (tanpa token email)
     * 
     * Step 2 dari flow Forgot Password:
     * - Validasi email, password baru, dan konfirmasi
     * - Cek ulang apakah email ada
     * - Update password + hapus semua token Sanctum (force re-login)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $admin = Admin::where('email', $request->email)->first();

        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Email tidak terdaftar dalam sistem.',
            ], 422);
        }

        // Update password
        $admin->forceFill([
            'password' => Hash::make($request->password),
        ])->save();

        // Hapus semua token Sanctum yang ada (force re-login)
        $admin->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil direset. Silakan login dengan password baru.',
        ], 200);
    }
}