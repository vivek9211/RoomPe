import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Input, Button } from '../../../components/common';
import { colors, fonts, dimensions } from '../../../constants';
import { PersonalInfoData } from '../../../types/onboarding.types';
import { useAuth } from '../../../contexts/AuthContext';
import imageService from '../../../services/imageService';

interface PersonalInfoStepProps {
  data: PersonalInfoData;
  onComplete: (data: PersonalInfoData) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  data,
  onComplete,
  onNext,
  onPrevious,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<PersonalInfoData>({
    name: data.name || '',
    dateOfBirth: data.dateOfBirth,
    profilePhoto: data.profilePhoto,
    aadhaarImage: data.aadhaarImage,
    gender: data.gender,
    occupation: data.occupation || '',
    company: data.company || '',
    annualIncome: data.annualIncome,
  });

  const [errors, setErrors] = useState<Partial<PersonalInfoData>>({});
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingAadhaar, setUploadingAadhaar] = useState(false);

  useEffect(() => {
    // Pre-fill form with existing data
    if (data.name) {
      setFormData(prev => ({ ...prev, ...data }));
    }
  }, [data]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PersonalInfoData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
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

  const handleSave = () => {
    if (validateForm()) {
      onComplete(formData);
      Alert.alert('Saved', 'Personal information saved successfully');
    }
  };

  const updateField = (field: keyof PersonalInfoData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const showPermissionGuide = () => {
    Alert.alert(
      'How to Grant Permission',
      'To upload images, please follow these steps:\n\n' +
      '1. Go to your device Settings\n' +
      '2. Find "Apps" or "Application Manager"\n' +
      '3. Find "RoomPe" app\n' +
      '4. Tap "Permissions"\n' +
      '5. Enable "Photos and videos" or "Storage" permission\n' +
      '6. Come back and try again\n\n' +
      'Note: On newer Android devices, you may see "Photos and videos" instead of "Storage".',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Try Again', onPress: () => handleProfileImageUpload() }
      ]
    );
  };

  const handleProfileImageUpload = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setUploadingProfile(true);

      // First check if permission is already granted
      const hasPermission = await imageService.checkStoragePermission();
      if (!hasPermission) {
        // Request permissions with better error handling
        const hasStoragePermission = await imageService.requestStoragePermission();
        if (!hasStoragePermission) {
          Alert.alert(
            'Permission Required', 
            'Storage permission is required to select images. Please grant permission in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Show Guide', onPress: showPermissionGuide }
            ]
          );
          return;
        }
      }

      // Pick image
      const result = await imageService.pickImage({
        mediaType: 'photo',
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
      });

      console.log('Image picker result:', {
        didCancel: result.didCancel,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        assetsCount: result.assets?.length || 0,
        firstAsset: result.assets?.[0]
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        console.error('Image picker error:', result.errorCode, result.errorMessage);
        Alert.alert('Error', result.errorMessage || 'Failed to pick image');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert('Error', 'No image selected');
        return;
      }

      if (result.assets && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        console.log('Selected image URI:', uri);
        
        // Validate image
        const validation = await imageService.validateImage(uri);
        console.log('Image validation result:', validation);
        
        if (!validation.isValid) {
          // Show warning but allow user to proceed
          Alert.alert(
            'Image Validation Warning',
            `Image validation failed: ${validation.error || 'Unknown error'}\n\nWould you like to continue with the upload anyway?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Continue Anyway', onPress: async () => {
                try {
                  // Upload image
                  const uploadResult = await imageService.uploadProfileImage(uri, user.uid);
                  
                  if (uploadResult.success && uploadResult.url) {
                    updateField('profilePhoto', uploadResult.url);
                    Alert.alert('Success', 'Profile image uploaded successfully');
                  } else {
                    Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload image');
                  }
                } catch (error: any) {
                  console.error('Profile image upload error:', error);
                  Alert.alert('Error', error.message || 'Failed to upload profile image');
                }
              }}
            ]
          );
          return;
        }

        // Upload image
        const uploadResult = await imageService.uploadProfileImage(uri, user.uid);
        
        if (uploadResult.success && uploadResult.url) {
          updateField('profilePhoto', uploadResult.url);
          Alert.alert('Success', 'Profile image uploaded successfully');
        } else {
          Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload image');
        }
      }
    } catch (error: any) {
      console.error('Profile image upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload profile image');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleAadhaarUpload = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setUploadingAadhaar(true);

      // First check if permission is already granted
      const hasPermission = await imageService.checkStoragePermission();
      if (!hasPermission) {
        // Request permissions with better error handling
        const hasStoragePermission = await imageService.requestStoragePermission();
        if (!hasStoragePermission) {
          Alert.alert(
            'Permission Required', 
            'Storage permission is required to select images. Please grant permission in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Show Guide', onPress: showPermissionGuide }
            ]
          );
          return;
        }
      }

      // Pick image
      const result = await imageService.pickImage({
        mediaType: 'photo',
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.9,
      });

      console.log('Aadhaar image picker result:', {
        didCancel: result.didCancel,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        assetsCount: result.assets?.length || 0,
        firstAsset: result.assets?.[0]
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        console.error('Image picker error:', result.errorCode, result.errorMessage);
        Alert.alert('Error', result.errorMessage || 'Failed to pick image');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert('Error', 'No image selected');
        return;
      }

      if (result.assets && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        console.log('Selected Aadhaar image URI:', uri);
        
        // Validate image
        const validation = await imageService.validateImage(uri);
        console.log('Aadhaar image validation result:', validation);
        
        if (!validation.isValid) {
          // Show warning but allow user to proceed
          Alert.alert(
            'Image Validation Warning',
            `Image validation failed: ${validation.error || 'Unknown error'}\n\nWould you like to continue with the upload anyway?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Continue Anyway', onPress: async () => {
                try {
                  // Upload image
                  const uploadResult = await imageService.uploadAadhaarImage(uri, user.uid);
                  
                  if (uploadResult.success && uploadResult.url) {
                    updateField('aadhaarImage', uploadResult.url);
                    Alert.alert('Success', 'Aadhaar image uploaded successfully');
                  } else {
                    Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload image');
                  }
                } catch (error: any) {
                  console.error('Aadhaar image upload error:', error);
                  Alert.alert('Error', error.message || 'Failed to upload Aadhaar image');
                }
              }}
            ]
          );
          return;
        }

        // Upload image
        const uploadResult = await imageService.uploadAadhaarImage(uri, user.uid);
        
        if (uploadResult.success && uploadResult.url) {
          updateField('aadhaarImage', uploadResult.url);
          Alert.alert('Success', 'Aadhaar image uploaded successfully');
        } else {
          Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload image');
        }
      }
    } catch (error: any) {
      console.error('Aadhaar image upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload Aadhaar image');
    } finally {
      setUploadingAadhaar(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Profile Image Section */}
      <View style={styles.profileImageSection}>
        <TouchableOpacity 
          onPress={handleProfileImageUpload} 
          style={styles.profileImageContainer}
          disabled={uploadingProfile}
        >
          {formData.profilePhoto ? (
            <Image source={{ uri: formData.profilePhoto }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              {uploadingProfile ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <Text style={styles.profileImagePlaceholderText}>📷</Text>
              )}
            </View>
          )}
          <View style={styles.cameraIcon}>
            {uploadingProfile ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={styles.cameraIconText}>📷</Text>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.profileImageLabel}>
          {uploadingProfile ? 'Uploading...' : 'Tap to upload profile photo'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <Input
        label="Full Name"
        placeholder="Enter your full name"
        value={formData.name}
        onChangeText={(text) => updateField('name', text)}
        error={errors.name}
        autoCapitalize="words"
        style={styles.input}
      />

      <Input
        label="Occupation"
        placeholder="What do you do?"
        value={formData.occupation || ''}
        onChangeText={(text) => updateField('occupation', text)}
        autoCapitalize="words"
        style={styles.input}
      />

      <Input
        label="Company"
        placeholder="Where do you work?"
        value={formData.company || ''}
        onChangeText={(text) => updateField('company', text)}
        autoCapitalize="words"
        style={styles.input}
      />

      <Text style={styles.sectionTitle}>Identity Verification</Text>
      
      <View style={styles.aadhaarSection}>
        <Text style={styles.aadhaarLabel}>Aadhaar Card Image</Text>
        <TouchableOpacity 
          onPress={handleAadhaarUpload} 
          style={styles.aadhaarUploadButton}
          disabled={uploadingAadhaar}
        >
          {formData.aadhaarImage && formData.aadhaarImage.length > 0 ? (
            <Image source={{ uri: formData.aadhaarImage! }} style={styles.aadhaarPreview} />
          ) : (
            <View style={styles.aadhaarPlaceholder}>
              {uploadingAadhaar ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <>
                  <Text style={styles.aadhaarPlaceholderText}>📄</Text>
                  <Text style={styles.aadhaarPlaceholderSubtext}>Upload Aadhaar Card</Text>
                </>
              )}
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.aadhaarHelpText}>
          {uploadingAadhaar 
            ? 'Uploading Aadhaar image...' 
            : 'Please upload a clear image of your Aadhaar card for verification'
          }
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Save Progress"
          onPress={handleSave}
          variant="outline"
          size="medium"
          style={styles.button}
          disabled={uploadingProfile || uploadingAadhaar}
        />
        
        <Button
          title="Continue"
          onPress={handleNext}
          variant="primary"
          size="large"
          style={styles.button}
          disabled={uploadingProfile || uploadingAadhaar}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: dimensions.spacing.xl,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: dimensions.spacing.xl,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: dimensions.spacing.sm,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  profileImagePlaceholderText: {
    fontSize: 40,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  cameraIconText: {
    fontSize: 20,
  },
  profileImageLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  permissionInfo: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: dimensions.spacing.sm,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
    marginTop: dimensions.spacing.lg,
  },
  input: {
    marginBottom: dimensions.spacing.md,
  },
  aadhaarSection: {
    marginBottom: dimensions.spacing.lg,
  },
  aadhaarLabel: {
    fontSize: fonts.md,
    fontWeight: '500' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  aadhaarUploadButton: {
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderStyle: 'dashed',
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  aadhaarPreview: {
    width: '100%',
    height: 150,
    borderRadius: dimensions.borderRadius.sm,
  },
  aadhaarPlaceholder: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.lg,
  },
  aadhaarPlaceholderText: {
    fontSize: 40,
    marginBottom: dimensions.spacing.sm,
  },
  aadhaarPlaceholderSubtext: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  aadhaarHelpText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: dimensions.spacing.sm,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: dimensions.spacing.xl,
  },
  button: {
    marginBottom: dimensions.spacing.md,
  },
});

export default PersonalInfoStep; 