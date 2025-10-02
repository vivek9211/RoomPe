# Notification System Setup Guide

This guide will help you set up the notification system for rent due reminders and tenant complaints in your RoomPe app.

## 📋 Prerequisites

- React Native 0.81.0+
- Firebase project configured
- Android Studio (for Android setup)
- Xcode (for iOS setup)

## 🔧 Installation

### 1. Dependencies

The following packages have been installed:

```json
{
  "@react-native-firebase/app": "^23.4.0",
  "@react-native-firebase/auth": "^23.4.0",
  "@react-native-firebase/firestore": "^23.4.0",
  "@react-native-firebase/messaging": "^23.4.0",
  "@react-native-firebase/storage": "^23.4.0",
  "react-native-push-notification": "^8.1.1"
}
```

### 2. Android Setup

#### A. Add to `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        // ... existing config
        multiDexEnabled true
    }
}

dependencies {
    // ... existing dependencies
    implementation 'com.google.firebase:firebase-messaging:23.4.0'
    implementation 'com.google.firebase:firebase-analytics:21.5.0'
}
```

#### B. Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>

<application>
    <!-- ... existing application config -->
    
    <!-- Firebase Messaging Service -->
    <service
        android:name="io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService"
        android:exported="false">
        <intent-filter>
            <action android:name="com.google.firebase.MESSAGING_EVENT" />
        </intent-filter>
    </service>
    
    <!-- Notification Channel -->
    <meta-data
        android:name="com.google.firebase.messaging.default_notification_channel_id"
        android:value="roompe-notifications" />
</application>
```

#### C. Add to `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        // ... existing dependencies
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

#### D. Add to `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
```

### 3. iOS Setup

#### A. Add to `ios/Podfile`:

```ruby
pod 'Firebase/Messaging'
```

#### B. Add to `ios/RoomPe/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

#### C. Add to `ios/RoomPe/AppDelegate.m`:

```objc
#import <Firebase.h>
#import <UserNotifications/UserNotifications.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    [FIRApp configure];
    
    // Request notification permissions
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    center.delegate = self;
    [center requestAuthorizationWithOptions:(UNAuthorizationOptionSound | UNAuthorizationOptionAlert | UNAuthorizationOptionBadge) completionHandler:^(BOOL granted, NSError * _Nullable error) {
        if (granted) {
            dispatch_async(dispatch_get_main_queue(), ^{
                [[UIApplication sharedApplication] registerForRemoteNotifications];
            });
        }
    }];
    
    return YES;
}

// Handle notification tap
- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void(^)(void))completionHandler {
    // Handle notification tap
    completionHandler();
}
```

### 4. Firebase Console Setup

#### A. Enable Cloud Messaging:
1. Go to Firebase Console → Project Settings
2. Navigate to Cloud Messaging tab
3. Generate server key (if not already generated)

#### B. Configure Android:
1. Add your app's SHA-1 fingerprint
2. Download `google-services.json` and place in `android/app/`

#### C. Configure iOS:
1. Upload your APNs certificate
2. Download `GoogleService-Info.plist` and add to iOS project

## 🚀 Usage

### 1. Initialize Notifications

The notification system is automatically initialized in `App.tsx`:

```typescript
import { PushNotificationService } from './src/services/notifications/pushNotifications';
import { NotificationScheduler } from './src/services/notifications/notificationScheduler';

function App() {
  useEffect(() => {
    // Initialize push notifications
    PushNotificationService.initialize();
    
    // Start notification scheduler
    NotificationScheduler.startScheduler();
  }, []);

  // ... rest of your app
}
```

### 2. Rent Due Reminders

The system automatically:
- Schedules reminders 7, 3, and 1 days before rent due date
- Sends overdue notifications with late fee calculations
- Tracks payment status and prevents duplicate reminders

### 3. Tenant Complaints

Tenants can:
- Submit complaints using predefined templates
- Track complaint status in real-time
- Receive notifications for status updates

