import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Input, Button, Toggle } from '../../../components/common';
import { colors, fonts, dimensions } from '../../../constants';
import { TenantOnboardingData, PropertyType } from '../../../types/onboarding.types';

interface TenantSpecificStepProps {
  data: TenantOnboardingData;
  onComplete: (data: TenantOnboardingData) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const TenantSpecificStep: React.FC<TenantSpecificStepProps> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const [formData, setFormData] = useState<TenantOnboardingData>({
    preferredPropertyTypes: data.preferredPropertyTypes || [PropertyType.FLAT],
    preferredLocations: data.preferredLocations || [],
    budgetRange: data.budgetRange || { min: 0, max: 0, currency: 'INR' },
    moveInDate: data.moveInDate,
    leaseDuration: data.leaseDuration || 12,
    smoking: data.smoking || false,
    pets: data.pets || false,
    cooking: data.cooking || true,
    visitors: data.visitors || true,
    specialRequirements: data.specialRequirements || [],
    documents: data.documents || {},
  });

  const [errors, setErrors] = useState<Partial<TenantOnboardingData>>({});

  useEffect(() => {
    if (data.preferredPropertyTypes) {
      setFormData(prev => ({ ...prev, ...data }));
    }
  }, [data]);

  const validateForm = (): boolean => {
    const newErrors: Partial<TenantOnboardingData> = {};

    if (formData.preferredPropertyTypes.length === 0) {
      newErrors.preferredPropertyTypes = 'Please select at least one property type';
    }

    if (formData.preferredLocations.length === 0) {
      newErrors.preferredLocations = 'Please select at least one location';
    }

    if (formData.budgetRange.max <= formData.budgetRange.min) {
      newErrors.budgetRange = 'Maximum budget must be greater than minimum budget';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onComplete(formData);
      onNext();
    }
  };

