# 📱 Panduan Implementasi Push Notification Firebase

Dokumentasi lengkap untuk mengimplementasikan push notification di aplikasi SendPick Driver menggunakan Firebase Cloud Messaging (FCM).

---

## 📋 Daftar Isi

1. [Gambaran Umum](#gambaran-umum)
2. [Persiapan Firebase](#persiapan-firebase)
3. [Setup Flutter App](#setup-flutter-app)
4. [Setup Backend API](#setup-backend-api)
5. [Alur Kerja Sistem](#alur-kerja-sistem)
6. [Kode Implementasi](#kode-implementasi)
7. [Testing](#testing)

---

## 🎯 Gambaran Umum

### Arsitektur Sistem

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Admin Dashboard │ ──▶ │   Backend API   │ ──▶ │  Firebase FCM   │ ──▶ │   Driver App    │
│  (Web)          │     │   (Server)      │     │   (Cloud)       │     │   (Flutter)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
       │                        │                       │                       │
       │                        │                       │                       │
    Assign                   Simpan                  Kirim                   Terima
    Driver                   FCM Token               Notifikasi              Notifikasi
    ke Order                 Driver                                          + Accept/Reject
```

### Alur Singkat

1. **Driver login** → App mendapatkan FCM Token → Kirim ke API
2. **Admin assign order** → API request FCM → Firebase kirim notifikasi
3. **Driver terima notif** → Accept/Reject → Update ke API

---

## 🔥 Persiapan Firebase

### Langkah 1: Buat Project Firebase

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Klik **"Add Project"** atau **"Tambah Project"**
3. Masukkan nama project: `SendPick Driver`
4. Ikuti wizard sampai selesai

### Langkah 2: Tambahkan Android App

1. Di Firebase Console, klik ikon **Android** (robot hijau)
2. Isi form:
   - **Android package name**: `com.example.sendpick_app`
   - **App nickname**: `SendPick Driver App`
   - **Debug signing certificate**: (kosongkan untuk sekarang)
3. Klik **Register app**

### Langkah 3: Download google-services.json

1. Download file `google-services.json`
2. Pindahkan file tersebut ke folder:
   ```
   sendpick_app/
   └── android/
       └── app/
           └── google-services.json  ← TARUH DISINI
   ```

### Langkah 4: Konfigurasi Gradle

**File: `android/build.gradle.kts`**

Tambahkan di bagian `buildscript > dependencies`:
```kotlin
buildscript {
    dependencies {
        classpath("com.google.gms:google-services:4.4.0")
    }
}
```

**File: `android/app/build.gradle.kts`**

Tambahkan di bagian `plugins`:
```kotlin
plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")  // ← TAMBAHKAN INI
}
```

---

## 📦 Setup Flutter App

### Langkah 1: Install Dependencies

Jalankan command di terminal:
```bash
flutter pub add firebase_core firebase_messaging flutter_local_notifications
```

Atau tambahkan manual di `pubspec.yaml`:
```yaml
dependencies:
  firebase_core: ^3.8.1
  firebase_messaging: ^15.1.6
  flutter_local_notifications: ^18.0.1
```

Lalu jalankan:
```bash
flutter pub get
```

### Langkah 2: Inisialisasi Firebase di main.dart

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

// Handler untuk background message
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Background message: ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Inisialisasi Firebase
  await Firebase.initializeApp();
  
  // Set background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  runApp(const MyApp());
}
```

### Langkah 3: Buat Notification Service

Buat file baru: `lib/services/notification_service.dart`

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  // Simpan FCM Token
  String? fcmToken;

  /// Inisialisasi service
  Future<void> initialize() async {
    // Request permission (untuk iOS & Android 13+)
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    
    print('Permission status: ${settings.authorizationStatus}');

    // Get FCM Token
    fcmToken = await _messaging.getToken();
    print('FCM Token: $fcmToken');

    // Setup local notifications
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: android);
    await _localNotifications.initialize(initSettings);

    // Listen untuk foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Listen untuk user tap notifikasi (dari background)
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);
  }

  /// Dapatkan FCM Token untuk dikirim ke API
  Future<String?> getToken() async {
    fcmToken ??= await _messaging.getToken();
    return fcmToken;
  }

  /// Handle pesan saat app di foreground
  void _handleForegroundMessage(RemoteMessage message) {
    print('Foreground message: ${message.notification?.title}');
    
    // Tampilkan local notification
    _showLocalNotification(
      title: message.notification?.title ?? 'Notifikasi Baru',
      body: message.notification?.body ?? '',
      payload: message.data['order_id'],
    );
  }

  /// Handle saat user tap notifikasi
  void _handleMessageOpenedApp(RemoteMessage message) {
    print('User tapped notification: ${message.data}');
    
    // Navigate ke halaman order detail
    // Implementasi sesuai kebutuhan
  }

  /// Tampilkan local notification
  Future<void> _showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'order_channel',
      'Order Notifications',
      channelDescription: 'Notifikasi untuk order baru',
      importance: Importance.max,
      priority: Priority.high,
    );

    await _localNotifications.show(
      DateTime.now().millisecond,
      title,
      body,
      const NotificationDetails(android: androidDetails),
      payload: payload,
    );
  }
}
```

### Langkah 4: Simpan FCM Token saat Login

Di halaman login, setelah user berhasil login:

```dart
// Setelah login berhasil
final notifService = NotificationService();
await notifService.initialize();

String? fcmToken = await notifService.getToken();
String driverId = "DRIVER_001"; // ID driver dari response login

// Kirim ke API
await http.post(
  Uri.parse('https://api.sendpick.com/drivers/register-token'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'driver_id': driverId,
    'fcm_token': fcmToken,
  }),
);
```

---

## 🖥️ Setup Backend API (Laravel + React)

### Langkah 1: Install Firebase PHP SDK

```bash
composer require kreait/laravel-firebase
```

### Langkah 2: Publish Config

```bash
php artisan vendor:publish --provider="Kreait\Laravel\Firebase\ServiceProvider" --tag=config
```

### Langkah 3: Setup Firebase Credentials

1. Buka Firebase Console → Project Settings → Service Accounts
2. Klik **Generate new private key**
3. Download file JSON
4. Simpan di `storage/app/firebase/firebase-credentials.json`

> ⚠️ **PENTING**: Tambahkan ke `.gitignore`:
> ```
> storage/app/firebase/
> ```

### Langkah 4: Konfigurasi Environment

Tambahkan di file `.env`:

```env
FIREBASE_CREDENTIALS=storage/app/firebase/firebase-credentials.json
```

Update `config/firebase.php`:

```php
<?php

