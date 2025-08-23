# Firebase Services Architecture

This document describes the new Firebase services architecture that separates authentication and Firestore operations for better maintainability and type safety.

## Services Overview

### 1. Firebase Auth Service (`firebase.ts`)
Handles all Firebase Authentication operations:
- User sign in/sign up/sign out
- Password reset
- Email verification
- Profile updates (display name, photo URL)
- Email and password updates
- Account deletion
- Authentication state monitoring

### 2. Firestore Service (`firestore.ts`)
Handles all Firestore database operations:
- User profile CRUD operations
- User search and filtering
- Real-time listeners
- Batch operations
- Verification status updates

### 3. User Service (`userService.ts`)
A unified service that combines both Firebase Auth and Firestore operations:
- Provides a single interface for user management
- Handles synchronization between Auth and Firestore
- Manages complex operations that involve both services

## Usage Examples

### Basic Authentication

```typescript
import firebaseAuthService from '../services/firebase';

// Sign in
const user = await firebaseAuthService.signInWithEmailAndPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Sign up
const newUser = await firebaseAuthService.createUserWithEmailAndPassword({
  email: 'newuser@example.com',
  password: 'password123',
  name: 'John Doe',
  phone: '+1234567890',
  role: UserRole.TENANT,
  displayName: 'John Doe'
});

// Sign out
await firebaseAuthService.signOut();
```

### Firestore Operations

```typescript
import firestoreService from '../services/firestore';

// Get user profile
const userProfile = await firestoreService.getUserProfile('user-uid');

// Create user profile
await firestoreService.createUserProfile({
  uid: 'user-uid',
  email: 'user@example.com',
  name: 'John Doe',
  phone: '+1234567890',
  role: UserRole.TENANT
});

// Update user profile
await firestoreService.updateUserProfile('user-uid', {
  name: 'John Smith',
  phone: '+0987654321'
});

// Search users
const users = await firestoreService.searchUsers('John', 10);

// Get users by role
const tenants = await firestoreService.getUsersByRole(UserRole.TENANT, 50);
```

### Unified User Service

```typescript
import userService from '../services/userService';

// Sign up with automatic profile creation
const user = await userService.signUp(
  'user@example.com',
  'password123',
  'John Doe',
  '+1234567890',
  UserRole.TENANT
);

// Get current user's full profile
const profile = await userService.getCurrentUserProfile();

// Update profile (updates both Auth and Firestore)
await userService.updateProfile({
  name: 'John Smith',
  phone: '+0987654321'
});

// Update email (updates both Auth and Firestore)
await userService.updateEmail('newemail@example.com');

// Delete account (deletes both Auth and Firestore)
await userService.deleteAccount();
```

### Real-time Listeners

```typescript
import userService from '../services/userService';

// Listen to authentication state changes
const unsubscribeAuth = userService.onAuthStateChanged((user) => {
  if (user) {
    console.log('User signed in:', user.uid);
  } else {
    console.log('User signed out');
  }
});

// Listen to current user's profile changes
const unsubscribeProfile = userService.onCurrentUserProfileChange((profile) => {
  if (profile) {
    console.log('Profile updated:', profile.name);
  }
});

// Clean up listeners
unsubscribeAuth();
unsubscribeProfile();
```

## Type Safety

All services use proper TypeScript types:

- `AuthUser`: Firebase Auth user data
- `User`: Complete user profile from Firestore
- `UserRole`: Enum for user roles (TENANT, OWNER, ADMIN)
- `UserStatus`: Enum for user status (ACTIVE, INACTIVE, etc.)
- `CreateUserData`: Required fields for user creation
- `UpdateUserData`: Optional fields for user updates

## Error Handling

All services include comprehensive error handling:

```typescript
try {
  await userService.signIn('user@example.com', 'password123');
} catch (error) {
  if (error.message.includes('Invalid email')) {
    // Handle invalid email
  } else if (error.message.includes('Wrong password')) {
    // Handle wrong password
  } else {
    // Handle other errors
  }
}
```

## Migration from Old Service

If you were using the old `firebaseService`, here's how to migrate:

### Old Code:
```typescript
import firebaseService from '../services/firebase';

// Authentication
await firebaseService.signInWithEmailAndPassword({ email, password });
const profile = await firebaseService.getUserProfile(uid);
```

### New Code:
```typescript
import userService from '../services/userService';

// Authentication (unified)
await userService.signIn(email, password);
const profile = await userService.getCurrentUserProfile();
```

## Best Practices

1. **Use the User Service for most operations**: It provides a unified interface and handles synchronization between Auth and Firestore.

2. **Use specific services for specialized operations**: Use `firebaseAuthService` for Auth-only operations and `firestoreService` for Firestore-only operations.

3. **Always handle errors**: Wrap service calls in try-catch blocks.

4. **Clean up listeners**: Always unsubscribe from real-time listeners when components unmount.

5. **Use proper types**: Import and use the TypeScript types for better development experience.

## Testing

You can test the services using the provided test functions:

```typescript
import { testFirebaseAuthConnection } from '../services/firebase';
import { testFirestoreConnection } from '../services/firestore';

// Test connections
const authConnected = await testFirebaseAuthConnection();
const firestoreConnected = await testFirestoreConnection();
```
