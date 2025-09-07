# Room Management System

## Overview

The Room Management System is a comprehensive solution for managing different types of property units including rooms, flats, RK (Room with Kitchen), BHK apartments, and studio apartments. It provides a complete interface for property owners to manage their units, assign tenants, track occupancy, and monitor property performance.

## Features

### 🏠 Unit Management
- **Multiple Unit Types**: Support for various property types:
  - Rooms (Single, Double, Triple, Quad sharing)
  - RK (Room with Kitchen)
  - BHK apartments (1BHK, 2BHK, 3BHK, etc.)
  - Studio Apartments
- **Unit Configuration**: Set capacity, rent, deposit, and amenities
- **Floor Organization**: Organize units by floors with occupancy tracking
- **Unit Status Tracking**: Available, Occupied, Maintenance, Reserved

### 👥 Tenant Management
- **Tenant Assignment**: Assign tenants to available units
- **Tenant Information**: Display tenant details (name, phone, email)
- **Vacate Units**: Remove tenants and mark units as available
- **Tenant Search**: Search units by tenant name or unit number

### 📊 Property Analytics
- **Occupancy Overview**: Real-time occupancy rates and statistics
- **Floor-wise Breakdown**: View occupancy by floor
- **Revenue Tracking**: Monitor rent collection and deposits
- **Property Performance**: Track key metrics and trends

### 🔍 Advanced Filtering & Search
- **Status Filters**: Filter by Available, Occupied, Maintenance, Reserved
- **Type Filters**: Filter by unit type (Room, RK, BHK, etc.)
- **Search Functionality**: Search by unit number or tenant name
- **View Modes**: List view (by floors) and Grid view

### 🎨 User Interface
- **Modern Design**: Clean, intuitive interface with material design
- **Responsive Layout**: Optimized for mobile devices
- **Visual Indicators**: Icons and colors for different unit types and statuses
- **Interactive Elements**: Touch-friendly buttons and modals

## Unit Types Supported

### 🏠 Rooms
- **Single Sharing**: Individual rooms for one tenant
- **Double Sharing**: Rooms accommodating two tenants
- **Triple Sharing**: Rooms for three tenants
- **Quad Sharing**: Rooms for four tenants
- **Multiple Sharing**: Up to 8-9 sharing options

### 🏡 RK (Room with Kitchen)
- Individual units with attached kitchen facilities
- Suitable for tenants who prefer cooking facilities
- Higher rent compared to regular rooms

### 🏢 BHK Apartments
- **1BHK**: One bedroom, hall, and kitchen
- **2BHK**: Two bedrooms, hall, and kitchen
- **3BHK**: Three bedrooms, hall, and kitchen
- **4BHK+**: Larger apartments with multiple bedrooms

### 🏬 Studio Apartments
- Open-concept living spaces
- Combined living, sleeping, and kitchen areas
- Modern urban living option

## Unit Status Management

### 🟢 Available
- Unit is ready for tenant assignment
- No current occupants
- Can be assigned to new tenants

### 🔵 Occupied
- Unit has current tenants
- Shows tenant information
- Can be vacated when tenants leave

### 🟡 Maintenance
- Unit is under maintenance/repair
- Not available for new tenants
- Can be marked as available after completion

### 🟠 Reserved
- Unit is reserved for specific tenants
- Temporarily unavailable
- Can be converted to occupied when tenants move in

## Key Features

### 1. Unit Creation
```typescript
interface CreateUnitData {
  unitNumber: string;        // e.g., "101", "A1"
  unitType: UnitType;       // ROOM, RK, BHK_1, etc.
  sharingType?: RoomSharingType; // For rooms only
  capacity: number;         // Number of people it can accommodate
  rent: number;            // Monthly rent in INR
  deposit: number;         // Security deposit in INR
  floorNumber: number;     // Floor number
  amenities: string[];     // Available amenities
}
```

### 2. Tenant Assignment
```typescript
interface TenantDisplay {
  id: string;
  name: string;
  phone: string;
  email: string;
}
```

