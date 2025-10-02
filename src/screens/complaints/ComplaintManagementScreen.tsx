import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { 
  Complaint, 
  ComplaintStatus, 
  ComplaintPriority, 
  ComplaintCategory,
  ComplaintFilters 
} from '../../types/complaint.types';
import { useComplaints } from '../../hooks/useComplaints';
import { useAuth } from '../../contexts/AuthContext';
import { useProperties } from '../../hooks/useProperties';
import { Property } from '../../types/property.types';
import { firestoreService } from '../../services/firestore';

interface ComplaintManagementScreenProps {
  navigation: any;
  route: any;
}

const ComplaintManagementScreen: React.FC<ComplaintManagementScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { 
    complaints, 
    loading, 
    error, 
    getComplaints,
    updateComplaint,
    refreshComplaints,
    clearError 
  } = useComplaints();
  const { properties, getPropertiesByOwner } = useProperties();
  
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);

  // Load properties when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadProperties();
      }
    }, [user?.uid])
  );

  // Load rooms when property changes
  useEffect(() => {
    if (selectedProperty) {
      loadRooms(selectedProperty.id);
    } else {
      setAvailableRooms([]);
      setSelectedRoom(null);
    }
  }, [selectedProperty]);

  // Load complaints when filters change
  useEffect(() => {
    loadComplaints();
  }, [selectedProperty, selectedRoom, filter]);

  const loadProperties = async () => {
    if (user?.uid) {
      await getPropertiesByOwner(user.uid);
    }
  };

  const loadRooms = async (propertyId: string) => {
    try {
      // Get room mapping for the property
      const roomMapping = await firestoreService.getRoomMapping(propertyId);
      const rooms: any[] = [];
      
      if (roomMapping && roomMapping.floors) {
        // Process floors to extract room information
        roomMapping.floors.forEach((floor: any) => {
          if (floor.units && Array.isArray(floor.units)) {
            floor.units.forEach((unit: any) => {
              rooms.push({
                id: unit.id || unit.unitNumber,
                roomNumber: unit.unitNumber,
                unitType: unit.unitType,
                floorName: floor.floorName,
                capacity: unit.capacity,
                rent: unit.rent,
                deposit: unit.deposit,
              });
            });
          }
        });
      }
      
      setAvailableRooms(rooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setAvailableRooms([]);
    }
  };

  const loadComplaints = async () => {
    try {
      const filters: ComplaintFilters = {};
      
      if (selectedProperty) {
        filters.propertyId = selectedProperty.id;
      }
      
      if (selectedRoom) {
        filters.roomId = selectedRoom.id;
      }
      
      if (filter !== 'all') {
        filters.status = [filter as ComplaintStatus];
      }

      await getComplaints(filters);
    } catch (error) {
      console.error('Error loading complaints:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadComplaints();
    setRefreshing(false);
  };

  const handleResolveComplaint = async (complaint: Complaint) => {
    try {
      await updateComplaint(complaint.id, { 
        status: ComplaintStatus.RESOLVED,
        resolvedAt: new Date(),
        resolution: 'Resolved by property manager'
      });
      
      // Refresh the complaints list
      await loadComplaints();
    } catch (error) {
      console.error('Error resolving complaint:', error);
      // You could show an alert here if needed
    }
  };

  const handlePropertySelect = (property: Property | null) => {
    setSelectedProperty(property);
    setSelectedRoom(null); // Reset room selection when property changes
    setShowPropertyPicker(false);
  };

  const handleRoomSelect = (room: any) => {
    setSelectedRoom(room);
    setShowRoomPicker(false);
  };

  // Filter complaints based on selected filter (additional client-side filtering)
  const filteredComplaints = complaints.filter(complaint => {
    switch (filter) {
      case 'open':
        return complaint.status === ComplaintStatus.OPEN;
      case 'in_progress':
        return complaint.status === ComplaintStatus.IN_PROGRESS;
      case 'resolved':
        return complaint.status === ComplaintStatus.RESOLVED;
      case 'closed':
        return complaint.status === ComplaintStatus.CLOSED;
      default:
        return true;
    }
  });

  // Get status color
  const getStatusColor = (status: ComplaintStatus) => {
    const statusColors = {
      [ComplaintStatus.OPEN]: colors.warning,
      [ComplaintStatus.IN_PROGRESS]: colors.primary,
      [ComplaintStatus.RESOLVED]: colors.success,
      [ComplaintStatus.CLOSED]: colors.textMuted,
      [ComplaintStatus.CANCELLED]: colors.error,
      [ComplaintStatus.ESCALATED]: colors.error,
    };
    return statusColors[status] || colors.textSecondary;
  };

  // Get priority color
  const getPriorityColor = (priority: ComplaintPriority) => {
    const priorityColors = {
      [ComplaintPriority.LOW]: colors.success,
      [ComplaintPriority.MEDIUM]: colors.warning,
      [ComplaintPriority.HIGH]: colors.error,
      [ComplaintPriority.URGENT]: '#FF0000',
      [ComplaintPriority.CRITICAL]: '#8B0000',
    };
    return priorityColors[priority] || colors.warning;
  };

  // Get category color
  const getCategoryColor = (category: ComplaintCategory) => {
    const categoryColors = {
      [ComplaintCategory.ELECTRICAL]: '#FF6B6B',
      [ComplaintCategory.PLUMBING]: '#4ECDC4',
      [ComplaintCategory.WATER]: '#45B7D1',
      [ComplaintCategory.CLEANING]: '#96CEB4',
      [ComplaintCategory.SECURITY]: '#FFEAA7',
      [ComplaintCategory.INTERNET]: '#DDA0DD',
      [ComplaintCategory.HVAC]: '#98D8C8',
      [ComplaintCategory.FURNITURE]: '#F7DC6F',
      [ComplaintCategory.STRUCTURAL]: '#BB8FCE',
      [ComplaintCategory.NOISE]: '#85C1E9',
      [ComplaintCategory.OTHER]: '#A9A9A9',
    };
    return categoryColors[category] || '#A9A9A9';
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render complaint card
  const renderComplaintCard = (complaint: Complaint) => (
    <View
      key={complaint.id}
      style={styles.complaintCard}
    >
      <View style={styles.complaintHeader}>
        <View style={styles.complaintTitleContainer}>
          <Text style={styles.complaintTitle} numberOfLines={2}>
            {complaint.title}
          </Text>
          <Text style={styles.complaintDate}>
            {formatDate(complaint.createdAt)}
          </Text>
          <Text style={styles.complaintLocation}>
            {complaint.propertyName} - Room {complaint.roomId}
          </Text>
        </View>
        <View style={styles.complaintBadges}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status) }]}>
            <Text style={styles.statusText}>
              {complaint.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(complaint.priority) }]}>
            <Text style={styles.priorityText}>
              {complaint.priority.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.complaintBody}>
        <Text style={styles.complaintDescription} numberOfLines={3}>
          {complaint.description}
        </Text>
        
        <View style={styles.complaintFooter}>
          <View style={styles.complaintFooterLeft}>
            <View style={[styles.categoryChip, { backgroundColor: getCategoryColor(complaint.category) }]}>
              <Text style={styles.categoryText}>
                {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}
              </Text>
            </View>
            
            {complaint.tenantName && (
              <Text style={styles.tenantText}>
                By: {complaint.tenantName}
              </Text>
            )}
          </View>
          
          {complaint.status === ComplaintStatus.OPEN && (
            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => handleResolveComplaint(complaint)}
            >
              <Text style={styles.resolveButtonText}>Resolve</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  if (loading && complaints.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading complaints...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Complaint Management</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Property and Room Filters */}
        <View style={styles.dropdownFilters}>
          <TouchableOpacity
            style={styles.filterDropdown}
            onPress={() => setShowPropertyPicker(true)}
          >
            <Text style={styles.filterDropdownText}>
              {selectedProperty ? selectedProperty.name : 'All Properties'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterDropdown, !selectedProperty && styles.filterDropdownDisabled]}
            onPress={() => selectedProperty && setShowRoomPicker(true)}
            disabled={!selectedProperty}
          >
            <Text style={[styles.filterDropdownText, !selectedProperty && styles.filterDropdownTextDisabled]}>
              {selectedRoom ? `Room ${selectedRoom.roomNumber}` : 'All Rooms'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Status Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterChip,
                filter === filterType && styles.filterChipActive
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text style={[
                styles.filterText,
                filter === filterType && styles.filterTextActive
              ]}>
                {filterType.charAt(0).toUpperCase() + filterType.slice(1).replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadComplaints}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {filteredComplaints.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No Complaints Found' : `No ${filter.replace('_', ' ')} Complaints`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedProperty || selectedRoom
                ? 'No complaints found for the selected filters'
                : 'Complaints from your properties will appear here'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.complaintsList}>
            {filteredComplaints.map(renderComplaintCard)}
          </View>
        )}
      </ScrollView>

      {/* Property Picker Modal */}
      <Modal
        visible={showPropertyPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPropertyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Property</Text>
              <TouchableOpacity onPress={() => setShowPropertyPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handlePropertySelect(null)}
              >
                <Text style={[styles.modalItemText, !selectedProperty && styles.modalItemTextSelected]}>
                  All Properties
                </Text>
              </TouchableOpacity>
              {properties.map((property) => (
                <TouchableOpacity
                  key={property.id}
                  style={styles.modalItem}
                  onPress={() => handlePropertySelect(property)}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedProperty?.id === property.id && styles.modalItemTextSelected
                  ]}>
                    {property.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Room Picker Modal */}
      <Modal
        visible={showRoomPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoomPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Room</Text>
              <TouchableOpacity onPress={() => setShowRoomPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => handleRoomSelect(null)}
              >
                <Text style={[styles.modalItemText, !selectedRoom && styles.modalItemTextSelected]}>
                  All Rooms
                </Text>
              </TouchableOpacity>
              {availableRooms.map((room) => (
                <TouchableOpacity
                  key={room.id}
                  style={styles.modalItem}
                  onPress={() => handleRoomSelect(room)}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedRoom?.id === room.id && styles.modalItemTextSelected
                  ]}>
                    Room {room.roomNumber}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginTop: dimensions.spacing.md,
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
  headerSpacer: {
    width: 32,
  },
  filtersContainer: {
    backgroundColor: colors.white,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  dropdownFilters: {
    flexDirection: 'row',
    marginBottom: dimensions.spacing.md,
    gap: dimensions.spacing.sm,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
  },
  filterDropdownDisabled: {
    backgroundColor: colors.lightGray,
    opacity: 0.6,
  },
  filterDropdownText: {
    fontSize: fonts.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  filterDropdownTextDisabled: {
    color: colors.textMuted,
  },
  dropdownIcon: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginLeft: dimensions.spacing.sm,
  },
  statusFilters: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: 20,
    marginRight: dimensions.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fonts.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  errorContainer: {
    backgroundColor: colors.error,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginVertical: dimensions.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: colors.white,
    fontSize: fonts.sm,
    flex: 1,
  },
  retryButton: {
    marginLeft: dimensions.spacing.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: dimensions.spacing.lg,
  },
  emptyTitle: {
    fontSize: fonts.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: dimensions.spacing.lg,
    paddingHorizontal: dimensions.spacing.lg,
  },
  complaintsList: {
    paddingVertical: dimensions.spacing.md,
  },
  complaintCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: dimensions.spacing.sm,
  },
  complaintTitleContainer: {
    flex: 1,
    marginRight: dimensions.spacing.sm,
  },
  complaintTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  complaintDate: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  complaintLocation: {
    fontSize: fonts.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  complaintBadges: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: dimensions.spacing.xs,
  },
  statusText: {
    color: colors.white,
    fontSize: fonts.xs,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    color: colors.white,
    fontSize: fonts.xs,
    fontWeight: '600',
  },
  complaintBody: {
    marginTop: dimensions.spacing.sm,
  },
  complaintDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: dimensions.spacing.sm,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complaintFooterLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryChip: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: colors.white,
    fontSize: fonts.xs,
    fontWeight: '600',
  },
  tenantText: {
    fontSize: fonts.xs,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: dimensions.borderRadius.lg,
    borderTopRightRadius: dimensions.borderRadius.lg,
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
    fontWeight: 'bold',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: dimensions.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalItemText: {
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
  modalItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  resolveButton: {
    backgroundColor: colors.success,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    marginLeft: dimensions.spacing.sm,
  },
  resolveButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
});

export default ComplaintManagementScreen;
