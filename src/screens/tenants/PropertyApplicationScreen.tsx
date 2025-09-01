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
  StatusBar,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestore';
import { Property } from '../../types/property.types';
import { TenantApplicationStatus } from '../../types/tenant.types';
import firestore from '@react-native-firebase/firestore';

interface PropertyApplicationScreenProps {
  navigation: any;
  route?: any;
}

const PropertyApplicationScreen: React.FC<PropertyApplicationScreenProps> = ({ navigation, route }) => {
  const { userProfile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [message, setMessage] = useState('');
  const [requestedRent, setRequestedRent] = useState('');

  useEffect(() => {
    loadAvailableProperties();
  }, []);

  const loadAvailableProperties = async () => {
    try {
      setLoading(true);
      // Use the firestoreService method that handles filtering properly
      const propertiesData = await firestoreService.getActivePropertiesForTenants();
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error loading properties:', error);
      Alert.alert('Error', 'Failed to load available properties');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToProperty = async (property: Property) => {
    if (!userProfile?.uid) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    setSelectedProperty(property);
  };

  const submitApplication = async () => {
    if (!selectedProperty || !userProfile?.uid) {
      Alert.alert('Error', 'Please select a property');
      return;
    }

    try {
      setApplying(true);

      const applicationData = {
        tenantId: userProfile.uid,
        propertyId: selectedProperty.id,
        ownerId: selectedProperty.ownerId,
        message: message.trim() || undefined,
        requestedRent: requestedRent ? parseFloat(requestedRent) : undefined,
        requestedMoveInDate: firestore.Timestamp.now(), // Default to current date
      };

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
              navigation.goBack();
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

  const renderPropertyItem = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => handleApplyToProperty(item)}
    >
      <View style={styles.propertyHeader}>
        <Text style={styles.propertyName}>{item.name}</Text>
        <Text style={styles.propertyType}>{item.type.toUpperCase()}</Text>
      </View>
      
      <View style={styles.propertyDetails}>
        <Text style={styles.propertyLocation}>
          📍 {item.location.address}, {item.location.city}
        </Text>
        <Text style={styles.propertyRooms}>
          🏠 {item.availableRooms} of {item.totalRooms} rooms available
        </Text>
        <Text style={styles.propertyRent}>
          💰 Rent: ₹{item.pricing?.baseRent || 'N/A'} / month
        </Text>
      </View>

      <TouchableOpacity
        style={styles.applyButton}
        onPress={() => handleApplyToProperty(item)}
      >
        <Text style={styles.applyButtonText}>Apply Now</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderApplicationModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Apply to Property</Text>
        <Text style={styles.modalSubtitle}>{selectedProperty?.name}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Message (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell the owner why you're interested in this property..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Requested Rent (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your preferred rent amount"
            placeholderTextColor={colors.textMuted}
            value={requestedRent}
            onChangeText={setRequestedRent}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setSelectedProperty(null);
              setMessage('');
              setRequestedRent('');
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, applying && styles.submitButtonDisabled]}
            onPress={submitApplication}
            disabled={applying}
          >
            {applying ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Application</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>Find Properties</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading available properties...</Text>
        </View>
      ) : (
        <>
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Available Properties</Text>
            <Text style={styles.sectionSubtitle}>
              Browse and apply to properties that match your requirements
            </Text>
          </View>

          <FlatList
            data={properties}
            renderItem={renderPropertyItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🏠</Text>
                <Text style={styles.emptyTitle}>No Properties Available</Text>
                <Text style={styles.emptySubtitle}>
                  There are currently no properties with available rooms.
                </Text>
              </View>
            }
          />
        </>
      )}

      {selectedProperty && renderApplicationModal()}
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
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  content: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.xl,
  },
  propertyCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
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
  propertyDetails: {
    marginBottom: dimensions.spacing.lg,
  },
  propertyLocation: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  propertyRooms: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  propertyRent: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  applyButton: {
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    paddingVertical: dimensions.spacing.md,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
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
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  emptySubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    margin: dimensions.spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  modalSubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.lg,
  },
  inputGroup: {
    marginBottom: dimensions.spacing.lg,
  },
  inputLabel: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  input: {
    backgroundColor: colors.lightGray,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
  textArea: {
    backgroundColor: colors.lightGray,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    fontSize: fonts.md,
    color: colors.textPrimary,
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: dimensions.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: dimensions.borderRadius.md,
    paddingVertical: dimensions.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: fonts.md,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    paddingVertical: dimensions.spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.lightGray,
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
  },
});

export default PropertyApplicationScreen;
