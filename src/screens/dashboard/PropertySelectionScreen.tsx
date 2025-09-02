import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useProperty } from '../../contexts/PropertyContext';
import { Property } from '../../types/property.types';
import { firestoreService } from '../../services/firestore';

interface PropertySelectionScreenProps {
  navigation: any;
}

const PropertySelectionScreen: React.FC<PropertySelectionScreenProps> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const { setSelectedProperty, selectedProperty, clearSelectedProperty } = useProperty();
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomMappings, setRoomMappings] = useState<{[key: string]: any}>({});

  // Load properties and set up real-time listener
  useEffect(() => {
    if (userProfile?.uid) {
      loadProperties();
      
      // Set up real-time listener for properties
      const unsubscribe = firestoreService.onPropertiesByOwnerChange(
        userProfile.uid,
        async (firebaseProperties) => {
          // Convert Firebase data to Property objects
          const properties: Property[] = firebaseProperties.map((firebaseProperty: any) => ({
            id: firebaseProperty.id,
            name: firebaseProperty.name,
            ownerId: firebaseProperty.ownerId,
            type: firebaseProperty.type,
            status: firebaseProperty.status,
            location: firebaseProperty.location,
            totalRooms: firebaseProperty.totalRooms,
            availableRooms: firebaseProperty.availableRooms,
            createdAt: firebaseProperty.createdAt,
            updatedAt: firebaseProperty.updatedAt,
            pricing: firebaseProperty.pricing,
          }));
          
          setProperties(properties);
          console.log('Properties updated in real-time:', properties);
          
          // Load room mappings for updated properties
          await loadRoomMappings(properties);
        }
      );
      
      // Cleanup listener on unmount
      return () => unsubscribe();
    }
  }, [userProfile?.uid]);

  const loadProperties = async () => {
    if (!userProfile?.uid) {
      console.log('No user profile, skipping property load');
      return;
    }

    setLoading(true);
    try {
      // Load properties from Firebase for the current user
      const firebaseProperties = await firestoreService.getPropertiesByOwner(userProfile.uid);
      
      // Convert Firebase data to Property objects
      const properties: Property[] = firebaseProperties.map((firebaseProperty: any) => ({
        id: firebaseProperty.id,
        name: firebaseProperty.name,
        ownerId: firebaseProperty.ownerId,
        type: firebaseProperty.type,
        status: firebaseProperty.status,
        location: firebaseProperty.location,
        totalRooms: firebaseProperty.totalRooms,
        availableRooms: firebaseProperty.availableRooms,
        createdAt: firebaseProperty.createdAt,
        updatedAt: firebaseProperty.updatedAt,
        pricing: firebaseProperty.pricing,
      }));
      
      setProperties(properties);
      console.log('Properties loaded from Firebase:', properties);
      
      // Load room mappings for all properties
      await loadRoomMappings(properties);
    } catch (error) {
      console.error('Error loading properties:', error);
      Alert.alert('Error', 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const loadRoomMappings = async (properties: Property[]) => {
    try {
      const mappings: {[key: string]: any} = {};
      
      // Load room mapping for each property
      for (const property of properties) {
        try {
          const roomMapping = await firestoreService.getRoomMapping(property.id);
          if (roomMapping) {
            mappings[property.id] = roomMapping;
          }
        } catch (error) {
          console.error(`Error loading room mapping for property ${property.id}:`, error);
          // Continue with other properties even if one fails
        }
      }
      
      setRoomMappings(mappings);
      console.log('Room mappings loaded:', mappings);
    } catch (error) {
      console.error('Error loading room mappings:', error);
    }
  };

  const handlePropertySelect = (property: Property) => {
    // Set the selected property in context and go back to the previous screen
    setSelectedProperty(property);
    navigation.goBack();
  };

  const handleAddProperty = () => {
    navigation.navigate('AddProperty');
  };

  const handleEditProperty = (property: Property) => {
    navigation.navigate('EditProperty', { property });
  };

  const handleRoomMapping = (property: Property) => {
    navigation.navigate('RoomMapping', { property });
  };

  const handleViewDetails = (property: Property) => {
    navigation.navigate('PropertyDetail', { property });
  };

  const handleRoomManagement = (property: Property) => {
    navigation.navigate('RoomManagement', { property });
  };

  const handleDeleteProperty = (property: Property) => {
    Alert.alert(
      'Delete Property',
      `Are you sure you want to delete "${property.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestoreService.deleteProperty(property.id);
              // Properties will be updated automatically via the real-time listener
              Alert.alert('Success', 'Property deleted successfully');
            } catch (error) {
              console.error('Error deleting property:', error);
              Alert.alert('Error', 'Failed to delete property');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    loadProperties();
  };

  const getRoomBedCounts = (property: Property) => {
    const roomMapping = roomMappings[property.id];
    
    if (!roomMapping || !roomMapping.floorConfigs) {
      // No room mapping exists, show default values
      return {
        totalRooms: 0,
        totalBeds: 0,
        occupiedRooms: 0,
        occupiedBeds: 0
      };
    }

    let totalRooms = 0;
    let totalBeds = 0;
    let occupiedRooms = 0;
    let occupiedBeds = 0;

    // Calculate totals from floor configurations
    roomMapping.floorConfigs.forEach((floorConfig: any) => {
      // Count rooms from roomConfigs (sharing types like single, double, triple, etc.)
      Object.entries(floorConfig.roomConfigs || {}).forEach(([sharingType, count]: [string, any]) => {
        const roomCount = count || 0;
        totalRooms += roomCount;
        
        // Calculate beds based on sharing type
        switch (sharingType) {
          case 'single':
            totalBeds += roomCount * 1;
            break;
          case 'double':
            totalBeds += roomCount * 2;
            break;
          case 'triple':
            totalBeds += roomCount * 3;
            break;
          case 'four_sharing':
            totalBeds += roomCount * 4;
            break;
          case 'five_sharing':
            totalBeds += roomCount * 5;
            break;
          case 'six_sharing':
            totalBeds += roomCount * 6;
            break;
          case 'seven_sharing':
            totalBeds += roomCount * 7;
            break;
          case 'eight_sharing':
            totalBeds += roomCount * 8;
            break;
          case 'nine_sharing':
            totalBeds += roomCount * 9;
            break;
          default:
            totalBeds += roomCount * 1; // Default to 1 bed per room
        }
      });

      // Count units from unitConfigs (rooms, RK, BHK, studio apartments, etc.)
      Object.entries(floorConfig.unitConfigs || {}).forEach(([unitType, count]: [string, any]) => {
        const unitCount = count || 0;
        totalRooms += unitCount; // Each unit counts as 1 room regardless of type
        
        // Calculate beds based on unit type
        switch (unitType) {
          case 'room':
            totalBeds += unitCount * 1; // Default 1 bed per room
            break;
          case 'rk':
            totalBeds += unitCount * 1; // RK typically has 1 bed
            break;
          case 'bhk_1':
            totalBeds += unitCount * 1; // 1 BHK counts as 1 unit, 1 bed
            break;
          case 'bhk_2':
            totalBeds += unitCount * 1; // 2 BHK counts as 1 unit, 1 bed
            break;
          case 'bhk_3':
            totalBeds += unitCount * 1; // 3 BHK counts as 1 unit, 1 bed
            break;
          case 'bhk_4':
            totalBeds += unitCount * 1; // 4 BHK counts as 1 unit, 1 bed
            break;
          case 'bhk_5':
            totalBeds += unitCount * 1; // 5 BHK counts as 1 unit, 1 bed
            break;
          case 'bhk_6':
            totalBeds += unitCount * 1; // 6 BHK counts as 1 unit, 1 bed
            break;
          case 'studio_apartment':
            totalBeds += unitCount * 1; // Studio has 1 bed area
            break;
          default:
            totalBeds += unitCount * 1; // Default to 1 bed per unit
        }
      });
    });

    // For now, we'll use the property's availableRooms to calculate occupied
    // This could be enhanced to get actual occupancy from room mapping data
    occupiedRooms = (property.totalRooms || 0) - (property.availableRooms || 0);
    occupiedBeds = Math.min(occupiedRooms, totalBeds); // Don't exceed total beds

    return {
      totalRooms,
      totalBeds,
      occupiedRooms,
      occupiedBeds
    };
  };

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPropertyCard = (property: Property) => (
    <TouchableOpacity
      key={property.id}
      style={styles.propertyCard}
      onPress={() => handlePropertySelect(property)}
    >
      <View style={styles.propertyHeader}>
        <Text style={styles.propertyName}>{property.name}</Text>
        <View style={[
          styles.statusTag,
          selectedProperty?.id === property.id && styles.selectedStatusTag
        ]}>
          <Text style={[
            styles.statusText,
            selectedProperty?.id === property.id && styles.selectedStatusText
          ]}>
            {selectedProperty?.id === property.id ? 'Selected' : 'Select'}
          </Text>
        </View>
      </View>
      
      <View style={styles.propertyAddress}>
        <Text style={styles.propertyAddressText}>
          📍 {property.location?.address || 'Address not available'}
        </Text>
      </View>
      
      <View style={styles.propertyMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricIcon}>🛏️</Text>
          <Text style={styles.metricText}>
            {(() => {
              const counts = getRoomBedCounts(property);
              if (counts.totalRooms === 0 && counts.totalBeds === 0) {
                return 'Rooms 0/0 Beds 0/0';
              } else {
                return `Rooms ${counts.occupiedRooms}/${counts.totalRooms} Beds ${counts.occupiedBeds}/${counts.totalBeds}`;
              }
            })()}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricIcon}>👥</Text>
          <Text style={styles.metricText}>
            Tenants: <Text style={styles.metricValue}>
              {(() => {
                const totalRooms = property.totalRooms || 0;
                const availableRooms = property.availableRooms || 0;
                const tenantCount = totalRooms - availableRooms;
                return isNaN(tenantCount) ? 0 : Math.max(0, tenantCount);
              })()}
            </Text>
          </Text>
        </View>
      </View>
      
             {/* Property Actions */}
       <View style={styles.propertyActions}>
         <View style={styles.actionRow}>
           <TouchableOpacity 
             style={styles.actionButton}
             onPress={() => handleViewDetails(property)}
           >
             <Text style={styles.actionButtonText}>View Details</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={styles.actionButton}
             onPress={() => handleEditProperty(property)}
           >
             <Text style={styles.actionButtonText}>Edit</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={styles.actionButton}
             onPress={() => handleRoomMapping(property)}
           >
             <Text style={styles.actionButtonText}>Floors</Text>
           </TouchableOpacity>
         </View>
         <View style={styles.actionRow}>
           <TouchableOpacity 
             style={styles.actionButton}
             onPress={() => handleRoomManagement(property)}
           >
             <Text style={styles.actionButtonText}>Room Management</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.actionButton, styles.deleteButton]}
             onPress={() => handleDeleteProperty(property)}
           >
             <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
           </TouchableOpacity>
         </View>
       </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
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
        <Text style={styles.headerTitle}>Properties</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Properties List */}
      <ScrollView 
        style={styles.propertiesList} 
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
        {filteredProperties.map(renderPropertyCard)}
        
        {loading && (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading properties...</Text>
          </View>
        )}
        
        {!loading && filteredProperties.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No properties found' : 'Welcome! No properties yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Add your first property to start managing your rental business'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.addFirstPropertyButton}
                onPress={handleAddProperty}
              >
                <Text style={styles.addFirstPropertyButtonText}>Add Your First Property</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddProperty}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
  propertiesList: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  propertyCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  propertyName: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  statusTag: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  statusText: {
    color: colors.primary,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  propertyAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  propertyAddressText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    flex: 1,
  },
  propertyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 16,
    marginRight: dimensions.spacing.xs,
  },
  metricText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  metricValue: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xxxl,
  },
  emptyStateText: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: fonts.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  addFirstPropertyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginTop: dimensions.spacing.md,
  },
  addFirstPropertyButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: dimensions.spacing.xl,
    right: dimensions.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  selectedStatusTag: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  selectedStatusText: {
    color: colors.success,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xxxl,
  },
  loadingText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  propertyActions: {
    marginTop: dimensions.spacing.lg,
    paddingTop: dimensions.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: dimensions.spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: dimensions.spacing.sm,
    paddingHorizontal: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 40,
    marginHorizontal: dimensions.spacing.xs,
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontSize: fonts.sm,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteButtonText: {
    color: '#DC2626',
  },
});

export default PropertySelectionScreen; 