return [
    'credentials' => [
        'file' => storage_path('app/firebase/firebase-credentials.json'),
    ],
];
```

### Langkah 5: Migration untuk Driver Tokens

```bash
php artisan make:migration create_driver_tokens_table
```

**File: `database/migrations/xxxx_create_driver_tokens_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('driver_id')->unique();
            $table->text('fcm_token');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_tokens');
    }
};
```

Jalankan migration:
```bash
php artisan migrate
```

### Langkah 6: Buat Model

```bash
php artisan make:model DriverToken
```

**File: `app/Models/DriverToken.php`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DriverToken extends Model
{
    protected $fillable = ['driver_id', 'fcm_token'];
}
```

### Langkah 7: Buat Firebase Service

```bash
php artisan make:service FirebaseNotificationService
```

**File: `app/Services/FirebaseNotificationService.php`**

```php
<?php

namespace App\Services;

use App\Models\DriverToken;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Kreait\Firebase\Messaging\AndroidConfig;

class FirebaseNotificationService
{
    protected $messaging;

    public function __construct()
    {
        $factory = (new Factory)
            ->withServiceAccount(config('firebase.credentials.file'));
        
        $this->messaging = $factory->createMessaging();
    }

    /**
     * Kirim notifikasi ke driver berdasarkan driver_id
     */
    public function sendToDriver(string $driverId, array $orderData): array
    {
        // Ambil FCM token dari database
        $driverToken = DriverToken::where('driver_id', $driverId)->first();
        
        if (!$driverToken) {
            throw new \Exception('Driver token tidak ditemukan');
        }

        // Buat notifikasi
        $notification = Notification::create(
            '🚚 Order Baru!',
            "Anda ditugaskan untuk order {$orderData['order_id']}"
        );

        // Konfigurasi Android
        $androidConfig = AndroidConfig::fromArray([
            'priority' => 'high',
            'notification' => [
                'sound' => 'default',
                'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
            ],
        ]);

        // Buat message
        $message = CloudMessage::withTarget('token', $driverToken->fcm_token)
            ->withNotification($notification)
            ->withAndroidConfig($androidConfig)
            ->withData([
                'order_id' => $orderData['order_id'],
                'customer_name' => $orderData['customer_name'] ?? '',
                'type' => 'new_order',
            ]);

        // Kirim
        $result = $this->messaging->send($message);
        
        return [
            'success' => true,
            'message_id' => $result,
        ];
    }
}
```

### Langkah 8: Buat Controller

