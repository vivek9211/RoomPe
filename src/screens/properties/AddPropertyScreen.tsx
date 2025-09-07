import React, { useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useProperty } from '../../contexts/PropertyContext';
import { Property, PropertyType, PropertyStatus, CreatePropertyData } from '../../types/property.types';
import { firestoreService } from '../../services/firestore';

const AddPropertyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const { setSelectedProperty } = useProperty();
  
  const [formData, setFormData] = useState<CreatePropertyData>({
    name: '',
    ownerId: userProfile?.uid || '',
    type: PropertyType.PG,
    ownerName: '',
    ownerPhone: '',
    location: {
      address: '',
      landmark: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    },
    pricing: {
      baseRent: 0,
      deposit: 0,
      currency: 'INR',
    },
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    // For phone field, only allow numeric input
    if (field === 'ownerPhone') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [field]: numericValue,
      }));
      return;
    }

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CreatePropertyData],
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

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Property name is required');
      return false;
    }
    if (!formData.location.address.trim()) {
      Alert.alert('Error', 'Address is required');
      return false;
    }
    if (!formData.location.city.trim()) {
      Alert.alert('Error', 'City is required');
      return false;
    }
    if (!formData.location.state.trim()) {
      Alert.alert('Error', 'State is required');
      return false;
    }
         if (!formData.location.postalCode.trim()) {
       Alert.alert('Error', 'Postal code is required');
       return false;
     }
     
     if (!formData.ownerName.trim()) {
       Alert.alert('Error', 'Owner name is required');
       return false;
     }
     
     if (!formData.ownerPhone.trim()) {
       Alert.alert('Error', 'Owner phone number is required');
       return false;
     }
     
     if (formData.pricing.baseRent <= 0) {
      Alert.alert('Error', 'Base rent must be greater than 0');
      return false;
    }
    if (formData.pricing.deposit <= 0) {
      Alert.alert('Error', 'Deposit must be greater than 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create new property object for Firebase
      const propertyData = {
        ...formData,
        status: PropertyStatus.ACTIVE,
      };

      // Save property to Firebase
      const propertyId = await firestoreService.createProperty(propertyData);
      
             // Create complete property object with Firebase ID
       const newProperty: Property = {
         id: propertyId,
         ...propertyData,
         totalRooms: 0, // Will be set during room mapping
         availableRooms: 0, // Will be calculated from room mapping
         createdAt: new Date() as any,
         updatedAt: new Date() as any,
       };

      // Set as selected property
      setSelectedProperty(newProperty);
      
      Alert.alert(
        'Success! 🎉',
        `Property "${formData.name}" has been added successfully and is now available in your property list.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding property:', error);
      Alert.alert('Error', 'Failed to add property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    field: string,
    placeholder: string,
    keyboardType: 'default' | 'numeric' | 'email-address' | 'phone-pad' = 'default',
    multiline: boolean = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={field.includes('.') 
          ? formData[field.split('.')[0] as keyof CreatePropertyData]?.[field.split('.')[1] as any] || ''
          : formData[field as keyof CreatePropertyData] || ''
        }
        onChangeText={(value) => handleInputChange(field, value)}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  const renderPicker = (
    label: string,
    field: string,
    options: { label: string; value: any }[],
    currentValue: any
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.pickerContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              currentValue === option.value && styles.pickerOptionSelected,
            ]}
            onPress={() => handleInputChange(field, option.value)}
          >
            <Text
              style={[
                styles.pickerOptionText,
                currentValue === option.value && styles.pickerOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
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
        <Text style={styles.headerTitle}>Add Property</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                     {/* Basic Information */}
           <View style={styles.section}>
             <Text style={styles.sectionTitle}>Basic Information</Text>
             
             {renderInput('Property Name', 'name', 'Enter property name')}
             
             {renderPicker(
               'Property Type',
               'type',
               [
                 { label: 'PG', value: PropertyType.PG },
                 { label: 'Flat', value: PropertyType.FLAT },
                 { label: 'Apartment', value: PropertyType.APARTMENT },
                 { label: 'House', value: PropertyType.HOUSE },
                 { label: 'Villa', value: PropertyType.VILLA },
                 { label: 'Studio', value: PropertyType.STUDIO },
               ],
               formData.type
             )}
           </View>

           {/* Property Owner Details */}
           <View style={styles.section}>
             <Text style={styles.sectionTitle}>Property Owner Details</Text>
             
             {renderInput('Owner Name', 'ownerName', 'Enter owner name')}
                           {renderInput('Owner Phone', 'ownerPhone', 'Enter owner phone number', 'numeric')}
           </View>

          {/* Location Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            
            {renderInput('Address', 'location.address', 'Enter full address', 'default', true)}
            {renderInput('Landmark', 'location.landmark', 'Enter nearby landmark (optional)')}
            {renderInput('City', 'location.city', 'Enter city name')}
            {renderInput('State', 'location.state', 'Enter state name')}
            {renderInput('Postal Code', 'location.postalCode', 'Enter postal code')}
            {renderInput('Country', 'location.country', 'Enter country name')}
          </View>

          {/* Pricing Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            
            {renderInput('Base Rent (₹)', 'pricing.baseRent', '0', 'numeric')}
            {renderInput('Security Deposit (₹)', 'pricing.deposit', '0', 'numeric')}
            
            {renderPicker(
              'Currency',
              'pricing.currency',
              [
                { label: 'INR (₹)', value: 'INR' },
                { label: 'USD ($)', value: 'USD' },
                { label: 'EUR (€)', value: 'EUR' },
              ],
              formData.pricing.currency
            )}
          </View>

          

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding Property...' : 'Add Property'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: dimensions.spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  section: {
    marginBottom: dimensions.spacing.md, // Reduced from xl to md for tighter spacing
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm, // Reduced from md to sm
    marginTop: dimensions.spacing.md, // Reduced from lg to md
  },
  inputContainer: {
    marginBottom: dimensions.spacing.md,
  },
  inputLabel: {
    fontSize: fonts.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dimensions.spacing.sm,
  },
  pickerOption: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickerOptionText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: colors.white,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: dimensions.spacing.md, // Reduced from lg to md for less height
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
    marginVertical: dimensions.spacing.lg, // Reduced from xl to lg
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 }, // Reduced shadow for cleaner look
    shadowOpacity: 0.08, // Reduced shadow opacity
    shadowRadius: 3, // Reduced shadow radius
    elevation: 2, // Reduced elevation
  },
  submitButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fonts.lg,
    fontWeight: '600',
  },
  helperText: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    marginTop: dimensions.spacing.xs,
    fontStyle: 'italic',
  },
});

export default AddPropertyScreen;
