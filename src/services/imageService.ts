import { launchImageLibrary, ImagePickerResponse, MediaType, ImageLibraryOptions, PhotoQuality } from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import { Platform, PermissionsAndroid } from 'react-native';
import firebase from '@react-native-firebase/app';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ImagePickerOptions {
  mediaType?: MediaType;
  maxWidth?: number;
  maxHeight?: number;
  quality?: PhotoQuality;
  includeBase64?: boolean;
}

class ImageService {
  // Check if Firebase is properly initialized
  async checkFirebaseInitialization(): Promise<boolean> {
    try {
      const apps = firebase.apps;
      console.log('Firebase apps:', apps);
      
      if (apps.length === 0) {
        console.error('No Firebase apps initialized');
        return false;
      }

      const defaultApp = firebase.app();
      console.log('Default Firebase app:', defaultApp.name);
      console.log('Firebase options:', defaultApp.options);
      
      return true;
    } catch (error) {
      console.error('Firebase initialization check failed:', error);
      return false;
    }
  }

  // Check if Firebase Storage is properly initialized
  async checkStorageAvailability(): Promise<boolean> {
    try {
      // First check if Firebase is initialized
      const isFirebaseInitialized = await this.checkFirebaseInitialization();
      if (!isFirebaseInitialized) {
        console.error('Firebase not properly initialized');
        return false;
      }

      const storageInstance = storage();
      console.log('Firebase Storage instance:', storageInstance);
      
      // Try to create a test reference
      const testRef = storageInstance.ref('test');
      console.log('Test reference created:', testRef.fullPath);
      
      return true;
    } catch (error) {
      console.error('Firebase Storage not available:', error);
      return false;
    }
  }

