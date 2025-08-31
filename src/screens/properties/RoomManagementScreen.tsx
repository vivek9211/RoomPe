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
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { Property } from '../../types/property.types';
import { Room, RoomStatus, RoomType, RoomAmenities } from '../../types/room.types';
import { firestoreService } from '../../services/firestore';

interface RoomManagementScreenProps {
  navigation: any;
  route: any;
}

interface Bed {
  id: string;
  bedNumber: string;
  isOccupied: boolean;
  tenantId?: string;
  tenantName?: string;
  assignedAt?: Date;
  rent?: number;
  deposit?: number;
}

interface RoomWithBeds extends Room {
  beds: Bed[];
}

const RoomManagementScreen: React.FC<RoomManagementScreenProps> = ({ navigation, route }) => {
  const { property } = route.params || {};
  const [rooms, setRooms] = useState<RoomWithBeds[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<RoomStatus | 'all'>('all');
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithBeds | null>(null);
  const [newRoomData, setNewRoomData] = useState({
    roomNumber: '',
    type: RoomType.SINGLE,
    capacity: 1,
    rent: 0,
    deposit: 0,
  });
  const [newBedData, setNewBedData] = useState({
    bedNumber: '',
    rent: 0,
    deposit: 0,
  });

  useEffect(() => {
    if (property) {
      loadRooms();
    }
  }, [property]);

  const loadRooms = async () => {
    if (!property?.id) return;

    setLoading(true);
    try {
      // TODO: Implement actual room loading from Firestore
      // For now, using mock data
      const mockRooms: RoomWithBeds[] = [
        {
          id: '1',
          propertyId: property.id,
          roomNumber: '101',
          type: RoomType.SINGLE,
          status: RoomStatus.OCCUPIED,
          capacity: 2,
          occupied: 2,
          pricing: { rent: 8000, deposit: 16000, currency: 'INR' },
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
          tenantIds: ['tenant1', 'tenant2'],
          beds: [
            {
              id: 'bed1',
              bedNumber: 'A',
              isOccupied: true,
              tenantId: 'tenant1',
              tenantName: 'John Doe',
              assignedAt: new Date(),
              rent: 4000,
              deposit: 8000,
            },
            {
              id: 'bed2',
              bedNumber: 'B',
              isOccupied: true,
              tenantId: 'tenant2',
              tenantName: 'Jane Smith',
              assignedAt: new Date(),
              rent: 4000,
              deposit: 8000,
            },
          ],
        },
        {
          id: '2',
          propertyId: property.id,
          roomNumber: '102',
          type: RoomType.DOUBLE,
          status: RoomStatus.AVAILABLE,
          capacity: 2,
          occupied: 0,
          pricing: { rent: 10000, deposit: 20000, currency: 'INR' },
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
          tenantIds: [],
          beds: [
            {
              id: 'bed3',
              bedNumber: 'A',
              isOccupied: false,
              rent: 5000,
              deposit: 10000,
            },
            {
              id: 'bed4',
              bedNumber: 'B',
              isOccupied: false,
              rent: 5000,
              deposit: 10000,
            },
          ],
        },
      ];
      setRooms(mockRooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
      Alert.alert('Error', 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRooms();
  };

  const handleAddRoom = () => {
    if (!newRoomData.roomNumber || newRoomData.rent <= 0) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const newRoom: RoomWithBeds = {
      id: Date.now().toString(),
      propertyId: property.id,
      roomNumber: newRoomData.roomNumber,
      type: newRoomData.type,
      status: RoomStatus.AVAILABLE,
      capacity: newRoomData.capacity,
      occupied: 0,
      pricing: {
        rent: newRoomData.rent,
        deposit: newRoomData.deposit,
        currency: 'INR',
      },
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
      tenantIds: [],
      beds: [],
    };

    setRooms(prev => [...prev, newRoom]);
    setNewRoomData({ roomNumber: '', type: RoomType.SINGLE, capacity: 1, rent: 0, deposit: 0 });
    setShowAddRoomModal(false);
    Alert.alert('Success', 'Room added successfully');
  };

  const handleAddBed = () => {
    if (!selectedRoom || !newBedData.bedNumber) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const newBed: Bed = {
      id: Date.now().toString(),
      bedNumber: newBedData.bedNumber,
      isOccupied: false,
      rent: newBedData.rent,
      deposit: newBedData.deposit,
    };

    const updatedRooms = rooms.map(room =>
      room.id === selectedRoom.id
        ? { ...room, beds: [...room.beds, newBed] }
        : room
    );

    setRooms(updatedRooms);
    setNewBedData({ bedNumber: '', rent: 0, deposit: 0 });
    setShowAddBedModal(false);
    setSelectedRoom(null);
    Alert.alert('Success', 'Bed added successfully');
  };

  const handleAssignTenant = (roomId: string, bedId: string) => {
    // TODO: Implement tenant assignment logic
    Alert.alert('Info', 'Tenant assignment feature coming soon!');
  };

  const handleVacateBed = (roomId: string, bedId: string) => {
    Alert.alert(
      'Vacate Bed',
      'Are you sure you want to vacate this bed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Vacate',
          style: 'destructive',
          onPress: () => {
            const updatedRooms = rooms.map(room =>
              room.id === roomId
                ? {
                    ...room,
                    beds: room.beds.map(bed =>
                      bed.id === bedId
                        ? { ...bed, isOccupied: false, tenantId: undefined, tenantName: undefined, assignedAt: undefined }
                        : bed
                    ),
                    occupied: room.beds.filter(bed => bed.isOccupied).length,
                    status: room.beds.every(bed => !bed.isOccupied) ? RoomStatus.AVAILABLE : RoomStatus.OCCUPIED,
                  }
                : room
            );
            setRooms(updatedRooms);
            Alert.alert('Success', 'Bed vacated successfully');
          },
        },
      ]
    );
  };

  const handleEditRoom = (room: RoomWithBeds) => {
    // TODO: Implement room editing
    Alert.alert('Info', 'Room editing feature coming soon!');
  };

  const handleDeleteRoom = (roomId: string) => {
    Alert.alert(
      'Delete Room',
      'Are you sure you want to delete this room? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setRooms(prev => prev.filter(room => room.id !== roomId));
            Alert.alert('Success', 'Room deleted successfully');
          },
        },
      ]
    );
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const renderBed = (bed: Bed, room: RoomWithBeds) => (
    <View key={bed.id} style={styles.bedCard}>
      <View style={styles.bedHeader}>
        <Text style={styles.bedNumber}>Bed {bed.bedNumber}</Text>
        <View style={[styles.bedStatus, { backgroundColor: bed.isOccupied ? colors.error : colors.success }]}>
          <Text style={styles.bedStatusText}>
            {bed.isOccupied ? 'Occupied' : 'Available'}
          </Text>
        </View>
      </View>
      
      {bed.isOccupied ? (
        <View style={styles.tenantInfo}>
          <Text style={styles.tenantName}>👤 {bed.tenantName}</Text>
          <Text style={styles.tenantDetails}>
            Rent: ₹{bed.rent}/month | Deposit: ₹{bed.deposit}
          </Text>
          <Text style={styles.assignedDate}>
            Assigned: {bed.assignedAt?.toLocaleDateString()}
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.vacateButton]}
            onPress={() => handleVacateBed(room.id, bed.id)}
          >
            <Text style={styles.actionButtonText}>Vacate Bed</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.availableBed}>
          <Text style={styles.availableText}>Available for rent</Text>
          <Text style={styles.bedPricing}>
            Rent: ₹{bed.rent}/month | Deposit: ₹{bed.deposit}
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.assignButton]}
            onPress={() => handleAssignTenant(room.id, bed.id)}
          >
            <Text style={styles.actionButtonText}>Assign Tenant</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderRoom = (room: RoomWithBeds) => (
    <View key={room.id} style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomNumber}>Room {room.roomNumber}</Text>
          <Text style={styles.roomType}>{room.type}</Text>
        </View>
        <View style={[styles.roomStatus, { backgroundColor: getStatusColor(room.status) }]}>
          <Text style={styles.roomStatusText}>{room.status}</Text>
        </View>
      </View>
      
      <View style={styles.roomStats}>
        <Text style={styles.statText}>
          🏠 Capacity: {room.capacity} | Occupied: {room.occupied}
        </Text>
        <Text style={styles.statText}>
          💰 Rent: ₹{room.pricing.rent}/month | Deposit: ₹{room.pricing.deposit}
        </Text>
      </View>
      
      <View style={styles.bedsContainer}>
        <View style={styles.bedsHeader}>
          <Text style={styles.bedsTitle}>Beds ({room.beds.length})</Text>
          <TouchableOpacity
            style={styles.addBedButton}
            onPress={() => {
              setSelectedRoom(room);
              setShowAddBedModal(true);
            }}
          >
            <Text style={styles.addBedButtonText}>+ Add Bed</Text>
          </TouchableOpacity>
        </View>
        
        {room.beds.length > 0 ? (
          room.beds.map(bed => renderBed(bed, room))
        ) : (
          <Text style={styles.noBedsText}>No beds added yet</Text>
        )}
      </View>
      
      <View style={styles.roomActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditRoom(room)}
        >
          <Text style={styles.actionButtonText}>Edit Room</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteRoom(room.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.AVAILABLE: return colors.success;
      case RoomStatus.OCCUPIED: return colors.primary;
      case RoomStatus.MAINTENANCE: return colors.warning;
      case RoomStatus.RESERVED: return colors.info;
      case RoomStatus.RENOVATION: return colors.error;
      default: return colors.gray;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Room Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddRoomModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Room</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search rooms..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', ...Object.values(RoomStatus)].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive
              ]}
              onPress={() => setFilterStatus(status as RoomStatus | 'all')}
            >
              <Text style={[
                styles.filterChipText,
                filterStatus === status && styles.filterChipTextActive
              ]}>
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Rooms List */}
      <ScrollView
        style={styles.roomsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {filteredRooms.map(renderRoom)}
        
        {!loading && filteredRooms.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No rooms found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Add your first room to start managing your property'
              }
            </Text>
            {!searchQuery && filterStatus === 'all' && (
              <TouchableOpacity
                style={styles.addFirstRoomButton}
                onPress={() => setShowAddRoomModal(true)}
              >
                <Text style={styles.addFirstRoomButtonText}>Add Your First Room</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Room Modal */}
      <Modal
        visible={showAddRoomModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddRoomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Room</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Room Number (e.g., 101)"
              value={newRoomData.roomNumber}
              onChangeText={(text) => setNewRoomData(prev => ({ ...prev, roomNumber: text }))}
            />
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Rent (₹)"
                keyboardType="numeric"
                value={newRoomData.rent.toString()}
                onChangeText={(text) => setNewRoomData(prev => ({ ...prev, rent: parseInt(text) || 0 }))}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Deposit (₹)"
                keyboardType="numeric"
                value={newRoomData.deposit.toString()}
                onChangeText={(text) => setNewRoomData(prev => ({ ...prev, deposit: parseInt(text) || 0 }))}
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddRoomModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddRoom}
              >
                <Text style={styles.saveButtonText}>Add Room</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Bed Modal */}
      <Modal
        visible={showAddBedModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddBedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Bed to Room {selectedRoom?.roomNumber}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Bed Number (e.g., A, B, 1, 2)"
              value={newBedData.bedNumber}
              onChangeText={(text) => setNewBedData(prev => ({ ...prev, bedNumber: text }))}
            />
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Rent (₹)"
                keyboardType="numeric"
                value={newBedData.rent.toString()}
                onChangeText={(text) => setNewBedData(prev => ({ ...prev, rent: parseInt(text) || 0 }))}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Deposit (₹)"
                keyboardType="numeric"
                value={newBedData.deposit.toString()}
                onChangeText={(text) => setNewBedData(prev => ({ ...prev, deposit: parseInt(text) || 0 }))}
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddBedModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddBed}
              >
                <Text style={styles.saveButtonText}>Add Bed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  addButton: {
    backgroundColor: colors.white,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.sm,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    height: 48,
    marginBottom: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: dimensions.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
  filterContainer: {
    marginBottom: dimensions.spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.white,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.sm,
    marginRight: dimensions.spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  roomsList: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  roomCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  roomInfo: {
    flex: 1,
  },
  roomNumber: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  roomType: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roomStatus: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  roomStatusText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
  roomStats: {
    marginBottom: dimensions.spacing.md,
  },
  statText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bedsContainer: {
    marginBottom: dimensions.spacing.md,
  },
  bedsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  bedsTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  addBedButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  addBedButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
  noBedsText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: dimensions.spacing.md,
  },
  bedCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: dimensions.borderRadius.sm,
    padding: dimensions.spacing.md,
    marginBottom: dimensions.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  bedNumber: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bedStatus: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: 2,
    borderRadius: dimensions.borderRadius.sm,
  },
  bedStatusText: {
    color: colors.white,
    fontSize: fonts.xs,
    fontWeight: '500',
  },
  tenantInfo: {
    marginBottom: dimensions.spacing.sm,
  },
  tenantName: {
    fontSize: fonts.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tenantDetails: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  assignedDate: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.sm,
  },
  availableBed: {
    marginBottom: dimensions.spacing.sm,
  },
  availableText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bedPricing: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.sm,
  },
  roomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: dimensions.spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.sm,
    paddingHorizontal: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.sm,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.warning,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  assignButton: {
    backgroundColor: colors.success,
  },
  vacateButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xl,
  },
  emptyStateText: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  addFirstRoomButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  addFirstRoomButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xl,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.lg,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: dimensions.borderRadius.sm,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    fontSize: fonts.md,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  halfInput: {
    flex: 1,
    marginBottom: 0,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: dimensions.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.sm,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: fonts.md,
    fontWeight: '500',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
});

export default RoomManagementScreen;
