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
            Rooms/Beds: <Text style={styles.metricValue}>{property.totalRooms}/{property.totalRooms}</Text>
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricIcon}>👥</Text>
          <Text style={styles.metricText}>
            Tenants: <Text style={styles.metricValue}>{property.totalRooms - property.availableRooms}</Text>
          </Text>
        </View>
      </View>
      
      {/* Property Actions */}
      <View style={styles.propertyActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleEditProperty(property)}
        >
          <Text style={styles.actionButtonText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteProperty(property)}
        >
          <Text style={styles.actionButtonText}>🗑️ Delete</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Switch Property</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Property"
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
    backgroundColor: colors.success,
  },
  selectedStatusText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '500',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: dimensions.spacing.md,
    paddingTop: dimensions.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: dimensions.spacing.sm,
    paddingHorizontal: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.sm,
    marginHorizontal: dimensions.spacing.xs,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
});

export default PropertySelectionScreen; 