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
  Modal,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';
import { Button, Input } from '../../components/common';
import firestoreService from '../../services/firestore';
import { PropertyType, Property } from '../../types/property.types';
import { useAuth } from '../../contexts/AuthContext';
import firestore from '@react-native-firebase/firestore';

interface AssignPropertyScreenProps {
  navigation: any;
}



const AssignPropertyScreen: React.FC<AssignPropertyScreenProps> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Application states
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [message, setMessage] = useState('');
  const [requestedRent, setRequestedRent] = useState('');
  const [applying, setApplying] = useState(false);
  
  // Filter states
  const [propertyNameFilter, setPropertyNameFilter] = useState('');
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
  }, [properties, propertyNameFilter, cityFilter, postalCodeFilter, minRentFilter, maxRentFilter, propertyTypeFilter, amenitiesFilter]);

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

    // Apply property name filter
    if (propertyNameFilter) {
      filtered = filtered.filter(property => 
        property.name.toLowerCase().includes(propertyNameFilter.toLowerCase())
      );
    }

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

  const submitApplication = async () => {
    if (!selectedProperty || !userProfile?.uid) {
      Alert.alert('Error', 'Please select a property');
      return;
    }

    // Validate property has required fields
    if (!selectedProperty.id || !selectedProperty.ownerId) {
      console.error('Property missing required fields:', selectedProperty);
      Alert.alert('Error', 'Property data is incomplete. Please try again.');
      return;
    }

    try {
      setApplying(true);

      const applicationData = {
        tenantId: userProfile.uid,
        propertyId: selectedProperty.id,
        ownerId: selectedProperty.ownerId,
        message: message.trim() || null,
        requestedRent: requestedRent ? parseFloat(requestedRent) : null,
        requestedMoveInDate: firestore.Timestamp.now(), // Default to current date
      };

      console.log('Submitting application with data:', applicationData);

      await firestoreService.createTenantApplication(applicationData);

      Alert.alert(
        'Application Submitted',
        'Your application has been submitted successfully. The property owner will review it and get back to you.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedProperty(null);
              setMessage('');
              setRequestedRent('');
              setShowApplicationModal(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
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
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setPropertyNameFilter('');
    setCityFilter('');
    setPostalCodeFilter('');
    setMinRentFilter('');
    setMaxRentFilter('');
    setPropertyTypeFilter([]);
    setAmenitiesFilter([]);
    setShowFilterModal(false);
  };

  const handlePropertyPress = (property: Property) => {
    setSelectedProperty(property);
    setShowApplicationModal(true);
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
          label="Property Name"
          placeholder="Enter property name"
          value={propertyNameFilter}
          onChangeText={setPropertyNameFilter}
          style={styles.filterInput}
        />
      </View>
      
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
         <TouchableOpacity
           style={styles.cancelFilterButton}
           onPress={() => setShowFilterModal(false)}
         >
           <Text style={styles.cancelFilterButtonText}>Cancel</Text>
         </TouchableOpacity>
         <TouchableOpacity
           style={styles.clearFilterButton}
           onPress={handleClearFilters}
         >
           <Text style={styles.clearFilterButtonText}>Clear</Text>
         </TouchableOpacity>
         <TouchableOpacity
           style={styles.applyFilterButton}
           onPress={handleApplyFilters}
         >
           <Text style={styles.applyFilterButtonText}>Apply</Text>
         </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Find Properties</Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.filterButton}>
          <Text style={styles.filterButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Available Properties ({filteredProperties.length})
          </Text>
          <Text style={styles.resultsSubtitle}>
            Browse and apply to properties that match your requirements
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

      {/* Application Modal */}
      <Modal
        visible={showApplicationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApplicationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply for Property</Text>
              <TouchableOpacity 
                onPress={() => setShowApplicationModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedProperty && (
              <>
                <View style={styles.propertySummary}>
                  <Text style={styles.propertySummaryTitle}>{selectedProperty.name}</Text>
                  <Text style={styles.propertySummaryType}>{selectedProperty.type.toUpperCase()}</Text>
                  <Text style={styles.propertySummaryLocation}>
                    📍 {selectedProperty.location.address}, {selectedProperty.location.city}
                  </Text>
                  <Text style={styles.propertySummaryRent}>
                    Rent: ₹{selectedProperty.pricing.baseRent}/month
                  </Text>
                </View>

                <View style={styles.formSection}>
                  <Input
                    label="Message to Owner (Optional)"
                    placeholder="Tell the owner why you're interested in this property..."
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={3}
                    style={styles.messageInput}
                  />

                  <Input
                    label="Requested Rent (Optional)"
                    placeholder="Enter your preferred rent amount"
                    value={requestedRent}
                    onChangeText={setRequestedRent}
                    keyboardType="numeric"
                    style={styles.rentInput}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowApplicationModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.applyButton, applying && styles.applyButtonDisabled]}
                    onPress={submitApplication}
                    disabled={applying}
                  >
                    {applying ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.applyButtonText}>Submit Application</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Properties</Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalBody} showsVerticalScrollIndicator={false}>
              {renderFilterSection()}
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
    backgroundColor: 'transparent',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: dimensions.spacing.md,
    gap: dimensions.spacing.sm,
  },
  filterInput: {
    flex: 1,
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
    gap: dimensions.spacing.sm,
  },
  filterTag: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
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
    gap: dimensions.spacing.sm,
    marginTop: dimensions.spacing.lg,
  },
  cancelFilterButton: {
    flex: 1,
    backgroundColor: colors.lightGray,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },
  cancelFilterButtonText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  clearFilterButton: {
    flex: 1,
    backgroundColor: colors.lightGray,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },
  clearFilterButtonText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  applyFilterButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  applyFilterButtonText: {
    fontSize: fonts.md,
    color: colors.white,
    fontWeight: '600',
  },
  resultsHeader: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.white,
  },
  resultsTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  resultsSubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.md,
    lineHeight: 20,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    width: '90%',
    maxHeight: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  modalTitle: {
    fontSize: fonts.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: dimensions.spacing.sm,
  },
  closeButtonText: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
  },
  propertySummary: {
    backgroundColor: colors.lightGray,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.lg,
  },
  propertySummaryTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  propertySummaryType: {
    fontSize: fonts.sm,
    color: colors.primary,
    backgroundColor: colors.lightPrimary,
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: dimensions.spacing.xs,
  },
  propertySummaryLocation: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  propertySummaryRent: {
    fontSize: fonts.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  formSection: {
    marginBottom: dimensions.spacing.lg,
  },
  messageInput: {
    marginBottom: dimensions.spacing.md,
  },
  rentInput: {
    marginBottom: dimensions.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: dimensions.spacing.md,
    marginTop: dimensions.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    fontSize: fonts.md,
    color: colors.white,
    fontWeight: '600',
  },
  // Filter Modal styles
  filterModalContent: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: 0,
    width: '95%',
    maxHeight: '90%',
    maxWidth: 450,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  filterModalTitle: {
    fontSize: fonts.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterModalBody: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
  },
});

export default AssignPropertyScreen;