Property owners receive:
- Notifications for new complaints
- Priority-based handling
- Staff assignment capabilities

### 4. Manual Notification Sending

```typescript
import { NotificationService } from './src/services/notifications/notificationService';

// Send a custom notification
await NotificationService.createNotification({
  userId: 'tenant-user-id',
  type: NotificationType.RENT_DUE,
  title: 'Rent Due Reminder',
  message: 'Your rent is due in 3 days',
  priority: NotificationPriority.HIGH,
  metadata: {
    tenantId: 'tenant-id',
    propertyId: 'property-id',
    roomId: 'room-id',
    rentAmount: 10000,
    dueDate: new Date().toISOString(),
  },
});
```

## 🧪 Testing

### 1. Run Tests

```bash
npm test src/services/notifications/__tests__/notificationService.test.ts
```

### 2. Test Notifications

```typescript
// Test local notifications
import LocalNotificationService from './src/services/notifications/localNotifications';

LocalNotificationService.scheduleRentDueReminder(
  'test-user-id',
  'Test User',
  'Test Property',
  '101',
  10000,
  new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  [1] // 1 day before
);
```

### 3. Test Complaint System

```typescript
import { useComplaints } from './src/hooks/useComplaints';

const { createComplaint } = useComplaints();

await createComplaint({
  tenantId: 'tenant-id',
  propertyId: 'property-id',
  roomId: 'room-id',
  title: 'Broken Tap',
  description: 'The tap in the bathroom is leaking',
  category: ComplaintCategory.PLUMBING,
  type: ComplaintType.MAINTENANCE,
  priority: ComplaintPriority.MEDIUM,
});
```

## 🔧 Configuration

### 1. Notification Channels (Android)

The system creates a notification channel with ID `roompe-notifications`:
- High importance
- Sound enabled
- Vibration enabled
- Badge enabled

### 2. Notification Scheduling

- Rent reminders: 7, 3, 1 days before due date
- Overdue notifications: Daily after due date
- Maintenance reminders: 24 hours after request creation
- Scheduler runs every hour

### 3. Firestore Rules

Add these rules to your `firestore.rules`:

```javascript
// Notifications collection
match /notifications/{notificationId} {
  allow read, write: if request.auth != null && 
    (resource == null || resource.data.userId == request.auth.uid);
}

// Complaints collection
match /complaints/{complaintId} {
  allow read, write: if request.auth != null && 
    (resource == null || 
     resource.data.tenantId == request.auth.uid ||
     userOwnsProperty(resource.data.propertyId));
}
```

## 🐛 Troubleshooting

### Common Issues:

1. **Notifications not showing on Android:**
   - Check notification permissions
   - Verify notification channel setup
   - Check if app is in battery optimization whitelist

2. **Push notifications not working:**
   - Verify FCM token generation
   - Check Firebase configuration
   - Ensure proper APNs setup for iOS

3. **Scheduled notifications not firing:**
   - Check if app is backgrounded
   - Verify notification permissions
   - Check device battery optimization settings

### Debug Commands:

```bash
# Check notification permissions
adb shell dumpsys notification

# View Firebase logs
adb logcat | grep Firebase

# Test notification channel
adb shell cmd notification post -S bigtext -t "Test" "Test notification" "This is a test"
```

## 📱 Features Implemented

✅ **Rent Due Reminders**
- Automatic scheduling for all active tenants
- Multiple reminder intervals
- Overdue detection with late fees
- Local and push notifications

✅ **Tenant Complaint System**
- 12 predefined complaint categories
- Quick template selection
- Priority-based handling
- Real-time status tracking
- Property owner notifications

✅ **Notification Management**
- Multi-channel delivery
- Firestore storage
- User preference management
- Automatic retry mechanisms

✅ **UI Components**
- Complaint submission screen
- Complaint list with filtering
- Complaint detail screen
- Dashboard integration

The notification system is now fully integrated and ready for production use! 🎉

