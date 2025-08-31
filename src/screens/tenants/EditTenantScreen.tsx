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
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { Tenant, TenantStatus, UpdateTenantData } from '../../types/tenant.types';
import { useTenants } from '../../hooks/useTenants';
import { useAuth } from '../../contexts/AuthContext';
import firestore from '@react-native-firebase/firestore';

interface EditTenantScreenProps {
  navigation: any;
  route: any;
}

const EditTenantScreen: React.FC<EditTenantScreenProps> = ({ navigation, route }) => {
  const { tenantId } = route.params || {};
  const { getTenantById, updateTenant, loading, error, clearError } = useTenants();
  const { user } = useAuth();
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<Partial<UpdateTenantData>>({});
  const [agreementStart, setAgreementStart] = useState<Date | null>(null);
  const [agreementEnd, setAgreementEnd] = useState<Date | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (tenantId) {
        loadTenantDetails();
      }
    }, [tenantId])
  );

  const loadTenantDetails = async () => {
    try {
      await getTenantById(tenantId);
      // TODO: Set form data from tenant
    } catch (error) {
      console.error('Error loading tenant details:', error);
    }
  };

  const handleInputChange = (field: keyof UpdateTenantData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (formData.rent !== undefined && formData.rent <= 0) {
      Alert.alert('Error', 'Please enter a valid rent amount');
      return false;
    }
    if (formData.deposit !== undefined && formData.deposit <= 0) {
      Alert.alert('Error', 'Please enter a valid deposit amount');
      return false;
    }
    if (agreementStart && agreementEnd && agreementStart >= agreementEnd) {
      Alert.alert('Error', 'Agreement end date must be after start date');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const updateData: UpdateTenantData = { ...formData };
      
      if (agreementStart) {
        updateData.agreementStart = firestore.Timestamp.fromDate(agreementStart);
      }
      if (agreementEnd) {
        updateData.agreementEnd = firestore.Timestamp.fromDate(agreementEnd);
      }

      await updateTenant(tenantId, updateData);
      Alert.alert('Success', 'Tenant updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update tenant');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  if (loading && !tenant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tenant details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!tenant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Tenant Not Found</Text>
          <Text style={styles.errorSubtitle}>The tenant you're looking for doesn't exist or has been deleted.</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Edit Tenant</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Information Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tenant ID:</Text>
              <Text style={styles.infoValue}>#{tenant.userId.slice(-6)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Property ID:</Text>
              <Text style={styles.infoValue}>#{tenant.propertyId.slice(-6)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Room ID:</Text>
              <Text style={styles.infoValue}>#{tenant.roomId.slice(-6)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Rent:</Text>
              <Text style={[styles.infoValue, styles.rentValue]}>{formatCurrency(tenant.rent)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Deposit:</Text>
              <Text style={styles.infoValue}>{formatCurrency(tenant.deposit)}</Text>
            </View>
          </View>
        </View>

        {/* Edit Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Information</Text>
          
          {/* Rent Amount */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Monthly Rent (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder={`Current: ${formatCurrency(tenant.rent)}`}
              placeholderTextColor={colors.textMuted}
              value={formData.rent?.toString() || ''}
              onChangeText={(value) => handleInputChange('rent', parseFloat(value) || 0)}
              keyboardType="numeric"
            />
          </View>

          {/* Deposit Amount */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Security Deposit (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder={`Current: ${formatCurrency(tenant.deposit)}`}
              placeholderTextColor={colors.textMuted}
              value={formData.deposit?.toString() || ''}
              onChangeText={(value) => handleInputChange('deposit', parseFloat(value) || 0)}
              keyboardType="numeric"
            />
          </View>

          {/* Agreement Dates */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Agreement Start Date</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Text style={agreementStart ? styles.dateValue : styles.datePlaceholder}>
                {agreementStart ? formatDate(agreementStart) : 'Select start date'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Agreement End Date</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Text style={agreementEnd ? styles.dateValue : styles.datePlaceholder}>
                {agreementEnd ? formatDate(agreementEnd) : 'Select end date'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Status */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Status</Text>
            <View style={styles.statusOptions}>
              {Object.values(TenantStatus).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    formData.status === status && styles.statusOptionActive
                  ]}
                  onPress={() => handleInputChange('status', status)}
                >
                  <Text style={[
                    styles.statusOptionText,
                    formData.status === status && styles.statusOptionTextActive
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add notes about this tenant..."
              placeholderTextColor={colors.textMuted}
              value={formData.notes || ''}
              onChangeText={(value) => handleInputChange('notes', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Update Tenant</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Error Message */}
      {error && (
        <View style={styles.errorMessageContainer}>
          <Text style={styles.errorMessageText}>{error}</Text>
          <TouchableOpacity style={styles.errorMessageButton} onPress={clearError}>
            <Text style={styles.errorMessageButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: dimensions.spacing.lg,
  },
  errorTitle: {
    fontSize: fonts.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  errorSubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  errorButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
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
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  section: {
    marginBottom: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  infoLabel: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: fonts.md,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  rentValue: {
    color: colors.primary,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: dimensions.spacing.lg,
  },
  formLabel: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  dateValue: {
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
  datePlaceholder: {
    fontSize: fonts.md,
    color: colors.textMuted,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dimensions.spacing.sm,
  },
  statusOption: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  statusOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusOptionText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusOptionTextActive: {
    color: colors.white,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    paddingVertical: dimensions.spacing.lg,
    alignItems: 'center',
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: colors.lightGray,
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fonts.lg,
    fontWeight: '600',
  },
  errorMessageContainer: {
    backgroundColor: colors.error,
    marginHorizontal: dimensions.spacing.lg,
    marginVertical: dimensions.spacing.md,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorMessageText: {
    color: colors.white,
    fontSize: fonts.sm,
    flex: 1,
  },
  errorMessageButton: {
    marginLeft: dimensions.spacing.md,
  },
  errorMessageButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
});

export default EditTenantScreen;
