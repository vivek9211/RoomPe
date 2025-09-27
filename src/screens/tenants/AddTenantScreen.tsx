import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

import { colors, fonts, dimensions } from '../../constants';
import { CreateTenantData, TenantStatus } from '../../types/tenant.types';
import { useTenants } from '../../hooks/useTenants';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestore';
import { tenantApiService } from '../../services/api/tenantApi';
import { User, UserRole } from '../../types/user.types';
import firestore from '@react-native-firebase/firestore';

// Helper functions for room/unit configuration
const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

const getCapacityForSharingType = (sharingType: string): number => {
  switch (sharingType) {
    case 'single': return 1;
    case 'double': return 2;
    case 'triple': return 3;
    case 'four_sharing': return 4;
    case 'five_sharing': return 5;
    case 'six_sharing': return 6;
    case 'seven_sharing': return 7;
    case 'eight_sharing': return 8;
    case 'nine_sharing': return 9;
    default: return 1;
  }
};

const getDefaultRentForSharingType = (sharingType: string): number => {
  switch (sharingType) {
    case 'single': return 8000;
    case 'double': return 6000;
    case 'triple': return 5000;
    case 'four_sharing': return 4000;
    case 'five_sharing': return 3500;
    case 'six_sharing': return 3000;
    case 'seven_sharing': return 2800;
    case 'eight_sharing': return 2500;
    case 'nine_sharing': return 2200;
    default: return 8000;
  }
};

const getDefaultDepositForSharingType = (sharingType: string): number => {
  return getDefaultRentForSharingType(sharingType) * 2;
};

const getCapacityForUnitType = (unitType: string): number => {
  switch (unitType) {
    case 'bhk_1': return 2;
    case 'bhk_2': return 4;
    case 'bhk_3': return 6;
    case 'bhk_4': return 8;
    case 'bhk_5': return 10;
    case 'bhk_6': return 12;
    case 'studio_apartment': return 2;
    case 'rk': return 1;
    default: return 1;
  }
};

const getDefaultRentForUnitType = (unitType: string): number => {
  switch (unitType) {
    case 'bhk_1': return 15000;
    case 'bhk_2': return 25000;
    case 'bhk_3': return 35000;
    case 'bhk_4': return 45000;
    case 'bhk_5': return 55000;
    case 'bhk_6': return 65000;
    case 'studio_apartment': return 12000;
    case 'rk': return 10000;
    default: return 8000;
  }
};

const getDefaultDepositForUnitType = (unitType: string): number => {
  return getDefaultRentForUnitType(unitType) * 2;
};

// Helper function to determine if a room is available for new tenant assignment
const isRoomAvailableForTenant = (room: any, occupiedCount: number): boolean => {
  // For BHK, RK, Studio apartments: only available if completely unoccupied (0 tenants)
  if (room.unitType && ['bhk_1', 'bhk_2', 'bhk_3', 'bhk_4', 'bhk_5', 'bhk_6', 'rk', 'studio_apartment'].includes(room.unitType)) {
    return occupiedCount === 0;
  }
  
  // For regular rooms (sharing types): available if not fully occupied
  return occupiedCount < room.capacity;
};

const AddTenantScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { createTenant, loading, error, clearError } = useTenants();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Partial<CreateTenantData>>({
    userId: '',
    roomId: '',
    propertyId: '',
    rent: 0,
    deposit: 0,
  });

  const [agreementStart, setAgreementStart] = useState<Date>(new Date());
  const [agreementEnd, setAgreementEnd] = useState<Date>(() => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    return endDate;
  });

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);

  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    loadAvailableUsers();
    loadAvailableProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      loadAvailableRooms(selectedProperty.id);
      // Clear selected room when property changes
      setSelectedRoom(null);
      setFormData(prev => ({ ...prev, roomId: '' }));
    } else {
      // Clear rooms when no property is selected
      setAvailableRooms([]);
      setSelectedRoom(null);
      setFormData(prev => ({ ...prev, roomId: '' }));
    }
  }, [selectedProperty]);

  const loadAvailableUsers = async () => {
    try {
      if (!user) {
        setAvailableUsers([]);
        return;
      }
      
      // Get tenants with approved applications who are not assigned to any room
      const users = await firestoreService.getAvailableTenantsWithApprovedApplications(user.uid);
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      // Set empty array to prevent further errors
      setAvailableUsers([]);
    }
  };

  // Helper function to create a test tenant user (for development)
  const createTestTenantUser = async () => {
    try {
      const testUserData = {
        uid: `test_tenant_${Date.now()}`,
        email: `test_tenant_${Date.now()}@example.com`,
        name: `Test Tenant ${Date.now()}`,
        phone: '+1234567890',
        role: UserRole.TENANT,
      };
      
      await firestoreService.createUserProfile(testUserData);
      Alert.alert('Success', 'Test tenant user created successfully. Please refresh the page.');
      loadAvailableUsers(); // Reload the users list
    } catch (error) {
      console.error('Error creating test user:', error);
      Alert.alert('Error', 'Failed to create test user');
    }
  };

  const loadAvailableProperties = async () => {
    try {
      if (user) {
        const properties = await firestoreService.getPropertiesByOwner(user.uid);
        setAvailableProperties(properties);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadAvailableRooms = async (propertyId: string) => {
    try {
      // Load rooms from room mapping
      const roomMapping = await firestoreService.getRoomMapping(propertyId);
      const rooms: any[] = [];
      
      if (roomMapping && roomMapping.floorConfigs) {
        console.log('Room mapping loaded:', roomMapping);
        
        // Iterate through floor configurations to generate rooms
        roomMapping.floorConfigs.forEach((floorConfig: any, floorIndex: number) => {
          const floorNumber = floorIndex + 1;
          const floorName = floorNumber === 1 ? 'Ground Floor' : `${floorNumber - 1}${getOrdinalSuffix(floorNumber - 1)} Floor`;
          let unitCounter = 1;
          
          // Generate rooms from roomConfigs
          if (floorConfig.roomConfigs) {
            Object.entries(floorConfig.roomConfigs).forEach(([sharingType, count]) => {
              const roomCount = count as number;
              if (roomCount > 0) {
                for (let i = 0; i < roomCount; i++) {
                  const roomNumber = `${floorNumber}${String(unitCounter).padStart(2, '0')}`;
                  
                  // Get default values based on sharing type
                  const capacity = getCapacityForSharingType(sharingType);
                  const rent = getDefaultRentForSharingType(sharingType);
                  const deposit = getDefaultDepositForSharingType(sharingType);
                  
                  // Create room display name
                  let roomName = '';
                  let roomType = '';
                  
                  switch (sharingType) {
                    case 'single':
                      roomName = `Room ${roomNumber}`;
                      roomType = 'Single Room';
                      break;
                    case 'double':
                      roomName = `Room ${roomNumber}`;
                      roomType = 'Double Sharing';
                      break;
                    case 'triple':
                      roomName = `Room ${roomNumber}`;
                      roomType = 'Triple Sharing';
                      break;
                    case 'four_sharing':
                      roomName = `Room ${roomNumber}`;
                      roomType = '4 Sharing';
                      break;
                    case 'five_sharing':
                      roomName = `Room ${roomNumber}`;
                      roomType = '5 Sharing';
                      break;
                    case 'six_sharing':
                      roomName = `Room ${roomNumber}`;
                      roomType = '6 Sharing';
                      break;
                    case 'seven_sharing':
                      roomName = `Room ${roomNumber}`;
                      roomType = '7 Sharing';
                      break;
                    case 'eight_sharing':
                      roomName = `Room ${roomNumber}`;
                      roomType = '8 Sharing';
                      break;
                    case 'nine_sharing':
                      roomName = `Room ${roomNumber}`;
                      roomType = '9 Sharing';
                      break;
                    default:
                      roomName = `Room ${roomNumber}`;
                      roomType = 'Room';
                  }
                  
                  rooms.push({
                    id: roomNumber,
                    name: `${roomName} (${floorName})`,
                    roomNumber: roomNumber,
                    type: roomType,
                    unitType: 'room',
                    sharingType: sharingType,
                    capacity: capacity,
                    occupied: 0, // Will be updated based on actual tenant data
                    floorName: floorName,
                    rent: rent,
                    deposit: deposit,
                    floorId: floorConfig.floorId
                  });
                  
                  unitCounter++;
                }
              }
            });
          }
          
          // Generate units from unitConfigs
          if (floorConfig.unitConfigs) {
            Object.entries(floorConfig.unitConfigs).forEach(([unitType, count]) => {
              const unitCount = count as number;
              if (unitCount > 0) {
                for (let i = 0; i < unitCount; i++) {
                  const unitNumber = `${floorNumber}${String(unitCounter).padStart(2, '0')}`;
                  
                  // Get default values based on unit type
                  const capacity = getCapacityForUnitType(unitType);
                  const rent = getDefaultRentForUnitType(unitType);
                  const deposit = getDefaultDepositForUnitType(unitType);
                  
                  // Create unit display name
                  let unitName = '';
                  let unitTypeDisplay = '';
                  
                  switch (unitType) {
                    case 'bhk_1':
                      unitName = `1 BHK ${unitNumber}`;
                      unitTypeDisplay = '1 BHK Flat';
                      break;
                    case 'bhk_2':
                      unitName = `2 BHK ${unitNumber}`;
                      unitTypeDisplay = '2 BHK Flat';
                      break;
                    case 'bhk_3':
                      unitName = `3 BHK ${unitNumber}`;
                      unitTypeDisplay = '3 BHK Flat';
                      break;
                    case 'bhk_4':
                      unitName = `4 BHK ${unitNumber}`;
                      unitTypeDisplay = '4 BHK Flat';
                      break;
                    case 'bhk_5':
                      unitName = `5 BHK ${unitNumber}`;
                      unitTypeDisplay = '5 BHK Flat';
                      break;
                    case 'bhk_6':
                      unitName = `6 BHK ${unitNumber}`;
                      unitTypeDisplay = '6 BHK Flat';
                      break;
                    case 'rk':
                      unitName = `RK ${unitNumber}`;
                      unitTypeDisplay = 'RK (Room + Kitchen)';
                      break;
                    case 'studio_apartment':
                      unitName = `Studio ${unitNumber}`;
                      unitTypeDisplay = 'Studio Apartment';
                      break;
                    default:
                      unitName = `Unit ${unitNumber}`;
                      unitTypeDisplay = 'Unit';
                  }
                  
                  rooms.push({
                    id: unitNumber,
                    name: `${unitName} (${floorName})`,
                    roomNumber: unitNumber,
                    type: unitTypeDisplay,
                    unitType: unitType,
                    sharingType: 'single',
                    capacity: capacity,
                    occupied: 0, // Will be updated based on actual tenant data
                    floorName: floorName,
                    rent: rent,
                    deposit: deposit,
                    floorId: floorConfig.floorId
                  });
                  
                  unitCounter++;
                }
              }
            });
          }
        });
        
        // Update occupancy based on actual tenant data and filter occupied rooms
        try {
          const allTenants = await tenantApiService.getTenantsByProperty(propertyId);
          
          // Filter rooms based on occupancy logic
          const availableRooms = rooms.filter(room => {
            const roomTenants = allTenants.filter(tenant => tenant.roomId === room.roomNumber);
            room.occupied = roomTenants.length;
            
            const isAvailable = isRoomAvailableForTenant(room, room.occupied);
            console.log(`Room ${room.roomNumber} (${room.type}): ${room.occupied}/${room.capacity} occupied, Available: ${isAvailable}`);
            
            return isAvailable;
          });
          
          console.log(`Total rooms: ${rooms.length}, Available rooms: ${availableRooms.length}`);
          console.log('Available rooms after filtering:', availableRooms);
          setAvailableRooms(availableRooms);
          return; // Exit early since we've set the filtered rooms
        } catch (error) {
          console.error('Error loading tenant occupancy:', error);
        }
      }
      
      console.log('Generated rooms:', rooms);
      setAvailableRooms(rooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
      // Fallback to default rooms if there's an error (all unoccupied for testing)
      setAvailableRooms([
        { id: '101', name: 'Room 101 (Ground Floor)', roomNumber: '101', type: 'Single Room', unitType: 'room', sharingType: 'single', capacity: 1, occupied: 0, floorName: 'Ground Floor', rent: 5000, deposit: 10000 },
        { id: '102', name: 'Room 102 (Ground Floor)', roomNumber: '102', type: 'Double Sharing', unitType: 'room', sharingType: 'double', capacity: 2, occupied: 0, floorName: 'Ground Floor', rent: 4000, deposit: 8000 },
      ]);
    }
  };

  const handleInputChange = (field: keyof CreateTenantData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, userId: user.uid }));
    setShowUserPicker(false);
  };

  const handlePropertySelect = (property: any) => {
    setSelectedProperty(property);
    setFormData(prev => ({ ...prev, propertyId: property.id }));
    setShowPropertyPicker(false);
    setSelectedRoom(null);
    setFormData(prev => ({ ...prev, roomId: '' }));
  };

  const handleRoomSelect = (room: any) => {
    setSelectedRoom(room);
    setFormData(prev => ({ ...prev, roomId: room.id }));
    setShowRoomPicker(false);
  };

  const validateForm = (): boolean => {
    if (!formData.userId) {
      Alert.alert('Error', 'Please select a user');
      return false;
    }
    if (!formData.propertyId) {
      Alert.alert('Error', 'Please select a property');
      return false;
    }
    if (!formData.roomId) {
      Alert.alert('Error', 'Please select a room');
      return false;
    }
    if (!formData.rent || formData.rent <= 0) {
      Alert.alert('Error', 'Please enter a valid rent amount');
      return false;
    }
    if (!formData.deposit || formData.deposit <= 0) {
      Alert.alert('Error', 'Please enter a valid deposit amount');
      return false;
    }
    if (agreementStart >= agreementEnd) {
      Alert.alert('Error', 'Agreement end date must be after start date');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const tenantData: CreateTenantData = {
        userId: formData.userId!,
        roomId: formData.roomId!,
        propertyId: formData.propertyId!,
        rent: formData.rent!,
        deposit: formData.deposit!,
        agreementStart: firestore.Timestamp.fromDate(agreementStart),
        agreementEnd: firestore.Timestamp.fromDate(agreementEnd),
      };

      await createTenant(tenantData);
      Alert.alert('Success', 'Tenant added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add tenant');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const showDatePicker = (isStartDate: boolean) => {
    if (isStartDate) {
      setShowStartDatePicker(true);
    } else {
      setShowEndDatePicker(true);
    }
  };

  const renderPickerModal = (title: string, data: any[], onSelect: (item: any) => void, visible: boolean, onClose: () => void) => {
    if (!visible) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {data.length === 0 ? (
              <View style={styles.emptyModalItem}>
                <Text style={styles.emptyModalText}>
                  {title === 'Select Approved Tenant' 
                    ? 'No approved tenants available. Only tenants with approved applications and no room assignments are shown.'
                    : title === 'Select Room'
                    ? 'No available rooms found for this property. All rooms are currently occupied or fully booked.'
                    : 'No items available'
                  }
                </Text>
                {title === 'Select Approved Tenant' && (
                  <TouchableOpacity style={styles.createTestUserButton} onPress={createTestTenantUser}>
                    <Text style={styles.createTestUserButtonText}>Create Test Tenant User</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              data.map((item) => (
                <TouchableOpacity
                  key={item.id || item.uid}
                  style={styles.modalItem}
                  onPress={() => onSelect(item)}
                >
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemText}>
                      {item.name || 'No Name'}
                    </Text>
                                         {title === 'Select Room' ? (
                       // Show room-specific information
                       <Text style={styles.modalItemSubtext}>
                         {item.type} • {item.occupied}/{item.capacity} occupied
                         {item.floorName && ` • ${item.floorName}`}
                         {item.rent > 0 && ` • ₹${item.rent.toLocaleString()}/month`}
                         {item.occupied === 0 && ' • Available'}
                       </Text>
                     ) : (
                      // Show user information
                      <>
                        <Text style={styles.modalItemSubtext}>
                          {item.email}
                        </Text>
                        {item.phone && (
                          <Text style={styles.modalItemSubtext}>
                            {item.phone}
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Tenant</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Approved Tenant</Text>
          <TouchableOpacity
            style={[styles.pickerButton, availableUsers.length === 0 && styles.pickerButtonDisabled]}
            onPress={() => availableUsers.length > 0 && setShowUserPicker(true)}
            disabled={availableUsers.length === 0}
          >
            <Text style={selectedUser ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
              {selectedUser 
                ? selectedUser.name || selectedUser.email 
                : availableUsers.length === 0 
                  ? 'No approved tenants available' 
                  : 'Select an approved tenant'
              }
            </Text>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>
          {availableUsers.length === 0 && (
            <Text style={styles.helperText}>
              No approved tenants found. Only tenants with approved applications and no room assignments are shown here.
            </Text>
          )}
        </View>

        {/* Property Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Property</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowPropertyPicker(true)}
          >
            <Text style={selectedProperty ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
              {selectedProperty ? selectedProperty.name : 'Select a property'}
            </Text>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Room Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Room</Text>
          <TouchableOpacity
            style={[styles.pickerButton, !selectedProperty && styles.pickerButtonDisabled]}
            onPress={() => selectedProperty && setShowRoomPicker(true)}
            disabled={!selectedProperty}
          >
            <Text style={selectedRoom ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
              {selectedRoom ? selectedRoom.name : selectedProperty ? 'Select a room' : 'Select property first'}
            </Text>
            <Text style={styles.pickerArrow}>›</Text>
          </TouchableOpacity>
                     {selectedRoom && (
             <Text style={styles.helperText}>
               {selectedRoom.type} • {selectedRoom.occupied}/{selectedRoom.capacity} currently occupied
               {selectedRoom.floorName && ` • ${selectedRoom.floorName}`}
               {selectedRoom.rent > 0 && ` • ₹${selectedRoom.rent.toLocaleString()}/month`}
             </Text>
           )}
        </View>

        {/* Rent Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Rent (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter monthly rent amount"
            placeholderTextColor={colors.textMuted}
            value={formData.rent?.toString() || ''}
            onChangeText={(value) => handleInputChange('rent', parseFloat(value) || 0)}
            keyboardType="numeric"
          />
        </View>

        {/* Deposit Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Deposit (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter security deposit amount"
            placeholderTextColor={colors.textMuted}
            value={formData.deposit?.toString() || ''}
            onChangeText={(value) => handleInputChange('deposit', parseFloat(value) || 0)}
            keyboardType="numeric"
          />
        </View>

        {/* Agreement Dates */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.agreementPeriodTitle]}>Agreement Period</Text>
          <View style={styles.dateContainer}>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => showDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dateLabel}>Start Date</Text>
              <Text style={styles.dateValue}>{formatDate(agreementStart)}</Text>
              <Text style={styles.datePickerHint}>Tap to change</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => showDatePicker(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.dateLabel}>End Date</Text>
              <Text style={styles.dateValue}>{formatDate(agreementEnd)}</Text>
              <Text style={styles.datePickerHint}>Tap to change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Add Tenant</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={clearError}>
            <Text style={styles.errorButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Picker Modals */}
      {renderPickerModal(
        'Select Approved Tenant',
        availableUsers,
        handleUserSelect,
        showUserPicker,
        () => setShowUserPicker(false)
      )}

      {renderPickerModal(
        'Select Property',
        availableProperties,
        handlePropertySelect,
        showPropertyPicker,
        () => setShowPropertyPicker(false)
      )}

      {renderPickerModal(
        'Select Room',
        availableRooms,
        handleRoomSelect,
        showRoomPicker,
        () => setShowRoomPicker(false)
      )}

      {/* Native Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={agreementStart}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowStartDatePicker(false);
            }
            if (event.type === 'set' && selectedDate) {
              setAgreementStart(selectedDate);
              // Update end date if needed
              if (agreementEnd <= selectedDate) {
                const newEndDate = new Date(selectedDate);
                newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                setAgreementEnd(newEndDate);
              }
            }
            if (Platform.OS === 'ios') {
              setShowStartDatePicker(false);
            }
          }}
          minimumDate={new Date()}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={agreementEnd}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowEndDatePicker(false);
            }
            if (event.type === 'set' && selectedDate) {
              setAgreementEnd(selectedDate);
            }
            if (Platform.OS === 'ios') {
              setShowEndDatePicker(false);
            }
          }}
          minimumDate={agreementStart}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    height: 56,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    marginRight: dimensions.spacing.md,
  },
  backIcon: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
    paddingTop: dimensions.spacing.md,
  },
  section: {
    marginBottom: dimensions.spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
    marginTop: dimensions.spacing.lg,
  },
  agreementPeriodTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: dimensions.spacing.md,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  pickerButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerButtonDisabled: {
    backgroundColor: colors.lightGray,
    opacity: 0.6,
  },
  pickerButtonText: {
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
  pickerButtonPlaceholder: {
    fontSize: fonts.md,
    color: colors.textMuted,
  },
  pickerArrow: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
  },
  helperText: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    marginTop: dimensions.spacing.xs,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    fontSize: fonts.md,
    color: colors.textPrimary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
    marginBottom: dimensions.spacing.sm,
  },
  dateInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 60,
    justifyContent: 'center',
  },
  dateLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateValue: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: dimensions.spacing.xs,
  },
  datePickerHint: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
    marginVertical: dimensions.spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 48,
    borderWidth: 0,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textMuted,
    shadowOpacity: 0.1,
    shadowColor: colors.textMuted,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  errorContainer: {
    backgroundColor: colors.error,
    marginHorizontal: dimensions.spacing.lg,
    marginVertical: dimensions.spacing.md,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: colors.white,
    fontSize: fonts.sm,
    flex: 1,
  },
  errorButton: {
    marginLeft: dimensions.spacing.md,
  },
  errorButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    width: '90%',
    maxHeight: '70%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: dimensions.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemText: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  modalItemSubtext: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyModalItem: {
    padding: dimensions.spacing.lg,
    alignItems: 'center',
  },
  emptyModalText: {
    fontSize: fonts.md,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: dimensions.spacing.md,
  },
  createTestUserButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
     createTestUserButtonText: {
     color: colors.white,
     fontSize: fonts.sm,
     fontWeight: '600',
   },
});

export default AddTenantScreen;
