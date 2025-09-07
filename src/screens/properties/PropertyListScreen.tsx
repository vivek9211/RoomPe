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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { Property } from '../../types/property.types';
import { firestoreService } from '../../services/firestore';

interface PropertyListScreenProps {
  navigation: any;
}

const PropertyListScreen: React.FC<PropertyListScreenProps> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Load properties and set up real-time listener
  useEffect(() => {
    if (userProfile?.uid) {
      loadProperties();
      
      // Set up real-time listener for properties
      const unsubscribe = firestoreService.onPropertiesByOwnerChange(
        userProfile.uid,
        (firebaseProperties) => {
          // Convert Firebase data to Property objects
          const properties: Property[] = firebaseProperties.map((firebaseProperty: any) => ({
            id: firebaseProperty.id,
            name: firebaseProperty.name,
            ownerId: firebaseProperty.ownerId,
            ownerName: firebaseProperty.ownerName,
            ownerPhone: firebaseProperty.ownerPhone,
            type: firebaseProperty.type,
            status: firebaseProperty.status,
            location: firebaseProperty.location,
            totalRooms: firebaseProperty.totalRooms,
            availableRooms: firebaseProperty.availableRooms,
            createdAt: firebaseProperty.createdAt,
            updatedAt: firebaseProperty.updatedAt,
            pricing: firebaseProperty.pricing,
            contactInfo: firebaseProperty.contactInfo,
          }));
          
          setProperties(properties);
          console.log('Properties updated in real-time:', properties);
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
    } catch (error) {
      console.error('Error loading properties:', error);
      Alert.alert('Error', 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadProperties();
  };

  const handlePropertyPress = (property: Property) => {
    navigation.navigate('PropertyDetail', { property });
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

  const handleDeleteProperty = (property: Property) => {
    Alert.alert(
      'Delete Property',
      `Are you sure you want to delete "${property.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement delete property functionality
              Alert.alert('Success', 'Property deleted successfully');
              loadProperties();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete property');
            }
          },
        },
      ]
    );
  };

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.location?.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPropertyCard = (property: Property) => (
    <View key={property.id} style={styles.propertyCard}>
      <View style={styles.propertyHeader}>
        <Text style={styles.propertyName}>{property.name}</Text>
        <View style={[styles.statusTag, { backgroundColor: property.status === 'active' ? colors.success : colors.warning }]}>
          <Text style={styles.statusText}>{property.status}</Text>
        </View>
      </View>
      
      <Text style={styles.propertyAddress}>
        📍 {property.location?.address || 'Address not available'}
      </Text>
      
      <View style={styles.propertyStats}>
        <Text style={styles.statText}>
          🏠 {property.totalRooms || 0} Total Rooms
        </Text>
        <Text style={styles.statText}>
          ✅ {property.availableRooms || 0} Available
        </Text>
      </View>
      
      <View style={styles.propertyActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handlePropertyPress(property)}
        >
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => handleRoomMapping(property)}
        >
          <Text style={styles.primaryButtonText}>Room Mapping</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.managementButton]}
          onPress={() => navigation.navigate('RoomManagement', { property })}
        >
          <Text style={styles.managementButtonText}>Room Management</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditProperty(property)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => navigation.navigate('PaymentKyc', { property })}
        >
          <Text style={styles.primaryButtonText}>Payment KYC</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  statusText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
  propertyAddress: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.sm,
  },
  propertyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.md,
  },
  statText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  propertyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: dimensions.spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.sm,
    paddingHorizontal: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  editButton: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  managementButton: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
  editButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
  managementButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xl,
  },
  loadingText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
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
  addFirstPropertyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
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
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default PropertyListScreen;
