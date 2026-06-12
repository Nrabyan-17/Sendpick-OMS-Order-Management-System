<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * RoleController - Controller untuk mengelola Role/Peran Admin
 * 
 * Fungsi utama:
 * - Menampilkan daftar role dengan pencarian
 * - Membuat role baru dengan permissions tertentu
 * - Update role dan permissions yang dimiliki
 * - Menghapus role (dengan validasi usage)
 * - Assign/unassign admin ke role tertentu
 * - Manage access control dan authorization
 * - Master data untuk sistem permission
 */
class RoleController extends Controller
{
    /**
     * Display a listing of roles
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Role::query();

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                ->orWhere('description', 'ILIKE', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $roles = $query->withCount('admins')->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $roles->items(),
            'pagination' => [
                'current_page' => $roles->currentPage(),
                'per_page' => $roles->perPage(),
                'total' => $roles->total(),
                'last_page' => $roles->lastPage()
            ]
        ], 200);
    }

    /**
     * Store a newly created role
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string'
        ]);

        $role = Role::create([
            'name' => $request->name,
            'description' => $request->description
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Role created successfully',
            'data' => $role
        ], 201);
    }

    /**
     * Display the specified role
     * 
     * @param string $roleId
     * @return JsonResponse
     */
    public function show(string $roleId): JsonResponse
    {
        $role = Role::with('admins')->find($roleId);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $role
        ], 200);
    }

    /**
     * Update the specified role
     * 
     * @param Request $request
     * @param string $roleId
     * @return JsonResponse
     */
    public function update(Request $request, string $roleId): JsonResponse
    {
        $role = Role::find($roleId);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found'
            ], 404);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $roleId,
            'description' => 'nullable|string'
        ]);

        $role->update([
            'name' => $request->name,
            'description' => $request->description
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully',
            'data' => $role
        ], 200);
    }

    /**
     * Remove the specified role
     * 
     * @param string $roleId
     * @return JsonResponse
     */
    public function destroy(string $roleId): JsonResponse
    {
        $role = Role::find($roleId);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Role not found'
            ], 404);
        }

        // Check if role is assigned to any admin
        if ($role->admins()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete role. Role is currently assigned to one or more admins.'
            ], 422);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Role deleted successfully'
        ], 200);
    }

    /**
     * Get available roles for assignment (not system roles)
     * 
     * @return JsonResponse
     */
    public function getAvailableRoles(): JsonResponse
    {
        $roles = Role::select('id', 'name', 'description')
            ->withCount('admins')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $roles
        ], 200);
    }

    /**
     * Get role statistics
     * 
     * @return JsonResponse
     */
    public function getStats(): JsonResponse
    {
        $stats = [
            'total_roles' => Role::count(),
            'roles_with_admins' => Role::has('admins')->count(),
            'unused_roles' => Role::doesntHave('admins')->count(),
            'most_assigned_role' => Role::withCount('admins')->orderByDesc('admins_count')->first(),
            'recent_roles' => Role::latest()->take(5)->get(['id', 'name', 'created_at'])
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ], 200);
    }
}