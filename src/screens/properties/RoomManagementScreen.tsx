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
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { Tenant, TenantStatus } from '../../types/tenant.types';
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
  status: TenantStatus;
  rent: number;
  deposit: number;
  agreementStart: Date;
  agreementEnd: Date;
}

interface UnitWithDetails extends Unit {
  currentTenants: TenantDisplay[];
  amenities: string[];
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
}

interface FloorWithTenants extends Floor {
  units: UnitWithDetails[];
  tenantCount: number;
  occupancyRate: number;
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

// Helper function to determine room status based on tenant occupancy
const getRoomStatus = (tenantCount: number): 'available' | 'occupied' | 'maintenance' | 'reserved' => {
  return tenantCount > 0 ? 'occupied' : 'available';
};

const RoomManagementScreen: React.FC<RoomManagementScreenProps> = ({ navigation, route }) => {
  const { property } = route.params || {};
  const insets = useSafeAreaInsets();
  const [units, setUnits] = useState<UnitWithDetails[]>([]);
  const [rooms, setRooms] = useState<RoomWithBeds[]>([]);
  const [floors, setFloors] = useState<FloorWithTenants[]>([]);
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
          const floorsData: FloorWithTenants[] = [];
          const unitsData: UnitWithDetails[] = [];
          
          roomMapping.floorConfigs.forEach((floorConfig: any, floorIndex: number) => {
            const floorNumber = floorIndex + 1;
            const floorName = floorNumber === 1 ? 'Ground Floor' : `${floorNumber - 1}${getOrdinalSuffix(floorNumber - 1)} Floor`;
            
            // Calculate total units for this floor
            const totalUnits = Object.values(floorConfig.unitConfigs || {}).reduce((sum: number, count: any) => sum + (count || 0), 0);
            const totalRooms = Object.values(floorConfig.roomConfigs || {}).reduce((sum: number, count: any) => sum + (count || 0), 0);
            const floorTotalUnits = totalUnits + totalRooms;
            
            const floor: FloorWithTenants = {
              id: `floor${floorNumber}`,
              floorNumber,
              floorName,
              totalUnits: floorTotalUnits,
              filledUnits: 0,
              vacantUnits: floorTotalUnits,
              units: [],
              tenantCount: 0,
              occupancyRate: 0,
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
                  status: 'available', // Will be updated based on tenant occupancy
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
                  status: 'available', // Will be updated based on tenant occupancy
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
          
          // Load all tenants for this property and match with units
          const allTenants = await tenantApiService.getTenantsByProperty(property.id);
          console.log('All tenants for property (config mode):', allTenants);
          
          // Match tenants with units based on roomId
          const unitsWithTenants = await Promise.all(
            unitsData.map(async (unit) => {
              // Find tenants assigned to this unit by roomId
              const unitTenants = allTenants.filter(tenant => 
                tenant.roomId === unit.unitNumber || tenant.roomId === unit.id
              );
              
              console.log(`Unit ${unit.unitNumber} (${unit.id}) tenants:`, unitTenants);
              
              if (unitTenants.length > 0) {
                const tenantDetails = await Promise.all(
                  unitTenants.map(async (tenant) => {
                    try {
                      const user = await firestoreService.getUserProfile(tenant.userId);
                      return {
                        id: tenant.id,
                        name: user?.name || 'Unknown Tenant',
                        phone: user?.phone || 'No Phone',
                        email: user?.email || 'No Email',
                        status: tenant.status,
                        rent: tenant.rent,
                        deposit: tenant.deposit,
                        agreementStart: tenant.agreementStart?.toDate?.() || new Date(),
                        agreementEnd: tenant.agreementEnd?.toDate?.() || new Date(),
                      };
                    } catch (error) {
                      console.error('Error loading tenant details:', error);
                      return {
                        id: tenant.id,
                        name: 'Unknown Tenant',
                        phone: 'No Phone',
                        email: 'No Email',
                        status: TenantStatus.INACTIVE,
                        rent: 0,
                        deposit: 0,
                        agreementStart: new Date(),
                        agreementEnd: new Date(),
                      };
                    }
                  })
                );
                return {
                  ...unit,
                  currentTenants: tenantDetails.filter(t => t.name !== 'Unknown Tenant'),
                  status: getRoomStatus(tenantDetails.filter(t => t.name !== 'Unknown Tenant').length),
                  isOccupied: tenantDetails.filter(t => t.name !== 'Unknown Tenant').length > 0,
                };
              }
              
              return unit;
            })
          );
          
          // Update floors with tenant information
          floorsData.forEach(floor => {
            let totalTenants = 0;
            let occupiedUnits = 0;
            
            floor.units.forEach(unit => {
              const unitWithTenants = unitsWithTenants.find(u => u.id === unit.id);
              if (unitWithTenants) {
                unit.currentTenants = unitWithTenants.currentTenants;
                unit.status = unitWithTenants.status;
                unit.isOccupied = unitWithTenants.isOccupied;
                totalTenants += unitWithTenants.currentTenants.length;
                if (unitWithTenants.currentTenants.length > 0) {
                  occupiedUnits++;
                }
              }
            });
            
            floor.tenantCount = totalTenants;
            floor.filledUnits = occupiedUnits;
            floor.vacantUnits = floor.totalUnits - occupiedUnits;
            floor.occupancyRate = floor.totalUnits > 0 ? (occupiedUnits / floor.totalUnits) * 100 : 0;
          });
          
          setUnits(unitsWithTenants);
          setFloors(floorsData);
          
        } else if (roomMapping.floors && Array.isArray(roomMapping.floors)) {
          // This is actual unit data
          const floorsData: FloorWithTenants[] = [];
          const unitsData: UnitWithDetails[] = [];
          
          // Process each floor and its units
          roomMapping.floors.forEach((floor: any) => {
            const floorWithTenants: FloorWithTenants = {
              ...floor,
              tenantCount: 0,
              occupancyRate: 0,
              units: [],
            };
            
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
                floorWithTenants.units.push(unitWithDetails);
              });
            }
            
            floorsData.push(floorWithTenants);
          });
          
          // Load all tenants for this property
          const allTenants = await tenantApiService.getTenantsByProperty(property.id);
          console.log('All tenants for property:', allTenants);
          
          // Load tenant details for occupied units
          const unitsWithTenants = await Promise.all(
            unitsData.map(async (unit) => {
              // Find tenants assigned to this unit by roomId
              const unitTenants = allTenants.filter(tenant => 
                tenant.roomId === unit.unitNumber || tenant.roomId === unit.id
              );
              
              console.log(`Unit ${unit.unitNumber} (${unit.id}) tenants:`, unitTenants);
              
              if (unitTenants.length > 0) {
                const tenantDetails = await Promise.all(
                  unitTenants.map(async (tenant) => {
                    try {
                      const user = await firestoreService.getUserProfile(tenant.userId);
                      return {
                        id: tenant.id,
                        name: user?.name || 'Unknown Tenant',
                        phone: user?.phone || 'No Phone',
                        email: user?.email || 'No Email',
                        status: tenant.status,
                        rent: tenant.rent,
                        deposit: tenant.deposit,
                        agreementStart: tenant.agreementStart?.toDate?.() || new Date(),
                        agreementEnd: tenant.agreementEnd?.toDate?.() || new Date(),
                      };
                    } catch (error) {
                      console.error('Error loading tenant details:', error);
                      return {
                        id: tenant.id,
                        name: 'Unknown Tenant',
                        phone: 'No Phone',
                        email: 'No Email',
                        status: TenantStatus.INACTIVE,
                        rent: 0,
                        deposit: 0,
                        agreementStart: new Date(),
                        agreementEnd: new Date(),
                      };
                    }
                  })
                );
                return {
                  ...unit,
                  currentTenants: tenantDetails.filter(t => t.name !== 'Unknown Tenant'),
                  status: getRoomStatus(tenantDetails.filter(t => t.name !== 'Unknown Tenant').length),
                  isOccupied: tenantDetails.filter(t => t.name !== 'Unknown Tenant').length > 0,
                };
              }
              
              // Also check for legacy tenantIds approach
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
                          status: tenant.status,
                          rent: tenant.rent,
                          deposit: tenant.deposit,
                          agreementStart: tenant.agreementStart?.toDate?.() || new Date(),
                          agreementEnd: tenant.agreementEnd?.toDate?.() || new Date(),
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
                      status: TenantStatus.INACTIVE,
                      rent: 0,
                      deposit: 0,
                      agreementStart: new Date(),
                      agreementEnd: new Date(),
                    };
                  })
                );
                return {
                  ...unit,
                  currentTenants: tenantDetails.filter(t => t.name !== 'Unknown Tenant'),
                  status: getRoomStatus(tenantDetails.filter(t => t.name !== 'Unknown Tenant').length),
                  isOccupied: tenantDetails.filter(t => t.name !== 'Unknown Tenant').length > 0,
                };
              }
              
              return unit;
            })
          );
          
          // Update floors with tenant information
          floorsData.forEach(floor => {
            let totalTenants = 0;
            let occupiedUnits = 0;
            
            floor.units.forEach(unit => {
              const unitWithTenants = unitsWithTenants.find(u => u.id === unit.id);
              if (unitWithTenants) {
                unit.currentTenants = unitWithTenants.currentTenants;
                unit.status = unitWithTenants.status;
                unit.isOccupied = unitWithTenants.isOccupied;
                totalTenants += unitWithTenants.currentTenants.length;
                if (unitWithTenants.currentTenants.length > 0) {
                  occupiedUnits++;
                }
              }
            });
            
            floor.tenantCount = totalTenants;
            floor.filledUnits = occupiedUnits;
            floor.vacantUnits = floor.totalUnits - occupiedUnits;
            floor.occupancyRate = floor.totalUnits > 0 ? (occupiedUnits / floor.totalUnits) * 100 : 0;
          });
          
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

  const handleRefresh = () => {
    loadPropertyData();
  };

  const debugShowAllTenants = async () => {
    try {
      const allTenants = await tenantApiService.getTenantsByProperty(property.id);
      console.log('=== ALL TENANTS DEBUG ===');
      console.log('Total tenants:', allTenants.length);
      allTenants.forEach((tenant, index) => {
        console.log(`Tenant ${index + 1}:`, {
          id: tenant.id,
          roomId: tenant.roomId,
          propertyId: tenant.propertyId,
          status: tenant.status,
          rent: tenant.rent,
          deposit: tenant.deposit,
          userId: tenant.userId
        });
      });
      console.log('=== END DEBUG ===');
      
      // Check if there are any pending tenants
      const pendingTenants = allTenants.filter(tenant => tenant.status === 'pending');
      
      if (pendingTenants.length > 0) {
        Alert.alert(
          'Debug Info', 
          `Found ${allTenants.length} tenants. ${pendingTenants.length} are pending. Would you like to activate them?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Activate Pending', 
              onPress: () => activatePendingTenants(pendingTenants)
            }
          ]
        );
      } else {
        Alert.alert(
          'Debug Info', 
          `Found ${allTenants.length} tenants. All are active. Check console for details.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error fetching tenants for debug:', error);
      Alert.alert('Error', 'Failed to fetch tenant data');
    }
  };

  const activatePendingTenants = async (pendingTenants: any[]) => {
    try {
      setLoading(true);
      let activatedCount = 0;
      
      for (const tenant of pendingTenants) {
        try {
          await tenantApiService.activateTenant(tenant.id);
          activatedCount++;
          console.log(`Activated tenant ${tenant.id} (Room ${tenant.roomId})`);
        } catch (error) {
          console.error(`Failed to activate tenant ${tenant.id}:`, error);
        }
      }
      
      Alert.alert(
        'Success', 
        `Activated ${activatedCount} out of ${pendingTenants.length} pending tenants.`,
        [{ text: 'OK', onPress: () => loadPropertyData() }]
      );
    } catch (error) {
      console.error('Error activating tenants:', error);
      Alert.alert('Error', 'Failed to activate some tenants');
    } finally {
      setLoading(false);
    }
  };

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

  const getTenantStatusColor = (status: TenantStatus) => {
    switch (status) {
      case TenantStatus.ACTIVE: return colors.success;
      case TenantStatus.PENDING: return colors.warning;
      case TenantStatus.INACTIVE: return colors.gray;
      case TenantStatus.LEFT: return colors.error;
      case TenantStatus.SUSPENDED: return colors.warning;
      case TenantStatus.EVICTED: return colors.error;
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

  const renderFloorCard = (floor: FloorWithTenants) => (
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
      
      <View style={styles.floorTenantInfo}>
        <Text style={styles.tenantCountText}>
          👥 Total Tenants: {floor.tenantCount}
        </Text>
        <Text style={styles.occupancyRateText}>
          📊 Occupancy Rate: {Math.round(floor.occupancyRate)}%
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTenantCard = (tenant: TenantDisplay) => (
    <View style={styles.tenantCard}>
      <View style={styles.tenantHeader}>
        <Text style={styles.tenantName}>{tenant.name}</Text>
        <View style={[styles.tenantStatus, { backgroundColor: getTenantStatusColor(tenant.status) }]}>
          <Text style={styles.tenantStatusText}>{tenant.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.tenantDetails}>
        <Text style={styles.tenantDetailText}>📞 {tenant.phone}</Text>
        <Text style={styles.tenantDetailText}>📧 {tenant.email}</Text>
        <Text style={styles.tenantDetailText}>💰 Rent: ₹{tenant.rent}/month</Text>
        <Text style={styles.tenantDetailText}>💳 Deposit: ₹{tenant.deposit}</Text>
        <Text style={styles.tenantDetailText}>
          📅 Agreement: {tenant.agreementStart.toLocaleDateString()} - {tenant.agreementEnd.toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const renderUnitWithTenants = (unit: UnitWithDetails) => (
    <View style={styles.unitWithTenantsCard}>
      <TouchableOpacity 
        style={styles.unitHeader} 
        onPress={() => setSelectedUnitId(unit.id)}
      >
        <View style={styles.unitInfo}>
          <Text style={styles.unitIcon}>{getUnitTypeIcon(unit.unitType)}</Text>
          <View style={styles.unitDetails}>
            <Text style={styles.unitNumber}>Room {unit.unitNumber}</Text>
            <Text style={styles.unitType}>
              {unit.unitType.replace('_', ' ').toUpperCase()}
              {unit.sharingType && ` - ${unit.sharingType.replace('_', ' ').toUpperCase()}`}
            </Text>
          </View>
        </View>
        <View style={[styles.unitStatus, { backgroundColor: getStatusColor(unit.status) }]}>
          <Text style={styles.unitStatusText}>{unit.status.toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.unitStats}>
        <Text style={styles.statText}>
          👥 Capacity: {unit.capacity} | Occupied: {unit.currentTenants.length}
        </Text>
        <Text style={styles.statText}>
          💰 Rent: ₹{unit.rent}/month | Deposit: ₹{unit.deposit}
        </Text>
      </View>

      {/* Only show tenant details when this specific unit is selected */}
      {selectedUnitId === unit.id && (
        <>
          {unit.currentTenants.length > 0 && (
            <View style={styles.tenantsSection}>
              <Text style={styles.tenantsSectionTitle}>Current Tenants ({unit.currentTenants.length})</Text>
              {unit.currentTenants.map((tenant, index) => (
                <View key={tenant.id || `tenant-${index}`} style={styles.tenantItem}>
                  {renderTenantCard(tenant)}
                </View>
              ))}
            </View>
          )}

          {unit.currentTenants.length === 0 && (
            <View style={styles.emptyTenantsSection}>
              <Text style={styles.emptyTenantsText}>No tenants assigned to this room</Text>
              <TouchableOpacity 
                style={styles.assignTenantButton}
                onPress={() => navigation.navigate('AddTenant', { property, roomId: unit.id })}
              >
                <Text style={styles.assignTenantButtonText}>Assign Tenant</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
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
      <View style={[styles.header, { paddingTop: insets.top }]}>
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
          {!selectedFloorId && !selectedUnitId && 'Room Management'}
          {selectedFloorId && !selectedCategory && !selectedUnitId && selectedFloor?.floorName}
          {selectedFloorId && selectedCategory && !selectedUnitId && `${selectedCategory.replace('_', ' ').toUpperCase()} - ${selectedFloor?.floorName}`}
          {selectedUnitId && `Room ${selectedUnit?.unitNumber}`}
        </Text>
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={debugShowAllTenants}
        >
          <Text style={styles.debugButtonText}>Debug</Text>
        </TouchableOpacity>
             </View>

       {/* Content */}
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
            <>
              <View style={styles.floorSection}>
                <Text style={styles.sectionTitle}>Floors Overview</Text>
                {floors.map((floor, index) => (
                  <View key={floor.id || `floor-${index}`}>
                    {renderFloorCard(floor)}
                  </View>
                ))}
              </View>
            </>
          )}
         
         {selectedFloorId && !selectedCategory && !selectedUnitId && (
           <View style={styles.categorySection}>
             <Text style={styles.sectionTitle}>Room Categories - {selectedFloor?.floorName}</Text>
             {getFloorCategories(selectedFloorId).map((category, index) => (
               <View key={category || `category-${index}`}>
                 {renderCategoryCard(category)}
               </View>
             ))}
           </View>
         )}
         
         {selectedFloorId && selectedCategory && !selectedUnitId && (
           <View style={styles.unitsSection}>
             <Text style={styles.sectionTitle}>
               {selectedCategory.replace('_', ' ').toUpperCase()} Rooms - {selectedFloor?.floorName}
             </Text>
             {units
               .filter(unit => unit.floorId === selectedFloorId && unit.unitType === selectedCategory)
               .map((unit, index) => (
                 <View key={unit.id || `unit-${index}`}>
                   {renderUnitWithTenants(unit)}
                 </View>
               ))}
           </View>
         )}
         
         {selectedUnitId && (
           <View style={styles.unitDetailSection}>
             <Text style={styles.sectionTitle}>Room Details - {selectedUnit?.unitNumber}</Text>
             {selectedUnit && (
               <View style={styles.unitWithTenantsCard}>
                 <View style={styles.unitHeader}>
                   <View style={styles.unitInfo}>
                     <Text style={styles.unitIcon}>{getUnitTypeIcon(selectedUnit.unitType)}</Text>
                     <View style={styles.unitDetails}>
                       <Text style={styles.unitNumber}>Room {selectedUnit.unitNumber}</Text>
                       <Text style={styles.unitType}>
                         {selectedUnit.unitType.replace('_', ' ').toUpperCase()}
                         {selectedUnit.sharingType && ` - ${selectedUnit.sharingType.replace('_', ' ').toUpperCase()}`}
                       </Text>
                     </View>
                   </View>
                   <View style={[styles.unitStatus, { backgroundColor: getStatusColor(selectedUnit.status) }]}>
                     <Text style={styles.unitStatusText}>{selectedUnit.status.toUpperCase()}</Text>
                   </View>
                 </View>
                 
                 <View style={styles.unitStats}>
                   <Text style={styles.statText}>
                     👥 Capacity: {selectedUnit.capacity} | Occupied: {selectedUnit.currentTenants.length}
                   </Text>
                   <Text style={styles.statText}>
                     💰 Rent: ₹{selectedUnit.rent}/month | Deposit: ₹{selectedUnit.deposit}
                   </Text>
                 </View>

                 {selectedUnit.currentTenants.length > 0 && (
                   <View style={styles.tenantsSection}>
                     <Text style={styles.tenantsSectionTitle}>Current Tenants ({selectedUnit.currentTenants.length})</Text>
                     {selectedUnit.currentTenants.map((tenant, index) => (
                       <View key={tenant.id || `tenant-${index}`} style={styles.tenantItem}>
                         {renderTenantCard(tenant)}
                       </View>
                     ))}
                   </View>
                 )}

                 {selectedUnit.currentTenants.length === 0 && (
                   <View style={styles.emptyTenantsSection}>
                     <Text style={styles.emptyTenantsText}>No tenants assigned to this room</Text>
                     <TouchableOpacity 
                       style={styles.assignTenantButton}
                       onPress={() => navigation.navigate('AddTenant', { property, roomId: selectedUnit.id })}
                     >
                       <Text style={styles.assignTenantButtonText}>Assign Tenant</Text>
                     </TouchableOpacity>
                   </View>
                 )}
               </View>
             )}
           </View>
         )}

         {units.length === 0 && !loading && (
           <View style={styles.emptyState}>
             <Text style={styles.emptyStateText}>No rooms configured yet</Text>
             <Text style={styles.emptyStateSubtext}>
               Set up your room mapping to start managing tenants
             </Text>
             <TouchableOpacity
               style={styles.addFirstUnitButton}
               onPress={() => navigation.navigate('RoomMapping', { property })}
             >
               <Text style={styles.addFirstUnitButtonText}>Configure Rooms</Text>
             </TouchableOpacity>
           </View>
         )}
       </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.spacing.md,
  },
  backIcon: {
    fontSize: fonts.xl,
    color: colors.textPrimary,
  },
     headerTitle: {
     flex: 1,
     fontSize: fonts.lg,
     fontWeight: '600',
     color: colors.textPrimary,
     textAlign: 'center',
   },
   unitsList: {
     flex: 1,
     paddingHorizontal: dimensions.spacing.lg,
   },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
    marginTop: dimensions.spacing.lg,
  },
  floorSection: {
    marginBottom: dimensions.spacing.lg,
  },
  categorySection: {
    marginBottom: dimensions.spacing.lg,
  },
  unitsSection: {
    marginBottom: dimensions.spacing.lg,
  },
  unitDetailSection: {
    marginBottom: dimensions.spacing.lg,
  },
  listViewSection: {
    marginBottom: dimensions.spacing.lg,
  },
  unitCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    marginBottom: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
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
  floorTenantInfo: {
    marginTop: dimensions.spacing.sm,
    paddingTop: dimensions.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  tenantCountText: {
    fontSize: fonts.sm,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  occupancyRateText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  unitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unitIcon: {
    fontSize: fonts.xl,
    marginRight: dimensions.spacing.sm,
  },
  unitDetails: {
    flex: 1,
  },
  unitNumber: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  unitType: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  unitStatus: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  unitStatusText: {
    fontSize: fonts.xs,
    fontWeight: '500',
    color: colors.white,
  },
  unitStats: {
    marginTop: dimensions.spacing.sm,
  },
  statText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  tenantCard: {
    backgroundColor: colors.backgroundLight,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.sm,
    marginBottom: dimensions.spacing.sm,
  },
  tenantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  tenantName: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  tenantStatus: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  tenantStatusText: {
    fontSize: fonts.xs,
    fontWeight: '500',
    color: colors.white,
  },
  tenantDetails: {
    gap: dimensions.spacing.xs,
  },
  tenantDetailText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  unitWithTenantsCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
    marginBottom: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tenantsSection: {
    marginTop: dimensions.spacing.md,
    paddingTop: dimensions.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  tenantsSectionTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  tenantItem: {
    marginBottom: dimensions.spacing.sm,
  },
  emptyTenantsSection: {
    marginTop: dimensions.spacing.md,
    paddingTop: dimensions.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    alignItems: 'center',
  },
  emptyTenantsText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.md,
    textAlign: 'center',
  },
  assignTenantButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.sm,
  },
  assignTenantButtonText: {
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
   debugButton: {
     backgroundColor: colors.warning,
     paddingHorizontal: dimensions.spacing.sm,
     paddingVertical: dimensions.spacing.xs,
     borderRadius: dimensions.borderRadius.sm,
   },
   debugButtonText: {
     color: colors.white,
     fontSize: fonts.xs,
     fontWeight: '500',
   },
 });

export default RoomManagementScreen;

