# Sistem Autentikasi SendPick OMS

## 📋 Overview

Sistem autentikasi untuk SendPick menggunakan **Laravel Sanctum** dengan token-based authentication. Admin login melalui form login web, mendapatkan token API, dan token tersebut digunakan untuk mengakses semua endpoint yang memerlukan autentikasi.

---

## 🔐 Alur Autentikasi

### 1. **Login Process**
```
User Input Credentials
    ↓
Frontend POST → /api/auth/login
    ↓
Backend Validate (Email + Password)
    ↓
Generate API Token (valid 7 hari)
    ↓
Return Token + User Data
    ↓
Frontend Save to localStorage
    ↓
Set Authorization Header
    ↓
Redirect to Dashboard
```

### 2. **Authenticated Requests**
```
User Navigate Dashboard
    ↓
Frontend Get Token from localStorage
    ↓
Attach "Authorization: Bearer {token}" Header
    ↓
Backend Verify Token (Sanctum Middleware)
    ↓
Return Protected Data
```

### 3. **Logout Process**
```
User Click Logout
    ↓
Frontend POST → /api/auth/logout
    ↓
Backend Delete Current Token
    ↓
Frontend Clear localStorage
    ↓
Redirect to Login Page
```

---

## 🛠️ Komponen yang Telah Diimplementasikan

### **Backend (Laravel)**

#### 1. **AuthController** (`app/Http/Controllers/Api/AuthController.php`)
- `login()` - Validasi kredensial, generate token
- `logout()` - Hapus token aktif
- `me()` - Get authenticated user data

#### 2. **Admin Model** (`app/Models/Admin.php`)
- Menggunakan `HasApiTokens` trait dari Sanctum
- Password di-hash otomatis dengan bcrypt
- Relasi dengan Role, JobOrder, Manifest, dll

#### 3. **Routes** (`routes/api.php`)
```php
// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes (require auth:sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    // ... all other routes
});
```

### **Frontend (React)**

#### 1. **LoginForm** (`resources/js/features/auth/components/LoginForm.jsx`)
- Form login dengan email & password
- Hit API /auth/login
- Save token & user data ke localStorage
- Error handling dengan alert merah
- Auto-redirect ke dashboard saat sukses

#### 2. **Axios Bootstrap** (`resources/js/bootstrap.js`)
- Auto-attach token dari localStorage ke setiap request
- Interceptor untuk handle 401 Unauthorized
- Auto-redirect ke login jika token expired/invalid

#### 3. **Dashboard Protection** (`resources/views/dashboard/index.blade.php`)
- Client-side check: redirect jika tidak ada token
- Mencegah akses dashboard tanpa login

---

## 📝 Testing Guide

### **Test 1: Login dengan Admin yang Sudah Terdaftar**

1. Pastikan ada user di tabel `admin`:
```sql
SELECT * FROM admin;
```

2. Buka halaman login: `http://localhost:8000`

3. Input credentials:
   - Email: `admin@sendpick.com` (atau email admin yang ada)
   - Password: (password yang di-set saat create admin)

4. Klik "Login Now"

5. **Expected Result:**
   - Redirect ke `/dashboard`
   - Token tersimpan di localStorage (cek DevTools → Application → Local Storage)
   - User data tersimpan di localStorage

### **Test 2: Login dengan Kredensial Salah**

1. Input email/password yang salah
2. **Expected Result:**
   - Alert merah muncul: "Kredensial yang diberikan tidak valid."
   - Tidak ada redirect
   - Tidak ada token tersimpan

### **Test 3: Akses Dashboard Tanpa Login**

1. Buka DevTools → Application → Local Storage
2. Hapus `auth_token`
3. Navigate ke `/dashboard`
4. **Expected Result:**
   - Auto-redirect ke halaman login (`/`)

### **Test 4: Token Expired / Invalid**

1. Buka DevTools → Application → Local Storage
2. Edit `auth_token` jadi nilai random
3. Navigate atau refresh dashboard
4. **Expected Result:**
   - Backend return 401
   - Interceptor catch error
   - Auto-clear localStorage
   - Redirect ke login

---

## 🔧 Troubleshooting

### **Problem: "Kredensial yang diberikan tidak valid" muncul terus**

**Solusi:**
1. Cek apakah email benar-benar ada di database:
```sql
SELECT * FROM admin WHERE email = 'your@email.com';
```

2. Cek apakah password di-hash dengan benar:
   - Password yang disimpan harus format bcrypt: `$2y$...`
   - Jika password plain text, update dengan:
```sql
UPDATE admin SET password = '$2y$10$...' WHERE email = 'your@email.com';
```
   - Atau buat user baru lewat seeder

### **Problem: Masuk dashboard tapi data tidak muncul**

**Solusi:**
1. Cek DevTools Console untuk error 401
2. Pastikan token valid dengan hit endpoint:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/auth/me
```

### **Problem: Redirect loop antara login dan dashboard**

**Solusi:**
1. Clear localStorage completely
2. Hard refresh (Ctrl + Shift + R)
3. Login ulang

---

## 🚀 Next Steps (Recommended)

1. **Buat Seeder untuk Admin Pertama**
   - File: `database/seeders/AdminSeeder.php`
   - Email: `admin@sendpick.com`
   - Password: `password` (di-hash otomatis)

2. **Implement "Forgot Password"**
   - Kirim email reset password
   - Token reset dengan expiry

3. **Add Logout Button di Sidebar**
   - Supaya user bisa logout tanpa clear localStorage manual

4. **Improve UX**
   - Add loading spinner saat redirect
   - Remember me checkbox
   - Show user name di topbar

5. **Security Enhancement**
   - Add rate limiting untuk login endpoint
   - Add CAPTCHA jika banyak failed attempts
   - Implement refresh token

---

## 📚 API Reference

### **POST /api/auth/login**

**Request:**
```json
{
  "email": "admin@sendpick.com",
  "password": "password123",
  "type": "admin"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "user_id": "USR001",
      "name": "Admin SendPick",
      "email": "admin@sendpick.com",
      "roles": ["Super Admin"]
    },
    "token": "1|AbCdEfGhIjKlMnOpQrStUvWxYz...",
    "token_type": "Bearer",
    "user_type": "admin",
    "expires_at": "2025-01-04 12:00:00"
  }
}
```

**Response (Failed):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["Kredensial yang diberikan tidak valid."]
  }
}
```

### **POST /api/auth/logout**

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### **GET /api/auth/me**

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_type": "admin",
    "user": {
      "user_id": "USR001",
      "name": "Admin SendPick",
      "email": "admin@sendpick.com",
      "roles": ["Super Admin"],
      "created_at": "2024-12-01T10:00:00.000000Z",
      "updated_at": "2024-12-28T00:15:00.000000Z"
    }
  }
}
```

---

## ✅ Checklist Implementation

- [x] Backend AuthController (login, logout, me)
- [x] Admin Model dengan HasApiTokens
- [x] API Routes (public /login, protected /logout)
- [x] Frontend LoginForm dengan API integration
- [x] Token storage di localStorage
- [x] Axios interceptor untuk auth errors
- [x] Dashboard protection (client-side)
- [x] Error handling & user feedback
- [ ] Admin Seeder (perlu dibuat)
- [ ] Logout button di Sidebar (perlu ditambahkan)
- [ ] Server-side middleware protection (optional, sudah ada auth:sanctum)

---

## 📞 Support

Jika ada pertanyaan atau masalah, silakan hubungi developer atau cek dokumentasi Laravel Sanctum:
https://laravel.com/docs/10.x/sanctum