```bash
php artisan make:controller Api/DriverTokenController
php artisan make:controller Api/OrderController
```

**File: `app/Http/Controllers/Api/DriverTokenController.php`**

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverToken;
use Illuminate\Http\Request;

class DriverTokenController extends Controller
{
    /**
     * Register/Update FCM Token driver
     * POST /api/drivers/register-token
     */
    public function registerToken(Request $request)
    {
        $validated = $request->validate([
            'driver_id' => 'required|string',
            'fcm_token' => 'required|string',
        ]);

        $token = DriverToken::updateOrCreate(
            ['driver_id' => $validated['driver_id']],
            ['fcm_token' => $validated['fcm_token']]
        );

        return response()->json([
            'success' => true,
            'message' => 'FCM Token berhasil disimpan',
            'data' => $token,
        ]);
    }
}
```

**File: `app/Http/Controllers/Api/OrderController.php`**

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\FirebaseNotificationService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected $firebaseService;

    public function __construct(FirebaseNotificationService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }

    /**
     * Assign order ke driver (dipanggil dari Admin Dashboard)
     * POST /api/orders/{orderId}/assign
     */
    public function assignDriver(Request $request, $orderId)
    {
        $validated = $request->validate([
            'driver_id' => 'required|string',
        ]);

        // Update order di database
        $order = Order::findOrFail($orderId);
        $order->update([
            'driver_id' => $validated['driver_id'],
            'status' => 'assigned',
        ]);

        // Kirim notifikasi ke driver
        try {
            $result = $this->firebaseService->sendToDriver(
                $validated['driver_id'],
                [
                    'order_id' => $order->id,
                    'customer_name' => $order->customer_name,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Order berhasil di-assign dan notifikasi terkirim',
                'notification' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'message' => 'Order berhasil di-assign, tapi notifikasi gagal',
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Driver respond (accept/reject)
     * POST /api/orders/{orderId}/respond
     */
    public function driverRespond(Request $request, $orderId)
    {
        $validated = $request->validate([
            'action' => 'required|in:accept,reject',
            'driver_id' => 'required|string',
        ]);

        $order = Order::findOrFail($orderId);

        if ($validated['action'] === 'accept') {
            $order->update(['status' => 'accepted']);
            $message = 'Order diterima oleh driver';
        } else {
            $order->update([
                'status' => 'pending',
                'driver_id' => null,
            ]);
            $message = 'Order ditolak oleh driver';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'order' => $order,
        ]);
    }
}
```

### Langkah 9: Setup Routes

**File: `routes/api.php`**

```php
<?php

use App\Http\Controllers\Api\DriverTokenController;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\Route;

// Driver Token Routes
Route::post('/drivers/register-token', [DriverTokenController::class, 'registerToken']);

// Order Routes
Route::prefix('orders')->group(function () {
    Route::post('/{orderId}/assign', [OrderController::class, 'assignDriver']);
    Route::post('/{orderId}/respond', [OrderController::class, 'driverRespond']);
});
```

### Langkah 10: React Frontend (Admin Dashboard)

**Contoh component untuk assign driver:**

```jsx
// components/AssignDriverModal.jsx
import React, { useState } from 'react';
import axios from 'axios';

const AssignDriverModal = ({ orderId, drivers, onClose, onSuccess }) => {
    const [selectedDriver, setSelectedDriver] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAssign = async () => {
        if (!selectedDriver) return;

        setLoading(true);
        try {
            const response = await axios.post(`/api/orders/${orderId}/assign`, {
                driver_id: selectedDriver,
            });

            if (response.data.success) {
                alert('Order berhasil di-assign! Notifikasi terkirim ke driver.');
                onSuccess();
                onClose();
            }
        } catch (error) {
            alert('Gagal assign driver: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal">
            <h2>Assign Driver</h2>
            <p>Order ID: {orderId}</p>
            
            <select 
                value={selectedDriver} 
                onChange={(e) => setSelectedDriver(e.target.value)}
            >
                <option value="">Pilih Driver</option>
                {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                        {driver.name}
                    </option>
                ))}
            </select>
            
            <button onClick={handleAssign} disabled={loading || !selectedDriver}>
                {loading ? 'Mengirim...' : 'Assign & Kirim Notifikasi'}
            </button>
            <button onClick={onClose}>Batal</button>
        </div>
    );
};

export default AssignDriverModal;
```

### Struktur Folder Lengkap