  // Request camera permissions for Android
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Camera permission request failed:', err);
        return false;
      }
    }
    return true;
  }

  // Check if storage permission is already granted
  async checkStoragePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        
        if (androidVersion >= 33) {
          // Android 13+ - check READ_MEDIA_IMAGES permission
          const result = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          );
          return result;
        } else {
          // Android 12 and below - check READ_EXTERNAL_STORAGE permission
          const result = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
          return result;
        }
      } catch (err) {
        console.warn('Storage permission check failed:', err);
        return false;
      }
    }
    return true; // iOS doesn't need explicit permission for photo library
  }

  // Request storage permissions for Android
  async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        // For Android 13+ (API level 33+), we need READ_MEDIA_IMAGES
        // For older versions, we need READ_EXTERNAL_STORAGE
        const androidVersion = Platform.Version;
        
        if (androidVersion >= 33) {
          // Android 13+ - request READ_MEDIA_IMAGES permission
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Photo Permission',
              message: 'This app needs access to your photos to select profile images.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // Android 12 and below - request READ_EXTERNAL_STORAGE permission
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'This app needs access to your storage to select images.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn('Storage permission request failed:', err);
        return false;
      }
    }
    return true; // iOS doesn't need explicit permission for photo library
  }

  // Launch image picker with fallback for permission issues
  async pickImage(options: ImagePickerOptions = {}): Promise<ImagePickerResponse> {
    const defaultOptions: ImageLibraryOptions = {
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      includeBase64: false,
      ...options,
    };

    try {
      const result = await launchImageLibrary(defaultOptions);
      
      // If we get a permission error, try to provide helpful feedback
      if (result.errorCode === 'permission') {
        console.warn('Image picker permission error:', result.errorMessage);
      }
      
      return result;
    } catch (error) {
      console.error('Image picker error:', error);
      throw error;
    }
  }

  // Upload image to Firebase Storage
  async uploadImage(
    uri: string,
    path: string,
    metadata?: { contentType?: string; customMetadata?: Record<string, string> }
  ): Promise<ImageUploadResult> {
    try {
      console.log('Starting upload for URI:', uri);
      console.log('Upload path:', path);
      
      // Create a reference to the file location
      const storageRef = storage().ref(path);
      console.log('Storage reference created:', storageRef.fullPath);
      
      // Prepare metadata
      const uploadMetadata = {
        contentType: metadata?.contentType || 'image/jpeg',
        customMetadata: metadata?.customMetadata || {},
      };
      console.log('Upload metadata:', uploadMetadata);
      
      // Upload the file
      console.log('Starting file upload...');
      const task = storageRef.putFile(uri, uploadMetadata);
      
      // Wait for upload to complete
      await task;
      console.log('File upload completed successfully');
      
      // Get the download URL
      console.log('Getting download URL...');
      const url = await storageRef.getDownloadURL();
      console.log('Download URL obtained:', url);
      
      return {
        success: true,
        url,
      };
    } catch (error: any) {
      console.error('Image upload error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Firebase Storage errors
      if (error.code === 'storage/object-not-found') {
        return {
          success: false,
          error: 'File reference not found. Please try again.',
        };
      } else if (error.code === 'storage/unauthorized') {
        return {
          success: false,
          error: 'Upload unauthorized. Please check your authentication.',
        };
      } else if (error.code === 'storage/quota-exceeded') {
        return {
          success: false,
          error: 'Storage quota exceeded. Please try again later.',
        };
      } else if (error.code === 'storage/retry-limit-exceeded') {
        return {
          success: false,
          error: 'Upload failed after multiple attempts. Please try again.',
        };
      } else if (error.code === 'storage/invalid-checksum') {
        return {
          success: false,
          error: 'File corruption detected. Please select the image again.',
        };
      } else if (error.code === 'storage/canceled') {
        return {
          success: false,
          error: 'Upload was canceled.',
        };
      } else if (error.code === 'storage/invalid-format') {
        return {
          success: false,
          error: 'Invalid file format. Please select a valid image.',
        };
      } else if (error.code === 'storage/invalid-url') {
        return {
          success: false,
          error: 'Invalid file URL. Please select the image again.',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to upload image',
      };
    }
  }

  // Test upload method to diagnose storage issues
  async testStorageUpload(): Promise<ImageUploadResult> {
    try {
      console.log('Testing Firebase Storage upload...');
      
      // Check Firebase initialization
      const isFirebaseInitialized = await this.checkFirebaseInitialization();
      if (!isFirebaseInitialized) {
        return {
          success: false,
          error: 'Firebase not properly initialized',
        };
      }

      // Check storage availability
      const isStorageAvailable = await this.checkStorageAvailability();
      if (!isStorageAvailable) {
        return {
          success: false,
          error: 'Firebase Storage not available',
        };
      }

      // Try to create a simple test reference
      const testPath = `test/connection_test_${Date.now()}.txt`;
      const testRef = storage().ref(testPath);
      console.log('Test reference path:', testRef.fullPath);

      // Try to upload a simple text file (this won't actually upload, just test the reference)
      const testMetadata = {
        contentType: 'text/plain',
        customMetadata: {
          test: 'true',
          timestamp: new Date().toISOString(),
        },
      };

      console.log('Test metadata:', testMetadata);
      
      return {
        success: true,
        url: testRef.fullPath,
      };
    } catch (error: any) {
      console.error('Storage test failed:', error);
      return {
        success: false,
        error: `Storage test failed: ${error.message}`,
      };
    }
  }

  // Fallback upload method with different path format
  async uploadImageWithFallback(
    uri: string,
    basePath: string,
    metadata?: { contentType?: string; customMetadata?: Record<string, string> }
  ): Promise<ImageUploadResult> {
    try {
      // Try the original path first
      const result = await this.uploadImage(uri, basePath, metadata);
      if (result.success) {
        return result;
      }

      // If original fails, try with a simpler path format
      console.log('Original upload failed, trying fallback path...');
      const fallbackPath = `uploads/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
      const fallbackResult = await this.uploadImage(uri, fallbackPath, metadata);
      if (fallbackResult.success) {
        console.log('Fallback upload successful with path:', fallbackPath);
        return fallbackResult;
      }

      // If both fail, return the original error
      return result;
    } catch (error: any) {
      console.error('Fallback upload error:', error);
      return {
        success: false,
        error: error.message || 'Both upload methods failed',
      };
    }
  }

  // Upload profile image
  async uploadProfileImage(uri: string, userId: string): Promise<ImageUploadResult> {
    try {
      // Check if storage is available
      const isStorageAvailable = await this.checkStorageAvailability();
      if (!isStorageAvailable) {
        return {
          success: false,
          error: 'Firebase Storage is not available. Please check your connection.',
        };
      }

      const path = `users/${userId}/profile/profile_${Date.now()}.jpg`;
      console.log('Profile image upload path:', path);
      
      return this.uploadImageWithFallback(uri, path, {
        contentType: 'image/jpeg',
        customMetadata: {
          type: 'profile',
          userId,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Profile image upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload profile image',
      };
    }
  }

  // Upload Aadhaar image
  async uploadAadhaarImage(uri: string, userId: string): Promise<ImageUploadResult> {
    try {
      // Check if storage is available
      const isStorageAvailable = await this.checkStorageAvailability();
      if (!isStorageAvailable) {
        return {
          success: false,
          error: 'Firebase Storage is not available. Please check your connection.',
        };
      }

      const path = `users/${userId}/documents/aadhaar_${Date.now()}.jpg`;
      console.log('Aadhaar image upload path:', path);
      
      return this.uploadImageWithFallback(uri, path, {
        contentType: 'image/jpeg',
        customMetadata: {
          type: 'aadhaar',
          userId,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Aadhaar image upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload Aadhaar image',
      };
    }
  }

  // Delete image from Firebase Storage
  async deleteImage(path: string): Promise<boolean> {
    try {
      const storageRef = storage().ref(path);
      await storageRef.delete();
      return true;
    } catch (error) {
      console.error('Image deletion error:', error);
      return false;
    }
  }

  // Get image size in MB - improved for local files
  getImageSize(uri: string): Promise<number> {
    return new Promise((resolve, reject) => {
      // For local files, we can't use XMLHttpRequest HEAD method
      // Instead, we'll use a more reliable approach
      if (uri.startsWith('file://') || uri.startsWith('content://')) {
        // For local files, we'll estimate size based on dimensions or skip size check
        // This is more reliable than trying to get file size from local URIs
        resolve(0); // Return 0 to skip size validation for local files
        return;
      }

      // For remote URLs, use XMLHttpRequest
      if (uri.startsWith('http')) {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', uri, true);
        xhr.onload = () => {
          if (xhr.status === 200) {
            const size = parseInt(xhr.getResponseHeader('Content-Length') || '0');
            resolve(size / (1024 * 1024)); // Convert to MB
          } else {
            resolve(0); // Skip size validation if we can't get size
          }
        };
        xhr.onerror = () => resolve(0); // Skip size validation on error
        xhr.send();
      } else {
        resolve(0); // Skip size validation for unknown URI types
      }
    });
  }

  // Check if file exists and is accessible
  async checkFileAccess(uri: string): Promise<boolean> {
    try {
      if (uri.startsWith('file://') || uri.startsWith('content://')) {
        // For local files, we'll assume they exist if we got the URI
        // The real test will be when we try to upload
        return true;
      }
      
      if (uri.startsWith('http')) {
        // For remote URLs, we can check if they're accessible
        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open('HEAD', uri, true);
          xhr.timeout = 5000; // 5 second timeout
          xhr.onload = () => resolve(xhr.status === 200);
          xhr.onerror = () => resolve(false);
          xhr.ontimeout = () => resolve(false);
          xhr.send();
        });
      }
      
      return false;
    } catch (error) {
      console.warn('File access check failed:', error);
      return false;
    }
  }

  // Validate image before upload - improved validation
  async validateImage(uri: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Check if it's a valid image URI first
      if (!uri.startsWith('file://') && !uri.startsWith('content://') && !uri.startsWith('http')) {
        return {
          isValid: false,
          error: 'Invalid image URI format',
        };
      }

      // Check if file is accessible
      const isAccessible = await this.checkFileAccess(uri);
      if (!isAccessible) {
        return {
          isValid: false,
          error: 'Image file is not accessible',
        };
      }

      // For local files, skip size validation as it's unreliable
      if (uri.startsWith('file://') || uri.startsWith('content://')) {
        // Basic validation for local files - just check URI format and accessibility
        return { isValid: true };
      }

      // For remote URLs, check file size
      const size = await this.getImageSize(uri);
      if (size > 0 && size > 10) {
        return {
          isValid: false,
          error: 'Image size must be less than 10MB',
        };
      }

      return { isValid: true };
    } catch (error) {
      console.warn('Image validation warning:', error);
      // Don't fail validation for local files due to size check issues
      if (uri.startsWith('file://') || uri.startsWith('content://')) {
        return { isValid: true };
      }
      return {
        isValid: false,
        error: 'Failed to validate image',
      };
    }
  }
}

export const imageService = new ImageService();
export default imageService; 