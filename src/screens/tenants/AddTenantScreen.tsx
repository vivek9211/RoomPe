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
import { useNavigation } from '@react-navigation/native';

import { colors, fonts, dimensions } from '../../constants';
import { CreateTenantData, TenantStatus } from '../../types/tenant.types';
import { useTenants } from '../../hooks/useTenants';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestore';
import { User, UserRole } from '../../types/user.types';
import firestore from '@react-native-firebase/firestore';

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
        // Iterate through floor configurations to find available rooms
        for (const floor of roomMapping.floorConfigs) {
          for (const unit of floor.units || []) {
            for (const room of unit.rooms || []) {
              // Check if room is available (not fully occupied)
              if (room.occupied < room.capacity) {
                rooms.push({
                  id: room.id,
                  name: `Room ${room.roomNumber || room.id}`,
                  roomNumber: room.roomNumber || room.id,
                  type: room.type || 'single',
                  capacity: room.capacity || 1,
                  occupied: room.occupied || 0,
                });
              }
            }
          }
        }
      }
      
      // If no rooms found in mapping, create some default rooms
      if (rooms.length === 0) {
        rooms.push(
          { id: '101', name: 'Room 101', roomNumber: '101', type: 'single', capacity: 1, occupied: 0 },
          { id: '102', name: 'Room 102', roomNumber: '102', type: 'single', capacity: 1, occupied: 0 },
          { id: '201', name: 'Room 201', roomNumber: '201', type: 'single', capacity: 1, occupied: 0 },
          { id: '202', name: 'Room 202', roomNumber: '202', type: 'single', capacity: 1, occupied: 0 },
        );
      }
      
      setAvailableRooms(rooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
      // Fallback to default rooms if there's an error
      setAvailableRooms([
        { id: '101', name: 'Room 101', roomNumber: '101', type: 'single', capacity: 1, occupied: 0 },
        { id: '102', name: 'Room 102', roomNumber: '102', type: 'single', capacity: 1, occupied: 0 },
        { id: '201', name: 'Room 201', roomNumber: '201', type: 'single', capacity: 1, occupied: 0 },
        { id: '202', name: 'Room 202', roomNumber: '202', type: 'single', capacity: 1, occupied: 0 },
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

  const handleDateChange = (event: any, selectedDate?: Date, isStartDate: boolean = true) => {
    if (event.type === 'set' && selectedDate) {
      if (isStartDate) {
        setAgreementStart(selectedDate);
        // If end date is before new start date, update end date to be 1 year after start date
        if (agreementEnd <= selectedDate) {
          const newEndDate = new Date(selectedDate);
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          setAgreementEnd(newEndDate);
        }
      } else {
        setAgreementEnd(selectedDate);
      }
    }
    
    // Hide the picker
    if (isStartDate) {
      setShowStartDatePicker(false);
    } else {
      setShowEndDatePicker(false);
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
                    ? 'No available rooms found for this property.'
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
                        {item.type === 'single' ? 'Single Room' : 
                         item.type === 'double' ? 'Double Sharing' :
                         item.type === 'triple' ? 'Triple Sharing' :
                         item.type === 'quad' ? 'Quad Sharing' :
                         item.type === 'ac' ? 'AC Room' :
                         item.type === 'non_ac' ? 'Non-AC Room' :
                         item.type === 'deluxe' ? 'Deluxe Room' :
                         item.type} • {item.occupied}/{item.capacity} occupied
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
              {selectedRoom.type === 'single' ? 'Single Room' : 
               selectedRoom.type === 'double' ? 'Double Sharing' :
               selectedRoom.type === 'triple' ? 'Triple Sharing' :
               selectedRoom.type === 'quad' ? 'Quad Sharing' :
               selectedRoom.type === 'ac' ? 'AC Room' :
               selectedRoom.type === 'non_ac' ? 'Non-AC Room' :
               selectedRoom.type === 'deluxe' ? 'Deluxe Room' :
               selectedRoom.type} • {selectedRoom.occupied}/{selectedRoom.capacity} currently occupied
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
          <Text style={styles.sectionTitle}>Agreement Period</Text>
          <View style={styles.dateContainer}>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => showDatePicker(true)}
            >
              <Text style={styles.dateLabel}>Start Date</Text>
              <Text style={styles.dateValue}>{formatDate(agreementStart)}</Text>
              <Text style={styles.datePickerHint}>Tap to change</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => showDatePicker(false)}
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

      {/* Android Date Pickers */}
      {showStartDatePicker && Platform.OS === 'android' && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerTitle}>Select Start Date</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => {
                // For now, we'll use a simple date increment
                const newDate = new Date();
                setAgreementStart(newDate);
                setShowStartDatePicker(false);
              }}
            >
              <Text style={styles.datePickerButtonText}>Set to Today</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowStartDatePicker(false)}
            >
              <Text style={styles.datePickerButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {showEndDatePicker && Platform.OS === 'android' && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerTitle}>Select End Date</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => {
                // Set end date to 1 year after start date
                const newEndDate = new Date(agreementStart);
                newEndDate.setFullYear(newEndDate.getFullYear() + 1);
                setAgreementEnd(newEndDate);
                setShowEndDatePicker(false);
              }}
            >
              <Text style={styles.datePickerButtonText}>Set to 1 Year Later</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowEndDatePicker(false)}
            >
              <Text style={styles.datePickerButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  },
  section: {
    marginBottom: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  pickerButton: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  dateInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  dateLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  dateValue: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  datePickerHint: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    marginTop: dimensions.spacing.xs,
  },
  datePickerOverlay: {
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
  datePickerContainer: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    width: '80%',
    alignItems: 'center',
  },
  datePickerTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.lg,
  },
  datePickerButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  datePickerButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    paddingVertical: dimensions.spacing.lg,
    alignItems: 'center',
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: colors.lightGray,
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fonts.lg,
    fontWeight: '600',
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
  },
  createTestUserButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
});

export default AddTenantScreen;