```
laravel-project/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── Api/
│   │           ├── DriverTokenController.php
│   │           └── OrderController.php
│   ├── Models/
│   │   ├── DriverToken.php
│   │   └── Order.php
│   └── Services/
│       └── FirebaseNotificationService.php
├── config/
│   └── firebase.php
├── database/
│   └── migrations/
│       └── xxxx_create_driver_tokens_table.php
├── routes/
│   └── api.php
├── storage/
│   └── app/
│       └── firebase/
│           └── firebase-credentials.json  ← JANGAN COMMIT!
└── resources/
    └── js/
        └── components/
            └── AssignDriverModal.jsx
```


---

## 🔄 Alur Kerja Sistem

### Diagram Alur Lengkap

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              ALUR PUSH NOTIFICATION                               │
└──────────────────────────────────────────────────────────────────────────────────┘

FASE 1: REGISTRASI TOKEN
═══════════════════════════════════════════════════════════════════════════════════

Driver Login App          Flutter App              API Server              Database
     │                        │                        │                      │
     │──── Login ────────────▶│                        │                      │
     │                        │                        │                      │
     │                        │── Init Firebase ──────▶│                      │
     │                        │   Get FCM Token        │                      │
     │                        │                        │                      │
     │                        │── POST /register-token─▶│                      │
     │                        │   {driver_id, token}   │                      │
     │                        │                        │── INSERT/UPDATE ────▶│
     │                        │                        │   driver_tokens      │
     │                        │◀── 200 OK ─────────────│                      │
     │◀─── Login Success ─────│                        │                      │


FASE 2: ASSIGN ORDER & KIRIM NOTIFIKASI
═══════════════════════════════════════════════════════════════════════════════════

Admin Dashboard           API Server              Firebase FCM           Driver App
     │                        │                        │                      │
     │── POST /assign ───────▶│                        │                      │
     │   {order_id, driver_id}│                        │                      │
     │                        │                        │                      │
     │                        │── Query FCM Token ────▶│                      │
     │                        │   (dari database)      │                      │
     │                        │                        │                      │
     │                        │── POST ───────────────▶│                      │
     │                        │   FCM Message          │                      │
     │                        │   (token, data)        │                      │
     │                        │                        │                      │
     │                        │                        │── Push Notification ─▶│
     │                        │                        │   "Order Baru!"      │
     │                        │                        │                      │
     │◀── 200 OK ─────────────│                        │                      │


FASE 3: DRIVER RESPOND
═══════════════════════════════════════════════════════════════════════════════════

Driver App                API Server              Database            Admin Dashboard
     │                        │                      │                      │
     │── Tap Notification ───▶│                      │                      │
     │   View Order Detail    │                      │                      │
     │                        │                      │                      │
     │── POST /respond ──────▶│                      │                      │
     │   {action: "accept"}   │                      │                      │
     │                        │── UPDATE orders ────▶│                      │
     │                        │   status="accepted"  │                      │
     │                        │                      │                      │
     │◀── 200 OK ─────────────│                      │                      │
     │                        │                      │──── Refresh ────────▶│
     │                        │                      │     (WebSocket/Poll) │
```

---

## 🧪 Testing

### Test FCM Token

1. Jalankan app di device/emulator
2. Lihat log untuk FCM Token:
   ```
   I/flutter: FCM Token: dXrT7K9Lq0M:APA91bE...
   ```
3. Copy token tersebut

### Test Kirim Notifikasi Manual

Gunakan tool seperti Postman atau curl:

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "FCM_TOKEN_DRIVER",
    "notification": {
      "title": "Test Notifikasi",
      "body": "Halo dari server!"
    },
    "data": {
      "order_id": "ORD-001",
      "type": "new_order"
    }
  }'
```

> **Server Key** bisa didapat di Firebase Console → Project Settings → Cloud Messaging

### Checklist Testing

- [ ] App mendapatkan FCM Token saat startup
- [ ] FCM Token tersimpan di database saat login
- [ ] Notifikasi muncul saat app di background
- [ ] Notifikasi muncul saat app di foreground
- [ ] Tap notifikasi membuka halaman yang benar
- [ ] Accept/Reject berhasil update status di server

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Token tidak muncul | Pastikan `google-services.json` benar |
| Notifikasi tidak terkirim | Cek Server Key dan FCM Token masih valid |
| App crash saat startup | Jalankan `flutter clean && flutter pub get` |
| Background handler error | Pastikan ada `@pragma('vm:entry-point')` |

---

## 📚 Referensi

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [FlutterFire - Firebase for Flutter](https://firebase.flutter.dev/)
- [firebase_messaging package](https://pub.dev/packages/firebase_messaging)

---

*Dokumentasi ini dibuat untuk project SendPick Driver App*
