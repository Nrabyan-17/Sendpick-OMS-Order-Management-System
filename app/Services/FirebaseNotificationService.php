<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Kreait\Firebase\Messaging\AndroidConfig;
use Illuminate\Support\Facades\Log;
use App\Models\Drivers;

class FirebaseNotificationService
{
    protected $messaging;

    public function __construct()
    {
        $credentialsPath = base_path(env('FIREBASE_CREDENTIALS', 'storage/app/firebase/firebase-credentials.json'));
        
        if (!file_exists($credentialsPath)) {
            Log::error("Firebase credentials not found at: " . $credentialsPath);
            return;
        }

        try {
            $factory = (new Factory)->withServiceAccount($credentialsPath);
            $this->messaging = $factory->createMessaging();
        } catch (\Exception $e) {
            Log::error("Firebase Init Error: " . $e->getMessage());
        }
    }

    /**
     * Send notification to a specific driver
     */
    public function sendToDriver(string $driverId, string $title, string $body, array $data = []): array
    {
        if (!$this->messaging) {
            return ['success' => false, 'message' => 'Firebase not initialized'];
        }

        $driver = Drivers::where('driver_id', $driverId)->first();

        if (!$driver || !$driver->fcm_token) {
            Log::warning("Driver {$driverId} has no FCM token");
            return ['success' => false, 'message' => 'Driver has no FCM token'];
        }

        try {
            $notification = Notification::create($title, $body);

            // Android specific config for high priority
            $androidConfig = AndroidConfig::fromArray([
                'priority' => 'high',
                'notification' => [
                    'sound' => 'default',
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                ],
            ]);

            $message = CloudMessage::withTarget('token', $driver->fcm_token)
                ->withNotification($notification)
                ->withAndroidConfig($androidConfig)
                ->withData($data);

            $this->messaging->send($message);

            Log::info("Notification sent to {$driverId}");
            return ['success' => true];

        } catch (\Exception $e) {
            Log::error("FCM Send Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}