  const updateField = (field: keyof TenantOnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const togglePropertyType = (type: PropertyType) => {
    const currentTypes = formData.preferredPropertyTypes;
    if (currentTypes.includes(type)) {
      updateField('preferredPropertyTypes', currentTypes.filter(t => t !== type));
    } else {
      updateField('preferredPropertyTypes', [...currentTypes, type]);
    }
  };

  const addLocation = (location: string) => {
    if (location.trim() && !formData.preferredLocations.includes(location.trim())) {
      updateField('preferredLocations', [...formData.preferredLocations, location.trim()]);
    }
  };

  const removeLocation = (location: string) => {
    updateField('preferredLocations', formData.preferredLocations.filter(l => l !== location));
  };

  const propertyTypeLabels = {
    [PropertyType.PG]: 'PG/Hostel',
    [PropertyType.FLAT]: 'Flat',
    [PropertyType.APARTMENT]: 'Apartment',
    [PropertyType.HOUSE]: 'House',
    [PropertyType.VILLA]: 'Villa',
    [PropertyType.STUDIO]: 'Studio',
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Property Preferences</Text>
      
      <Text style={styles.fieldLabel}>Preferred Property Types</Text>
      <View style={styles.propertyTypesContainer}>
        {Object.values(PropertyType).map((type) => (
          <Button
            key={type}
            title={propertyTypeLabels[type]}
            onPress={() => togglePropertyType(type)}
            variant={formData.preferredPropertyTypes.includes(type) ? 'primary' : 'outline'}
            size="small"
            style={styles.propertyTypeButton}
          />
        ))}
      </View>
      {errors.preferredPropertyTypes && (
        <Text style={styles.errorText}>{errors.preferredPropertyTypes}</Text>
      )}

      <Text style={styles.fieldLabel}>Preferred Locations</Text>
      <Input
        placeholder="Add a city (e.g., Bangalore, Mumbai)"
        value=""
        onChangeText={(text) => {
          if (text.endsWith(',')) {
            addLocation(text.slice(0, -1));
          }
        }}
        onSubmitEditing={(e) => addLocation(e.nativeEvent.text)}
        style={styles.input}
      />
      
      <View style={styles.locationsContainer}>
        {formData.preferredLocations.map((location, index) => (
          <View key={index} style={styles.locationTag}>
            <Text style={styles.locationText}>{location}</Text>
            <Button
              title="×"
              onPress={() => removeLocation(location)}
              variant="outline"
              size="small"
              style={styles.removeLocationButton}
            />
          </View>
        ))}
      </View>
      {errors.preferredLocations && (
        <Text style={styles.errorText}>{errors.preferredLocations}</Text>
      )}

      <Text style={styles.fieldLabel}>Budget Range (Monthly Rent)</Text>
      <View style={styles.budgetContainer}>
        <Input
          label="Minimum"
          placeholder="0"
          value={formData.budgetRange.min.toString()}
          onChangeText={(text) => {
            const numValue = parseInt(text) || 0;
            updateField('budgetRange', { ...formData.budgetRange, min: numValue });
          }}
          keyboardType="numeric"
          style={styles.budgetInput}
        />
        <Input
          label="Maximum"
          placeholder="50000"
          value={formData.budgetRange.max.toString()}
          onChangeText={(text) => {
            const numValue = parseInt(text) || 0;
            updateField('budgetRange', { ...formData.budgetRange, max: numValue });
          }}
          keyboardType="numeric"
          style={styles.budgetInput}
        />
      </View>
      {errors.budgetRange && (
        <Text style={styles.errorText}>{errors.budgetRange}</Text>
      )}

      <Text style={styles.sectionTitle}>Lifestyle Preferences</Text>
      
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Smoking Allowed</Text>
        <Toggle
          value={formData.smoking}
          onValueChange={(value) => updateField('smoking', value)}
          leftLabel="No"
          rightLabel="Yes"
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Pets Allowed</Text>
        <Toggle
          value={formData.pets}
          onValueChange={(value) => updateField('pets', value)}
          leftLabel="No"
          rightLabel="Yes"
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Cooking Allowed</Text>
        <Toggle
          value={formData.cooking}
          onValueChange={(value) => updateField('cooking', value)}
          leftLabel="No"
          rightLabel="Yes"
        />
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Visitors Allowed</Text>
        <Toggle
          value={formData.visitors}
          onValueChange={(value) => updateField('visitors', value)}
          leftLabel="No"
          rightLabel="Yes"
        />
      </View>

      <Text style={styles.sectionTitle}>Additional Details</Text>
      
      <Input
        label="Lease Duration (months)"
        placeholder="12"
        value={formData.leaseDuration?.toString() || ''}
        onChangeText={(text) => {
          const numValue = parseInt(text) || 12;
          updateField('leaseDuration', numValue);
        }}
        keyboardType="numeric"
        style={styles.input}
      />

      <Input
        label="Special Requirements"
        placeholder="Any specific needs or preferences?"
        value={formData.specialRequirements?.join(', ') || ''}
        onChangeText={(text) => {
          const requirements = text.split(',').map(r => r.trim()).filter(r => r);
          updateField('specialRequirements', requirements);
        }}
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Previous"
          onPress={onPrevious}
          variant="outline"
          size="large"
          style={styles.button}
        />
        
        <Button
          title="Continue"
          onPress={handleNext}
          variant="primary"
          size="large"
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: dimensions.spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
    marginTop: dimensions.spacing.lg,
  },
  fieldLabel: {
    fontSize: fonts.md,
    fontWeight: '500' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  propertyTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: dimensions.spacing.md,
  },
  propertyTypeButton: {
    margin: dimensions.spacing.xs,
  },
  input: {
    marginBottom: dimensions.spacing.md,
  },
  locationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: dimensions.spacing.md,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: dimensions.borderRadius.sm,
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    margin: dimensions.spacing.xs,
  },
  locationText: {
    fontSize: fonts.sm,
    color: colors.textPrimary,
    marginRight: dimensions.spacing.xs,
  },
  removeLocationButton: {
    paddingHorizontal: dimensions.spacing.xs,
    minWidth: 30,
  },
  budgetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.md,
  },
  budgetInput: {
    flex: 0.48,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
  },
  toggleLabel: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    flex: 1,
  },
  errorText: {
    fontSize: fonts.sm,
    color: colors.error,
    marginBottom: dimensions.spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: dimensions.spacing.xl,
  },
  button: {
    flex: 1,
    marginHorizontal: dimensions.spacing.sm,
  },
});

export default TenantSpecificStep; 