### 3. Unit Information Display
- Unit number and type
- Current status with color coding
- Capacity and occupancy information
- Rent and deposit details
- Available amenities
- Current tenant information

## Usage Guide

### Adding a New Unit
1. Click the "+ Add Unit" button in the header
2. Fill in the unit details:
   - Unit Number (e.g., 101, A1)
   - Unit Type (Room, RK, BHK, etc.)
   - Sharing Type (for rooms)
   - Capacity
   - Rent and Deposit amounts
   - Floor Number
3. Click "Add Unit" to save

### Assigning a Tenant
1. Find an available unit
2. Click "Assign Tenant" button
3. Select a tenant from the available list
4. Confirm assignment

### Vacating a Unit
1. Find an occupied unit
2. Click "Vacate Unit" button
3. Confirm the action
4. Unit status changes to "Available"

### Filtering and Searching
1. Use the search bar to find units by number or tenant name
2. Click "Show Filters" to access advanced filtering
3. Filter by status (Available, Occupied, etc.)
4. Filter by unit type (Room, RK, BHK, etc.)
5. Switch between List and Grid view modes

## Data Structure

### Unit Model
```typescript
interface Unit {
  id: string;
  floorId: string;
  unitNumber: string;
  unitType: UnitType;
  sharingType?: RoomSharingType;
  capacity: number;
  isOccupied: boolean;
  tenantIds: string[];
  rent: number;
  deposit: number;
  amenities: string[];
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Floor Model
```typescript
interface Floor {
  id: string;
  floorNumber: number;
  floorName: string;
  totalUnits: number;
  filledUnits: number;
  vacantUnits: number;
  units: Unit[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Technical Implementation

### State Management
- Uses React hooks for local state management
- Separate states for units, floors, tenants, and UI controls
- Real-time updates for occupancy and status changes

### Data Flow
1. Load property data on component mount
2. Fetch available tenants for assignment
3. Update unit status on tenant assignment/vacation
4. Refresh data on pull-to-refresh

### UI Components
- **UnitCard**: Displays individual unit information
- **FloorSection**: Groups units by floor
- **SearchBar**: Provides search functionality
- **FilterChips**: Status and type filters
- **Modal**: Add unit and assign tenant forms

## Future Enhancements

### Planned Features
- **Unit Images**: Add photos for each unit
- **Amenity Management**: Detailed amenity configuration
- **Maintenance Requests**: Track maintenance issues
- **Payment Integration**: Link with payment system
- **Notifications**: Alert for unit status changes
- **Reports**: Generate occupancy and revenue reports
- **Bulk Operations**: Assign multiple tenants at once

### Advanced Analytics
- **Occupancy Trends**: Historical occupancy data
- **Revenue Analytics**: Rent collection analysis
- **Tenant Turnover**: Track tenant movement patterns
- **Property Performance**: Compare with market rates

## Integration Points

### Firebase Integration
- Firestore for data storage
- Real-time updates
- User authentication
- Cloud functions for business logic

### Navigation
- Integrates with main app navigation
- Property selection flow
- Tenant management screens
- Payment and maintenance screens

## Best Practices

### Data Validation
- Validate unit numbers for uniqueness
- Ensure rent and deposit are positive numbers
- Check capacity limits
- Verify tenant assignment constraints

### User Experience
- Provide clear feedback for all actions
- Use loading states for async operations
- Implement error handling
- Maintain consistent UI patterns

### Performance
- Optimize list rendering for large datasets
- Implement pagination for large properties
- Cache frequently accessed data
- Minimize unnecessary re-renders

## Troubleshooting

### Common Issues
1. **Unit not appearing**: Check if unit was added to correct floor
2. **Tenant assignment fails**: Verify tenant is available and unit is vacant
3. **Search not working**: Ensure search query matches unit number or tenant name
4. **Filters not applying**: Check if filter criteria are correctly set

### Debug Information
- Check console logs for error messages
- Verify data structure matches expected format
- Ensure all required fields are populated
- Test with different unit types and statuses

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team.

---

*This documentation covers the Room Management System implementation for the RoomPe property management application.*
