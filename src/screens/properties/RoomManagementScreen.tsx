import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { Property, PropertyType } from '../../types/property.types';
import { 
  Room, 
  RoomStatus, 
  RoomType, 
  RoomAmenities,
  UnitType,
  RoomSharingType,
  Unit,
  Floor
} from '../../types/room.types';
import { Tenant } from '../../types/tenant.types';
import { User } from '../../types/user.types';
import { firestoreService } from '../../services/firestore';
import { tenantApiService } from '../../services/api/tenantApi';

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

interface TenantDisplay {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface UnitWithDetails extends Unit {
  currentTenants: TenantDisplay[];
  amenities: string[];
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
}

// Helper functions
const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

const getCapacityForUnitType = (unitType: UnitType): number => {
  switch (unitType) {
    case UnitType.BHK_1: return 2;
    case UnitType.BHK_2: return 4;
    case UnitType.BHK_3: return 6;
    case UnitType.BHK_4: return 8;
    case UnitType.BHK_5: return 10;
    case UnitType.BHK_6: return 12;
    case UnitType.STUDIO_APARTMENT: return 2;
    case UnitType.RK: return 1;
    default: return 1;
  }
};

const getDefaultRentForUnitType = (unitType: UnitType): number => {
  switch (unitType) {
    case UnitType.BHK_1: return 15000;
    case UnitType.BHK_2: return 25000;
    case UnitType.BHK_3: return 35000;
    case UnitType.BHK_4: return 45000;
    case UnitType.BHK_5: return 55000;
    case UnitType.BHK_6: return 65000;
    case UnitType.STUDIO_APARTMENT: return 12000;
    case UnitType.RK: return 10000;
    default: return 8000;
  }
};

const getDefaultDepositForUnitType = (unitType: UnitType): number => {
  return getDefaultRentForUnitType(unitType) * 2;
};

const getDefaultAmenitiesForUnitType = (unitType: UnitType): string[] => {
  switch (unitType) {
    case UnitType.BHK_1:
    case UnitType.BHK_2:
    case UnitType.BHK_3:
    case UnitType.BHK_4:
    case UnitType.BHK_5:
    case UnitType.BHK_6:
      return ['AC', 'WiFi', 'Kitchen', 'Balcony', 'Parking'];
    case UnitType.STUDIO_APARTMENT:
      return ['AC', 'WiFi', 'Kitchen', 'Balcony'];
    case UnitType.RK:
      return ['AC', 'WiFi', 'Kitchen', 'Attached Bathroom'];
    default:
      return ['AC', 'WiFi'];
  }
};

const getCapacityForSharingType = (sharingType: RoomSharingType): number => {
  switch (sharingType) {
    case RoomSharingType.SINGLE: return 1;
    case RoomSharingType.DOUBLE: return 2;
    case RoomSharingType.TRIPLE: return 3;
    case RoomSharingType.FOUR_SHARING: return 4;
    case RoomSharingType.FIVE_SHARING: return 5;
    case RoomSharingType.SIX_SHARING: return 6;
    case RoomSharingType.SEVEN_SHARING: return 7;
    case RoomSharingType.EIGHT_SHARING: return 8;
    case RoomSharingType.NINE_SHARING: return 9;
    default: return 1;
  }
};

const getDefaultRentForSharingType = (sharingType: RoomSharingType): number => {
  switch (sharingType) {
    case RoomSharingType.SINGLE: return 8000;
    case RoomSharingType.DOUBLE: return 6000;
    case RoomSharingType.TRIPLE: return 5000;
    case RoomSharingType.FOUR_SHARING: return 4000;
    case RoomSharingType.FIVE_SHARING: return 3500;
    case RoomSharingType.SIX_SHARING: return 3000;
    case RoomSharingType.SEVEN_SHARING: return 2800;
    case RoomSharingType.EIGHT_SHARING: return 2500;
    case RoomSharingType.NINE_SHARING: return 2200;
    default: return 8000;
  }
};

const getDefaultDepositForSharingType = (sharingType: RoomSharingType): number => {
  return getDefaultRentForSharingType(sharingType) * 2;
};

const getDefaultAmenitiesForSharingType = (sharingType: RoomSharingType): string[] => {
  switch (sharingType) {
    case RoomSharingType.SINGLE:
      return ['AC', 'WiFi', 'Food', 'Laundry'];
    case RoomSharingType.DOUBLE:
      return ['AC', 'WiFi', 'Food'];
    case RoomSharingType.TRIPLE:
      return ['AC', 'WiFi'];
    case RoomSharingType.FOUR_SHARING:
    case RoomSharingType.FIVE_SHARING:
    case RoomSharingType.SIX_SHARING:
    case RoomSharingType.SEVEN_SHARING:
    case RoomSharingType.EIGHT_SHARING:
    case RoomSharingType.NINE_SHARING:
      return ['AC', 'WiFi'];
    default:
      return ['AC', 'WiFi'];
  }
};

const RoomManagementScreen: React.FC<RoomManagementScreenProps> = ({ navigation, route }) => {
  const { property } = route.params || {};
  const [units, setUnits] = useState<UnitWithDetails[]>([]);
  const [rooms, setRooms] = useState<RoomWithBeds[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<UnitType | null>(null);

  // Form data
  const [newUnitData, setNewUnitData] = useState({
    unitNumber: '',
    unitType: UnitType.ROOM,
    sharingType: RoomSharingType.SINGLE,
    capacity: 1,
    rent: 0,
    deposit: 0,
    floorNumber: 1,
    amenities: [] as string[],
  });

  const [newRoomData, setNewRoomData] = useState({
    roomNumber: '',
    type: RoomType.SINGLE,
    capacity: 1,
    rent: 0,
    deposit: 0,
    floorNumber: 1,
  });

  useEffect(() => {
    if (property) {
      loadPropertyData();
    }
  }, [property]);

  const loadPropertyData = async () => {
    if (!property?.id) return;

    setLoading(true);
    try {
      // Load room mapping data from Firestore
      const roomMapping = await firestoreService.getRoomMapping(property.id);
      
      if (roomMapping) {
        console.log('Room mapping loaded:', roomMapping);
        
        // Check if we have floorConfigs (configuration data) or floors (actual units)
        if (roomMapping.floorConfigs && Array.isArray(roomMapping.floorConfigs)) {
          // This is configuration data, we need to generate actual units
          const floorsData: Floor[] = [];
          const unitsData: UnitWithDetails[] = [];
          
          roomMapping.floorConfigs.forEach((floorConfig: any, floorIndex: number) => {
            const floorNumber = floorIndex + 1;
            const floorName = floorNumber === 1 ? 'Ground Floor' : `${floorNumber - 1}${getOrdinalSuffix(floorNumber - 1)} Floor`;
            
            // Calculate total units for this floor
            const totalUnits = Object.values(floorConfig.unitConfigs || {}).reduce((sum: number, count: any) => sum + (count || 0), 0);
            const totalRooms = Object.values(floorConfig.roomConfigs || {}).reduce((sum: number, count: any) => sum + (count || 0), 0);
            const floorTotalUnits = totalUnits + totalRooms;
            
            const floor: Floor = {
              id: `floor${floorNumber}`,
              floorNumber,
              floorName,
              totalUnits: floorTotalUnits,
              filledUnits: 0,
              vacantUnits: floorTotalUnits,
              units: [],
              createdAt: new Date() as any,
              updatedAt: new Date() as any,
            };
            
            // Generate units from configuration
            let unitCounter = 1;
            
            // Generate BHK units
            Object.entries(floorConfig.unitConfigs || {}).forEach(([unitType, count]) => {
              for (let i = 0; i < (count as number); i++) {
                const unitNumber = `${floorNumber}${String(unitCounter).padStart(2, '0')}`;
                const unit: UnitWithDetails = {
                  id: `${floor.id}_unit_${unitCounter}`,
                  floorId: floor.id,
                  unitNumber,
                  unitType: unitType as UnitType,
                  capacity: getCapacityForUnitType(unitType as UnitType),
                  isOccupied: false,
                  tenantIds: [],
                  rent: getDefaultRentForUnitType(unitType as UnitType),
                  deposit: getDefaultDepositForUnitType(unitType as UnitType),
                  amenities: getDefaultAmenitiesForUnitType(unitType as UnitType),
                  status: 'available',
                  currentTenants: [],
                  createdAt: new Date() as any,
                  updatedAt: new Date() as any,
                };
                unitsData.push(unit);
                floor.units.push(unit);
                unitCounter++;
              }
            });
            
            // Generate room units
            Object.entries(floorConfig.roomConfigs || {}).forEach(([sharingType, count]) => {
              for (let i = 0; i < (count as number); i++) {
                const unitNumber = `${floorNumber}${String(unitCounter).padStart(2, '0')}`;
                const unit: UnitWithDetails = {
                  id: `${floor.id}_unit_${unitCounter}`,
                  floorId: floor.id,
                  unitNumber,
                  unitType: UnitType.ROOM,
                  sharingType: sharingType as RoomSharingType,
                  capacity: getCapacityForSharingType(sharingType as RoomSharingType),
                  isOccupied: false,
                  tenantIds: [],
                  rent: getDefaultRentForSharingType(sharingType as RoomSharingType),
                  deposit: getDefaultDepositForSharingType(sharingType as RoomSharingType),
                  amenities: getDefaultAmenitiesForSharingType(sharingType as RoomSharingType),
                  status: 'available',
                  currentTenants: [],
                  createdAt: new Date() as any,
                  updatedAt: new Date() as any,
                };
                unitsData.push(unit);
                floor.units.push(unit);
                unitCounter++;
              }
            });
            
            floorsData.push(floor);
          });
          
          setUnits(unitsData);
          setFloors(floorsData);
          
        } else if (roomMapping.floors && Array.isArray(roomMapping.floors)) {
          // This is actual unit data
          const floorsData = roomMapping.floors;
          const unitsData: UnitWithDetails[] = [];
          
          // Process each floor and its units
          floorsData.forEach((floor: any) => {
            if (floor.units && Array.isArray(floor.units)) {
              floor.units.forEach((unit: any) => {
                // Convert Firestore timestamp to Date
                const unitWithDetails: UnitWithDetails = {
                  ...unit,
                  createdAt: unit.createdAt?.toDate?.() || new Date(),
                  updatedAt: unit.updatedAt?.toDate?.() || new Date(),
                  currentTenants: [], // Will be populated with tenant details
                  amenities: unit.amenities || [],
                  status: unit.status || 'available',
                };
                unitsData.push(unitWithDetails);
              });
            }
          });
          
          // Load tenant details for occupied units
          const unitsWithTenants = await Promise.all(
            unitsData.map(async (unit) => {
              if (unit.tenantIds && unit.tenantIds.length > 0) {
                const tenantDetails = await Promise.all(
                  unit.tenantIds.map(async (tenantId) => {
                    try {
                      const tenant = await tenantApiService.getTenantById(tenantId);
                      if (tenant) {
                        const user = await firestoreService.getUserProfile(tenant.userId);
                        return {
                          id: tenantId,
                          name: user?.name || 'Unknown Tenant',
                          phone: user?.phone || 'No Phone',
                          email: user?.email || 'No Email',
                        };
                      }
                    } catch (error) {
                      console.error('Error loading tenant details:', error);
                    }
                    return {
                      id: tenantId,
                      name: 'Unknown Tenant',
                      phone: 'No Phone',
                      email: 'No Email',
                    };
                  })
                );
                return {
                  ...unit,
                  currentTenants: tenantDetails.filter(t => t.name !== 'Unknown Tenant'),
                };
              }
              return unit;
            })
          );
          
          setUnits(unitsWithTenants);
          setFloors(floorsData);
        }
        
        // Set rooms data if available (for backward compatibility)
        if (roomMapping.rooms) {
          setRooms(roomMapping.rooms);
        }
        
        console.log('Property data loaded successfully');
      } else {
        console.log('No room mapping found for property:', property.id);
        // Set empty data if no room mapping exists
        setUnits([]);
        setFloors([]);
        setRooms([]);
      }
    } catch (error) {
      console.error('Error loading property data:', error);
      Alert.alert('Error', 'Failed to load property data from Firestore');
    } finally {
      setLoading(false);
    }
  };

  // Simplified flow does not preload available tenants

  const handleRefresh = () => {
    loadPropertyData();
  };

  // Add Unit flow removed from simplified UI

  // Assign Tenant flow removed from simplified UI

  const handleVacateUnit = (unitId: string) => {
    Alert.alert(
      'Vacate Unit',
      'Are you sure you want to vacate this unit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Vacate',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!property?.id) return;
              
              // Update the unit in the room mapping
              const roomMapping = await firestoreService.getRoomMapping(property.id);
              if (roomMapping && roomMapping.floors) {
                const updatedFloors = roomMapping.floors.map((floor: any) => ({
                  ...floor,
                  units: floor.units?.map((unit: any) => 
                    unit.id === unitId
                      ? {
                          ...unit,
                          isOccupied: false,
                          tenantIds: [],
                          status: 'available',
                          updatedAt: new Date(),
                        }
                      : unit
                  ) || []
                }));

                // Save updated room mapping to Firestore
                await firestoreService.createOrUpdateRoomMapping(property.id, {
                  totalFloors: roomMapping.totalFloors,
                  floorConfigs: updatedFloors,
                });

                // Update local state
                const updatedUnits = units.map(unit =>
                  unit.id === unitId
                    ? {
                        ...unit,
                        isOccupied: false,
                        tenantIds: [],
                        currentTenants: [],
                        status: 'available' as const,
                      }
                    : unit
                );
                setUnits(updatedUnits);
                Alert.alert('Success', 'Unit vacated successfully');
              }
            } catch (error) {
              console.error('Error vacating unit:', error);
              Alert.alert('Error', 'Failed to vacate unit. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Edit/Delete flows removed from simplified UI

  // No filters/search in simplified UI

  const getUnitTypeIcon = (unitType: UnitType) => {
    switch (unitType) {
      case UnitType.ROOM: return '🏠';
      case UnitType.RK: return '🏡';
      case UnitType.BHK_1: return '🏢';
      case UnitType.BHK_2: return '🏢';
      case UnitType.BHK_3: return '🏢';
      case UnitType.STUDIO_APARTMENT: return '🏬';
      default: return '🏠';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return colors.success;
      case 'occupied': return colors.primary;
      case 'maintenance': return colors.warning;
      case 'reserved': return colors.info;
      default: return colors.gray;
    }
  };

  const renderUnitCard = (unit: UnitWithDetails) => (
    <TouchableOpacity key={unit.id} style={styles.unitCard} onPress={() => setSelectedUnitId(unit.id)}>
      <View style={styles.unitHeader}>
        <View style={styles.unitInfo}>
          <Text style={styles.unitIcon}>{getUnitTypeIcon(unit.unitType)}</Text>
          <View style={styles.unitDetails}>
            <Text style={styles.unitNumber}>Unit {unit.unitNumber}</Text>
            <Text style={styles.unitType}>
              {unit.unitType.replace('_', ' ').toUpperCase()}
              {unit.sharingType && ` - ${unit.sharingType.replace('_', ' ').toUpperCase()}`}
            </Text>
          </View>
        </View>
        <View style={[styles.unitStatus, { backgroundColor: getStatusColor(unit.status) }]}>
          <Text style={styles.unitStatusText}>{unit.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.unitStats}>
        <Text style={styles.statText}>
          👥 Capacity: {unit.capacity} | Occupied: {unit.currentTenants.length}
        </Text>
        <Text style={styles.statText}>
          💰 Rent: ₹{unit.rent}/month | Deposit: ₹{unit.deposit}
        </Text>
      </View>

    </TouchableOpacity>
  );

  const renderFloorCard = (floor: Floor) => (
    <TouchableOpacity key={floor.id} style={styles.unitCard} onPress={() => {
      setSelectedFloorId(floor.id);
      setSelectedCategory(null);
      setSelectedUnitId(null);
    }}>
      <View style={styles.floorHeader}>
        <Text style={styles.floorTitle}>{floor.floorName}</Text>
        <View style={styles.floorStats}>
          <Text style={styles.floorStatText}>
            {floor.filledUnits}/{floor.totalUnits} occupied
          </Text>
          <Text style={styles.floorStatText}>
            {Math.round((floor.filledUnits / Math.max(1, floor.totalUnits)) * 100)}% occupancy
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryCard = (category: UnitType) => (
    <TouchableOpacity
      key={category}
      style={styles.unitCard}
      onPress={() => {
        setSelectedCategory(category);
        setSelectedUnitId(null);
      }}
    >
      <View style={styles.unitHeader}>
        <View style={styles.unitInfo}>
          <Text style={styles.unitIcon}>{getUnitTypeIcon(category)}</Text>
          <View style={styles.unitDetails}>
            <Text style={styles.unitNumber}>{category.replace('_', ' ').toUpperCase()}</Text>
            <Text style={styles.unitType}>
              {category.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={[styles.unitStatus, { backgroundColor: colors.lightGray }]}>
          <Text style={styles.unitStatusText}>Category</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getFloorCategories = (floorId: string) => {
    const floor = floors.find(f => f.id === floorId);
    if (!floor) return [];

    const categories: UnitType[] = [];
    units.forEach(unit => {
      if (unit.floorId === floorId && !categories.includes(unit.unitType)) {
        categories.push(unit.unitType);
      }
    });
    return categories;
  };

  const selectedFloor = floors.find(f => f.id === selectedFloorId) || null;
  const selectedUnit = units.find(u => u.id === selectedUnitId) || null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (selectedUnitId) {
              setSelectedUnitId(null);
              setSelectedCategory(null);
              return;
            }
            if (selectedCategory) {
              setSelectedCategory(null);
              return;
            }
            if (selectedFloorId) {
              setSelectedFloorId(null);
              return;
            }
            navigation.goBack();
          }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {!selectedFloorId && !selectedUnitId && 'Floors'}
          {selectedFloorId && !selectedCategory && !selectedUnitId && selectedFloor?.floorName}
          {selectedFloorId && selectedCategory && !selectedUnitId && `${selectedCategory.replace('_', ' ').toUpperCase()} - ${selectedFloor?.floorName}`}
          {selectedUnitId && `Unit ${selectedUnit?.unitNumber}`}
        </Text>
        <View style={{ width: 90 }} />
      </View>

      {/* Content spacer */}
      <View style={styles.summaryContainer} />

      {/* List area */}
      <ScrollView
        style={styles.unitsList}
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
        {!selectedFloorId && !selectedUnitId && (
          <View style={styles.floorSection}>
            {floors.map(renderFloorCard)}
          </View>
        )}

        {selectedFloorId && !selectedCategory && !selectedUnitId && (
          <View style={styles.floorSection}>
            {getFloorCategories(selectedFloorId).map(renderCategoryCard)}
            {getFloorCategories(selectedFloorId).length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No categories on this floor</Text>
                <Text style={styles.emptyStateSubtext}>Add categories from setup to manage here</Text>
              </View>
            )}
          </View>
        )}

        {selectedFloorId && selectedCategory && !selectedUnitId && (
          <View style={styles.floorSection}>
            {units.filter(u => u.floorId === selectedFloorId && u.unitType === selectedCategory).map(renderUnitCard)}
            {units.filter(u => u.floorId === selectedFloorId && u.unitType === selectedCategory).length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No {selectedCategory.replace('_', ' ')} units on this floor</Text>
                <Text style={styles.emptyStateSubtext}>Add units from setup to manage here</Text>
              </View>
            )}
          </View>
        )}

        {selectedUnitId && (
          <View style={styles.unitCard}>
            <Text style={styles.tenantsTitle}>Tenants</Text>
            {selectedUnit?.currentTenants?.length ? (
              selectedUnit.currentTenants.map(t => (
                <View key={t.id} style={styles.tenantItem}>
                  <Text style={styles.tenantName}>👤 {t.name}</Text>
                  <Text style={styles.tenantContact}>{t.phone}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyStateSubtext}>No tenants assigned</Text>
            )}

            {selectedUnit?.isOccupied && (
              <TouchableOpacity
                style={[styles.actionButton, styles.vacateButton, { marginTop: 12 }]}
                onPress={() => handleVacateUnit(selectedUnit.id)}
              >
                <Text style={styles.actionButtonText}>Vacate Unit</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
      {/* No modals in simplified drill-down UI */}
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  filterToggle: {
    backgroundColor: colors.white,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  filterToggleText: {
    color: colors.textSecondary,
    fontSize: fonts.sm,
    fontWeight: '500',
  },

  filtersContainer: {
    marginTop: dimensions.spacing.sm,
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
  summaryContainer: {
    paddingHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatNumber: {
    fontSize: fonts.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryStatLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  unitsList: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },

  floorSection: {
    marginBottom: dimensions.spacing.lg,
  },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.sm,
  },
  floorTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  floorStats: {
    alignItems: 'flex-end',
  },
  floorStatText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  unitCard: {
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
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  unitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unitIcon: {
    fontSize: 24,
    marginRight: dimensions.spacing.sm,
  },
  unitDetails: {
    flex: 1,
  },
  unitNumber: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  unitType: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  unitStatus: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  unitStatusText: {
    color: colors.white,
    fontSize: fonts.xs,
    fontWeight: '500',
  },
  unitStats: {
    marginBottom: dimensions.spacing.md,
  },
  statText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  amenitiesContainer: {
    marginBottom: dimensions.spacing.md,
  },
  amenitiesTitle: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityChip: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
    fontSize: fonts.xs,
    color: colors.textSecondary,
    marginRight: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.xs,
  },
  tenantsContainer: {
    marginBottom: dimensions.spacing.md,
  },
  tenantsTitle: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  tenantItem: {
    marginBottom: dimensions.spacing.xs,
  },
  tenantName: {
    fontSize: fonts.sm,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  tenantContact: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  unitActions: {
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
  addFirstUnitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  addFirstUnitButtonText: {
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.lg,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.md,
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
  tenantsList: {
    maxHeight: 200,
    marginBottom: dimensions.spacing.lg,
  },
  tenantOption: {
    backgroundColor: colors.backgroundLight,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.sm,
    marginBottom: dimensions.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tenantOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  tenantOptionName: {
    fontSize: fonts.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tenantOptionContact: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
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

