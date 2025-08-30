# Role-Based Dashboard System for RoomPe

## Overview

This document describes the implementation of a role-based dashboard system for the RoomPe application, where different user roles (Tenant and Owner) have access to different features and interfaces.

## Architecture

### Navigation Flow

```
Google Sign-in → Check Profile → Check Role → Navigate Accordingly
     ↓
RoleSelection (if no role) → Dashboard
```

**Note:** Onboarding is now optional and can be accessed from within the dashboard when needed, rather than blocking access to the main application.

### Role-Based Routing

The application uses React Navigation with conditional routing based on user authentication state and role:

1. **Unauthenticated Users**: Welcome, Login, Register screens
2. **Authenticated Users without Role**: Role Selection screen
3. **Users with Role**: Role-specific dashboard (onboarding is optional)

## User Roles

### 1. Owner Dashboard

**Features:**
- Property management with multiple property support
- Property selection page for switching between properties
- Financial summary (collections, dues)
- Quick actions (Add Tenant, Receive Payment, Add Dues, etc.)
- Reports and analytics
- Tenant management

**Navigation Tabs:**
- Home (Owner Dashboard)
- Properties
- Tenants
- Payments
- Analytics

**Key Screens:**
- `OwnerDashboardScreen`: Main dashboard with property overview
- `PropertySelectionScreen`: Switch between multiple properties
- `PropertyListScreen`: Manage all properties
- `TenantListScreen`: Manage all tenants
- `PaymentListScreen`: Track payments
- `AnalyticsScreen`: View performance insights

### 2. Tenant Dashboard

**Features:**
- Personal account information
- Dues and payment management
- Express check-in functionality
- Maintenance request reporting
- Attendance tracking

**Navigation Tabs:**
- Home (Tenant Dashboard)
- Payments
- Maintenance
- Settings

**Key Screens:**
- `TenantDashboardScreen`: Main dashboard with personal info
- `PaymentListScreen`: View payment history
- `MaintenanceListScreen`: Report and track issues
- `SettingsScreen`: Manage profile and preferences

## Implementation Details

### Navigation Structure

```typescript
// AppNavigator.tsx
const AppNavigator = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          // Auth Stack
          <AuthScreens />
        ) : !userProfile?.role ? (
          // Role Selection
          <RoleSelectionScreen />
        ) : !userProfile?.onboardingCompleted ? (
          // Onboarding
          <OnboardingScreen />
        ) : userProfile?.role === 'owner' ? (
          // Owner Stack
          <OwnerStack />
        ) : (
          // Tenant Stack
          <TenantStack />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### Property Selection for Owners

The `PropertySelectionScreen` allows owners to:
- View all their properties in a searchable list
- Switch between properties
- See property metrics (rooms, tenants)
- Add new properties
- Copy property IDs

### Dashboard Customization

Each role has a completely different dashboard experience:

**Owner Dashboard:**
- Property-centric view
- Financial metrics across properties
- Quick actions for property management
- Reports and analytics

**Tenant Dashboard:**
- Personal account view
- Individual payment tracking
- Property-specific features (check-in, maintenance)
- Personal settings

## Key Components

### 1. PropertySelectionScreen
- Search functionality
- Property cards with metrics
- Floating action button for adding properties
- Status indicators for current property

### 2. OwnerDashboardScreen
- Property selector in header
- Financial summary cards
- Quick action grid
- Reports section
- Floating help button

### 3. TenantDashboardScreen
- Personal greeting and member info
- Account summary cards
- Express check-in banner
- Life in property features
- Floating help button

## Styling and UI

The system uses a consistent design language with:
- Primary color: Indigo (#4F46E5)
- Secondary color: Cyan (#06B6D4)
- Success color: Green (#22C55E)
- Consistent spacing and typography
- Shadow effects and elevation
- Responsive layouts

## Future Enhancements

1. **Real-time Updates**: Live data synchronization
2. **Push Notifications**: Role-specific notifications
3. **Advanced Analytics**: Detailed reporting for owners
4. **Multi-language Support**: Internationalization
5. **Dark Mode**: Theme switching
6. **Offline Support**: Data caching and sync

## Getting Started

1. Ensure all dependencies are installed
2. Set up Firebase configuration
3. Configure authentication providers
4. Run the application
5. Test both role flows

## Dependencies

- React Navigation
- React Native Firebase
- React Native Safe Area Context
- TypeScript for type safety

## File Structure

```
src/
├── navigation/
│   └── AppNavigator.tsx          # Main navigation logic
├── screens/
│   ├── dashboard/
│   │   ├── OwnerDashboardScreen.tsx
│   │   ├── TenantDashboardScreen.tsx
│   │   └── PropertySelectionScreen.tsx
│   ├── properties/
│   ├── tenants/
│   ├── payments/
│   ├── maintenance/
│   ├── reports/
│   └── settings/
├── contexts/
│   └── AuthContext.tsx           # Authentication state
└── types/
    ├── user.types.ts             # User and role definitions
    ├── property.types.ts         # Property data structures
    └── tenant.types.ts           # Tenant data structures
```

This role-based system provides a scalable foundation for managing different user experiences while maintaining code organization and reusability. 