# Tenant Management System

## Overview

The RoomPe app now includes a comprehensive tenant management system that allows property owners to manage their tenants efficiently. This system provides both owner and tenant interfaces with full CRUD operations, real-time updates, and role-based access control.

## Features

### For Property Owners

#### 1. Tenant List Management
- **View All Tenants**: See all tenants across all properties with filtering and search capabilities
- **Tenant Statistics**: Dashboard showing total tenants, active tenants, occupancy rates, and financial summaries
- **Status Filtering**: Filter tenants by status (Active, Pending, Left, Suspended, etc.)
- **Search Functionality**: Search tenants by name, email, or tenant ID
- **Real-time Updates**: Live updates when tenant information changes

#### 2. Add New Tenants
- **User Selection**: Choose from existing users with tenant role
- **Property Assignment**: Assign tenants to specific properties
- **Room Assignment**: Assign tenants to specific rooms within properties
- **Financial Setup**: Set monthly rent and security deposit amounts
- **Agreement Period**: Define lease start and end dates
- **Form Validation**: Comprehensive validation for all required fields

#### 3. Tenant Details & Management
- **Complete Profile View**: View all tenant information including financial details, agreement terms, and contact information
- **Status Management**: Change tenant status (Active, Pending, Left, etc.)
- **Financial Information**: Track rent, deposits, payment history
- **Agreement Details**: View and manage lease agreements
- **Emergency Contacts**: Store and manage emergency contact information
- **Notes & Comments**: Add notes about tenants for internal reference

#### 4. Edit Tenant Information
- **Update Financial Details**: Modify rent and deposit amounts
- **Status Changes**: Update tenant status
- **Agreement Modifications**: Extend or modify lease terms
- **Contact Updates**: Update emergency contact information
- **Notes Management**: Add or edit tenant notes

### For Tenants

#### 1. Tenant Registration
- **Easy Registration**: Simple registration form for new tenants
- **Account Creation**: Create tenant accounts with email and password
- **Profile Setup**: Set up basic profile information
- **Role Assignment**: Automatic assignment of tenant role

#### 2. Tenant Dashboard
- **Property Information**: View assigned property and room details
- **Financial Overview**: See rent amounts, payment history, and outstanding balances
- **Maintenance Requests**: Submit and track maintenance requests
- **Payment Management**: View payment history and make payments

## Technical Implementation

### Database Structure

#### Tenants Collection
```typescript
interface Tenant {
  id: string;
  userId: string;
  roomId: string;
  propertyId: string;
  status: TenantStatus;
  agreementStart: Timestamp;
  agreementEnd: Timestamp;
  rent: number;
  deposit: number;
  depositPaid: boolean;
  emergencyContact?: EmergencyContact;
  documents?: TenantDocument[];
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Tenant Status Types
- `ACTIVE`: Currently renting
- `PENDING`: Application submitted, awaiting approval
- `INACTIVE`: Account suspended
- `LEFT`: Moved out
- `SUSPENDED`: Temporarily suspended
- `EVICTED`: Evicted from property

### API Services

#### TenantApiService
- `createTenant()`: Create new tenant records
- `getTenantById()`: Fetch individual tenant details
- `getTenantsByProperty()`: Get all tenants for a property
- `getTenantsWithFilters()`: Advanced filtering and search
- `updateTenant()`: Update tenant information
- `deleteTenant()`: Remove tenant records
- `getTenantStats()`: Get statistical data
- `searchTenants()`: Search functionality

### React Hooks

#### useTenants Hook
```typescript
const {
  tenants,
  tenant,
  loading,
  error,
  stats,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantById,
  getTenantsByProperty,
  getTenantsWithFilters,
  getTenantStats,
  searchTenants,
  clearError,
  clearTenant,
} = useTenants();
```

### Screens

#### Owner Screens
1. **TenantListScreen**: Main tenant management interface
2. **AddTenantScreen**: Add new tenants to properties
3. **TenantDetailScreen**: View and manage individual tenant details
4. **EditTenantScreen**: Modify tenant information

#### Tenant Screens
1. **TenantRegistrationScreen**: New tenant registration
2. **TenantDashboardScreen**: Tenant's main dashboard

## Usage Guide

### For Property Owners

#### Adding a New Tenant
1. Navigate to the "Tenants" tab in the owner dashboard
2. Tap the "+ Add" button
3. Select an existing user with tenant role
4. Choose the property and room for assignment
5. Set rent and deposit amounts
6. Define agreement period
7. Submit the form

#### Managing Existing Tenants
1. From the tenant list, tap on any tenant card
2. View complete tenant information
3. Use status buttons to change tenant status
4. Tap "Edit" to modify tenant details
5. Use "Delete" to remove tenant (with confirmation)

#### Filtering and Searching
1. Use the search bar to find specific tenants
2. Use filter chips to show tenants by status
3. View statistics in the overview card

### For Tenants

#### Registration Process
1. Navigate to tenant registration screen
2. Fill in personal information (name, email, phone)
3. Create password and confirm
4. Submit registration
5. Login with credentials

#### Accessing Tenant Features
1. Login with tenant credentials
2. View assigned property and room information
3. Check rent and payment status
4. Submit maintenance requests
5. View payment history

## Security & Permissions

### Role-Based Access Control
- **Owners**: Full access to tenant management features
- **Tenants**: Limited access to their own information and basic features
- **Authentication**: Firebase Auth integration for secure login

### Data Validation
- Form validation on all input fields
- Server-side validation for critical operations
- Input sanitization and type checking

## Future Enhancements

### Planned Features
1. **Document Management**: Upload and store tenant documents
2. **Payment Integration**: Direct payment processing
3. **Notification System**: Push notifications for important events
4. **Reporting**: Advanced reporting and analytics
5. **Bulk Operations**: Import/export tenant data
6. **Advanced Search**: More sophisticated search and filtering
7. **Tenant Portal**: Enhanced tenant self-service features

### Technical Improvements
1. **Offline Support**: Cache tenant data for offline access
2. **Real-time Sync**: Enhanced real-time synchronization
3. **Performance Optimization**: Lazy loading and pagination
4. **Mobile Optimization**: Enhanced mobile experience

## Troubleshooting

### Common Issues

#### Tenant Not Appearing in List
- Check if tenant status is set to "Active"
- Verify property assignment is correct
- Ensure user has tenant role assigned

#### Cannot Add Tenant
- Verify user exists with tenant role
- Check property and room availability
- Ensure all required fields are filled

#### Search Not Working
- Check search term spelling
- Verify tenant name/email format
- Clear filters if applied

### Error Handling
- All operations include comprehensive error handling
- User-friendly error messages
- Automatic retry mechanisms for network issues
- Graceful degradation for offline scenarios

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team.

---

*This tenant management system is designed to provide a comprehensive solution for property management, ensuring both owners and tenants have the tools they need for effective communication and management.*
