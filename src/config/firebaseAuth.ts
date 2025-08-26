import { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Optional: configure Firebase action code settings for email links
// Update the URL to a domain you control and have added to Firebase Auth
// Authorized domains must be configured in Firebase Console → Authentication → Settings

export const emailVerificationActionCodeSettings: FirebaseAuthTypes.ActionCodeSettings | undefined = undefined;

export const passwordResetActionCodeSettings: FirebaseAuthTypes.ActionCodeSettings | undefined = undefined;

// Example configuration (uncomment and edit to use):
// export const emailVerificationActionCodeSettings: FirebaseAuthTypes.ActionCodeSettings = {
//   url: 'https://yourdomain.com/email-verification',
//   handleCodeInApp: false,
//   android: {
//     installApp: false,
//     minimumVersion: '21',
//     packageName: 'com.roompe',
//   },
//   iOS: {
//     bundleId: 'com.roompe',
//   },
// };
// export const passwordResetActionCodeSettings: FirebaseAuthTypes.ActionCodeSettings = {
//   url: 'https://yourdomain.com/password-reset',
//   handleCodeInApp: false,
// };

