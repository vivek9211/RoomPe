import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { Property, PropertyType } from '../../types/property.types';
import { firestoreService } from '../../services/firestore';

interface EditPropertyScreenProps {
  navigation: any;
  route: any;
}

const EditPropertyScreen: React.FC<EditPropertyScreenProps> = ({ navigation, route }) => {
  const { property } = route.params || {};
  const [formData, setFormData] = useState<Partial<Property>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || '',
        type: property.type || PropertyType.PG,
        location: {
          address: property.location?.address || '',
          city: property.location?.city || '',
          state: property.location?.state || '',
          postalCode: property.location?.postalCode || '',
          country: property.location?.country || 'India',
        },
        totalRooms: property.totalRooms || 1,
        pricing: {
          baseRent: property.pricing?.baseRent || 0,
          deposit: property.pricing?.deposit || 0,
          currency: property.pricing?.currency || 'INR',
        },
      });
    }
  }, [property]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Property] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSave = async () => {
    if (!property?.id) {
      Alert.alert('Error', 'Property ID not found');
      return;
    }

    setLoading(true);
    try {
      await firestoreService.updateProperty(property.id, formData);
      Alert.alert('Success', 'Property updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error updating property:', error);
      Alert.alert('Error', 'Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    field: string,
    placeholder: string,
    keyboardType: 'default' | 'numeric' = 'default',
    multiline: boolean = false
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={String(formData[field as keyof Property] || '')}
        onChangeText={(text) => handleInputChange(field, text)}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  const renderLocationInput = (
    label: string,
    field: string,
    placeholder: string
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={formData.location?.[field as keyof typeof formData.location]?.toString() || ''}
        onChangeText={(text) => handleInputChange(`location.${field}`, text)}
      />
    </View>
  );

  const renderPricingInput = (
    label: string,
    field: string,
    placeholder: string
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={formData.pricing?.[field as keyof typeof formData.pricing]?.toString() || ''}
        onChangeText={(text) => handleInputChange(`pricing.${field}`, text)}
        keyboardType="numeric"
      />
    </View>
  );

  if (!property) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Property Not Found</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.saveButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
                 <ScrollView 
           style={styles.scrollView}
           contentContainerStyle={styles.content} 
           showsVerticalScrollIndicator={false}
         >
          <Text style={styles.title}>Edit Property</Text>
          
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            {renderInput('Property Name', 'name', 'Enter property name')}
            {renderInput('Total Rooms', 'totalRooms', '1', 'numeric')}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            {renderLocationInput('Address', 'address', 'Enter full address')}
            {renderLocationInput('City', 'city', 'Enter city name')}
            {renderLocationInput('State', 'state', 'Enter state name')}
            {renderLocationInput('Postal Code', 'postalCode', 'Enter postal code')}
            {renderLocationInput('Country', 'country', 'Enter country name')}
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            {renderPricingInput('Base Rent (₹)', 'baseRent', '0')}
            {renderPricingInput('Security Deposit (₹)', 'deposit', '0')}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: dimensions.spacing.xl,
    paddingTop: dimensions.spacing.xl,
    paddingBottom: dimensions.spacing.xl,
  },
  title: {
    fontSize: fonts.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xl,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
  saveButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.7,
  },
  inputGroup: {
    marginBottom: dimensions.spacing.md,
    width: '100%',
  },
  inputLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.sm,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    fontSize: fonts.md,
    color: colors.textPrimary,
    borderWidth: 1,
         borderColor: colors.lightGray,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  section: {
    width: '100%',
    marginBottom: dimensions.spacing.xl,
    paddingBottom: dimensions.spacing.md,
    borderBottomWidth: 1,
         borderBottomColor: colors.lightGray,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});

export default EditPropertyScreen;
