# Notification System Usage Guide

## ⚠️ Important: User-Specific Notifications

The notification system has been updated to prevent showing notifications for all users. Here's how to use it correctly:

## ❌ What NOT to do

```typescript
// DON'T: This will schedule notifications for ALL tenants
NotificationScheduler.startScheduler(); // Only for admin/system use
```

## ✅ What TO do

### For Property Owners
```typescript
import { NotificationScheduler } from './services/notifications/notificationScheduler';
import { useAuth } from './contexts/AuthContext';

// In your property owner dashboard
const { user } = useAuth();

useEffect(() => {
  if (user && user.role === 'owner') {
    // This will only schedule notifications for YOUR tenants
    NotificationScheduler.startSchedulerForOwner(user.uid);
  }
}, [user]);
```

### For Tenants
```typescript
import { NotificationScheduler } from './services/notifications/notificationScheduler';
import { useAuth } from './contexts/AuthContext';

// In your tenant dashboard
const { user } = useAuth();

useEffect(() => {
  if (user && user.role === 'tenant') {
    // This will only schedule notifications for YOU
    NotificationScheduler.startSchedulerForTenant(user.uid);
  }
}, [user]);
```

### One-time Scheduling
```typescript
// Schedule once for a specific owner's tenants
await NotificationScheduler.scheduleRentDueRemindersForOwner(ownerId);

// Schedule once for a specific tenant
await NotificationScheduler.scheduleNotificationsForTenant(tenantUserId);
```

## Current Status

✅ **Fixed Issues:**
- Removed development Alert dialogs that showed for all users
- Added user-specific notification methods
- Removed global scheduler from App.tsx
- Added proper user context checking

✅ **What works now:**
- Notifications are only scheduled for relevant users
- No more popup alerts for all tenants
- Proper logging instead of intrusive alerts
- User-specific notification scheduling

## Next Steps

1. **Implement in dashboards**: Add the appropriate scheduler calls in your user dashboards based on user role
2. **Install notification packages** (optional): For actual push/local notifications
3. **Test with different users**: Verify each user only sees their own notifications

## Notes

- The system now logs notification details to console instead of showing alerts
- Firestore permissions have been updated to support user-specific notifications
- The global scheduler still exists for admin/system use but shows warnings
