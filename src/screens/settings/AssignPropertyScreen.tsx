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
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';
import { Button, Input } from '../../components/common';
import firestoreService from '../../services/firestore';
import { PropertyType } from '../../types/property.types';

interface AssignPropertyScreenProps {
  navigation: any;
}

interface Property {
  id: string;
  name: string;
  type: string;
  location: {
    address: string;
    city: string;
    postalCode: string;
  };
  pricing: {
    baseRent: number;
    deposit: number;
  };
  availableRooms: number;
  totalRooms: number;
  amenities?: any;
  description?: string;
}

const AssignPropertyScreen: React.FC<AssignPropertyScreenProps> = ({ navigation }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [cityFilter, setCityFilter] = useState('');
  const [postalCodeFilter, setPostalCodeFilter] = useState('');
  const [minRentFilter, setMinRentFilter] = useState('');
  const [maxRentFilter, setMaxRentFilter] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string[]>([]);
  const [amenitiesFilter, setAmenitiesFilter] = useState<string[]>([]);

  // Available options
  const propertyTypes = [
    { key: 'pg', label: 'PG' },
    { key: 'flat', label: 'Flat' },
    { key: 'apartment', label: 'Apartment' },
    { key: 'house', label: 'House' },
    { key: 'villa', label: 'Villa' },
    { key: 'studio', label: 'Studio' },
  ];

  const availableAmenities = [
    { key: 'wifi', label: 'WiFi' },
    { key: 'ac', label: 'AC' },
    { key: 'food', label: 'Food' },
    { key: 'laundry', label: 'Laundry' },
    { key: 'parking', label: 'Parking' },
    { key: 'security', label: 'Security' },
    { key: 'gym', label: 'Gym' },
    { key: 'pool', label: 'Pool' },
  ];

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, cityFilter, postalCodeFilter, minRentFilter, maxRentFilter, propertyTypeFilter, amenitiesFilter]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const filters = {
        city: cityFilter || undefined,
        postalCode: postalCodeFilter || undefined,
        minRent: minRentFilter ? parseInt(minRentFilter) : undefined,
        maxRent: maxRentFilter ? parseInt(maxRentFilter) : undefined,
        propertyType: propertyTypeFilter.length > 0 ? propertyTypeFilter : undefined,
        amenities: amenitiesFilter.length > 0 ? amenitiesFilter : undefined,
      };

      const fetchedProperties = await firestoreService.getActivePropertiesForTenants(filters);
      setProperties(fetchedProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
      Alert.alert('Error', 'Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // Apply city filter
    if (cityFilter) {
      filtered = filtered.filter(property => 
        property.location.city.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    // Apply postal code filter
    if (postalCodeFilter) {
      filtered = filtered.filter(property => 
        property.location.postalCode.includes(postalCodeFilter)
      );
    }

    // Apply rent range filters
    if (minRentFilter) {
      const minRent = parseInt(minRentFilter);
      filtered = filtered.filter(property => 
        property.pricing.baseRent >= minRent
      );
    }

    if (maxRentFilter) {
      const maxRent = parseInt(maxRentFilter);
      filtered = filtered.filter(property => 
        property.pricing.baseRent <= maxRent
      );
    }

    // Apply property type filter
    if (propertyTypeFilter.length > 0) {
      filtered = filtered.filter(property => 
        propertyTypeFilter.includes(property.type)
      );
    }

    // Apply amenities filter
    if (amenitiesFilter.length > 0) {
      filtered = filtered.filter(property => {
        const propertyAmenities = property.amenities || {};
        return amenitiesFilter.every(amenity => 
          propertyAmenities[amenity] === true
        );
      });
    }

    setFilteredProperties(filtered);
  };

  const handlePropertyTypeToggle = (type: string) => {
    setPropertyTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleAmenityToggle = (amenity: string) => {
    setAmenitiesFilter(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleApplyFilters = () => {
    loadProperties();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setCityFilter('');
    setPostalCodeFilter('');
    setMinRentFilter('');
    setMaxRentFilter('');
    setPropertyTypeFilter([]);
    setAmenitiesFilter([]);
  };

  const handlePropertyPress = (property: Property) => {
    Alert.alert(
      'Apply for Property',
      `Would you like to apply for ${property.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: () => {
            // Navigate to property application screen
            navigation.navigate('PropertyApplication', { propertyId: property.id });
          }
        }
      ]
    );
  };

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <TouchableOpacity 
      style={styles.propertyCard} 
      onPress={() => handlePropertyPress(item)}
    >
      <View style={styles.propertyHeader}>
        <Text style={styles.propertyName}>{item.name}</Text>
        <Text style={styles.propertyType}>{item.type.toUpperCase()}</Text>
      </View>
      
      <Text style={styles.propertyLocation}>
        📍 {item.location.address}, {item.location.city} - {item.location.postalCode}
      </Text>
      
      <View style={styles.propertyDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Rent:</Text>
          <Text style={styles.detailValue}>₹{item.pricing.baseRent}/month</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Deposit:</Text>
          <Text style={styles.detailValue}>₹{item.pricing.deposit}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Available:</Text>
          <Text style={styles.detailValue}>{item.availableRooms}/{item.totalRooms} rooms</Text>
        </View>
      </View>

      {item.amenities && (
        <View style={styles.amenitiesContainer}>
          <Text style={styles.amenitiesLabel}>Amenities:</Text>
          <View style={styles.amenitiesList}>
            {Object.entries(item.amenities).slice(0, 4).map(([key, value]) => 
              value === true && (
                <Text key={key} style={styles.amenityTag}>{key}</Text>
              )
            )}
            {Object.values(item.amenities).filter(v => v === true).length > 4 && (
              <Text style={styles.amenityTag}>+{Object.values(item.amenities).filter(v => v === true).length - 4} more</Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterSection = () => (
    <View style={styles.filterSection}>
      <View style={styles.filterRow}>
        <Input
          label="City"
          placeholder="Enter city name"
          value={cityFilter}
          onChangeText={setCityFilter}
          style={styles.filterInput}
        />
        <Input
          label="Postal Code"
          placeholder="Enter pincode"
          value={postalCodeFilter}
          onChangeText={setPostalCodeFilter}
          keyboardType="numeric"
          style={styles.filterInput}
        />
      </View>

      <View style={styles.filterRow}>
        <Input
          label="Min Rent"
          placeholder="Min amount"
          value={minRentFilter}
          onChangeText={setMinRentFilter}
          keyboardType="numeric"
          style={styles.filterInput}
        />
        <Input
          label="Max Rent"
          placeholder="Max amount"
          value={maxRentFilter}
          onChangeText={setMaxRentFilter}
          keyboardType="numeric"
          style={styles.filterInput}
        />
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupTitle}>Property Type</Text>
        <View style={styles.filterTags}>
          {propertyTypes.map(type => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.filterTag,
                propertyTypeFilter.includes(type.key) && styles.filterTagActive
              ]}
              onPress={() => handlePropertyTypeToggle(type.key)}
            >
              <Text style={[
                styles.filterTagText,
                propertyTypeFilter.includes(type.key) && styles.filterTagTextActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupTitle}>Amenities</Text>
        <View style={styles.filterTags}>
          {availableAmenities.map(amenity => (
            <TouchableOpacity
              key={amenity.key}
              style={[
                styles.filterTag,
                amenitiesFilter.includes(amenity.key) && styles.filterTagActive
              ]}
              onPress={() => handleAmenityToggle(amenity.key)}
            >
              <Text style={[
                styles.filterTagText,
                amenitiesFilter.includes(amenity.key) && styles.filterTagTextActive
              ]}>
                {amenity.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterActions}>
        <Button
          title="Clear Filters"
          onPress={handleClearFilters}
          variant="secondary"
          style={styles.filterButton}
        />
        <Button
          title="Apply Filters"
          onPress={handleApplyFilters}
          variant="primary"
          style={styles.filterButton}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Property</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
          <Text style={styles.filterButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filters */}
        {showFilters && renderFilterSection()}

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Available Properties ({filteredProperties.length})
          </Text>
          {loading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {/* Properties List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading properties...</Text>
          </View>
        ) : filteredProperties.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>No properties found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your filters or check back later for new listings.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProperties}
            renderItem={renderPropertyItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    paddingTop: dimensions.spacing.md,
    paddingBottom: dimensions.spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    padding: dimensions.spacing.sm,
  },
  backButtonText: {
    fontSize: fonts.xl,
    color: colors.textPrimary,
  },
  headerTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterButton: {
    padding: dimensions.spacing.sm,
  },
  filterButtonText: {
    fontSize: fonts.lg,
  },
  content: {
    flex: 1,
  },
  filterSection: {
    backgroundColor: colors.white,
    padding: dimensions.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: dimensions.spacing.md,
  },
  filterInput: {
    flex: 1,
    marginRight: dimensions.spacing.sm,
  },
  filterGroup: {
    marginBottom: dimensions.spacing.lg,
  },
  filterGroupTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  filterTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterTag: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginRight: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.sm,
  },
  filterTagActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTagText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  filterTagTextActive: {
    color: colors.white,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.white,
  },
  resultsTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xxxl,
  },
  loadingText: {
    marginTop: dimensions.spacing.md,
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xxxl,
  },
  emptyIcon: {
    fontSize: fonts.xxxl,
    marginBottom: dimensions.spacing.md,
  },
  emptyTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  emptySubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: dimensions.spacing.xl,
  },
  propertyCard: {
    backgroundColor: colors.white,
    marginHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
    padding: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
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
  propertyType: {
    fontSize: fonts.sm,
    fontWeight: '500',
    color: colors.primary,
    backgroundColor: colors.lightPrimary,
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  propertyLocation: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.md,
  },
  propertyDetails: {
    marginBottom: dimensions.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.xs,
  },
  detailLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fonts.sm,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  amenitiesContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: dimensions.spacing.md,
  },
  amenitiesLabel: {
    fontSize: fonts.sm,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityTag: {
    fontSize: fonts.xs,
    color: colors.primary,
    backgroundColor: colors.lightPrimary,
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
    marginRight: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.xs,
  },
});

export default AssignPropertyScreen;
