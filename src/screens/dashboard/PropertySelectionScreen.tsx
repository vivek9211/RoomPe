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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useProperty } from '../../contexts/PropertyContext';
import { Property } from '../../types/property.types';

interface PropertySelectionScreenProps {
  navigation: any;
}

const PropertySelectionScreen: React.FC<PropertySelectionScreenProps> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const { setSelectedProperty } = useProperty();
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration - replace with actual API call
  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setLoading(true);
    try {
      // Mock properties data - replace with actual API call
      const mockProperties: Property[] = [
        {
          id: '1',
          name: 'Sri Sai Balaji Mens PG',
          ownerId: userProfile?.uid || '',
          type: 'pg' as any,
          status: 'active' as any,
          location: {
            address: '123 Main Street',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560001',
            country: 'India',
          },
          totalRooms: 20,
          availableRooms: 5,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
          pricing: {
            baseRent: 8000,
            deposit: 16000,
            currency: 'INR',
          },
        },
        {
          id: '2',
          name: 'Sunshine Apartments',
          ownerId: userProfile?.uid || '',
          type: 'apartment' as any,
          status: 'active' as any,
          location: {
            address: '456 Park Avenue',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560002',
            country: 'India',
          },
          totalRooms: 15,
          availableRooms: 3,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
          pricing: {
            baseRent: 15000,
            deposit: 30000,
            currency: 'INR',
          },
        },
      ];
      setProperties(mockProperties);
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
        <View style={styles.statusTag}>
          <Text style={styles.statusText}>Current</Text>
        </View>
      </View>
      
      <View style={styles.propertyId}>
        <Text style={styles.propertyIdText}>{property.id}</Text>
        <TouchableOpacity style={styles.copyButton}>
          <Text style={styles.copyIcon}>📋</Text>
        </TouchableOpacity>
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
      <ScrollView style={styles.propertiesList} showsVerticalScrollIndicator={false}>
        {filteredProperties.map(renderPropertyCard)}
        
        {filteredProperties.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No properties found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Add your first property to get started'}
            </Text>
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
  propertyId: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  propertyIdText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginRight: dimensions.spacing.sm,
  },
  copyButton: {
    padding: dimensions.spacing.xs,
  },
  copyIcon: {
    fontSize: 16,
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
});

export default PropertySelectionScreen; 