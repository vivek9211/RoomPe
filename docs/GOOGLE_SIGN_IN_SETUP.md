# Google Sign-In Setup Guide

This guide will help you set up Google Sign-In for your React Native RoomPe application.

## Prerequisites

- Firebase project already configured
- Android app configured with Firebase
- Google Sign-In package installed (`@react-native-google-signin/google-signin`)

## Step 1: Get Web Client ID from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`roompe-6f643`)
3. Click on the gear icon (⚙️) next to "Project Overview" to open Project Settings
4. Go to the "General" tab
5. Scroll down to the "Your apps" section
6. If you don't have a web app:
   - Click "Add app" button
   - Choose the web platform (</>)
   - Give it a nickname (e.g., "RoomPe Web")
   - Click "Register app"
7. Copy the `Client ID` from the web app configuration

## Step 2: Update Configuration

1. Open `src/config/googleSignIn.ts`
2. Replace `'YOUR_WEB_CLIENT_ID_HERE'` with the actual web client ID you copied
3. Example:
   ```typescript
   export const GOOGLE_SIGN_IN_CONFIG = {
     webClientId: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
     offlineAccess: true,
     hostedDomain: '',
     forceCodeForRefreshToken: true,
   };
   ```

## Step 3: Enable Google Sign-In in Firebase

1. In Firebase Console, go to "Authentication" in the left sidebar
2. Click on the "Sign-in method" tab
3. Find "Google" in the list of providers
4. Click on it and enable it
5. Add your support email
6. Save the changes

## Step 4: Configure Android App

The Android app is already configured with:
- Google Play Services dependency in `android/app/build.gradle`
- Firebase configuration in `android/app/google-services.json`

## Step 5: Test Google Sign-In

1. Run your app: `npm run android`
2. Navigate to the login screen
3. Tap "Continue with Google"
4. You should see the Google Sign-In popup
5. Select your Google account
6. The app should authenticate and navigate to the dashboard

## Troubleshooting

### Common Issues

1. **"Google Play Services are not available"**
   - Make sure you're testing on a device/emulator with Google Play Services
   - Update Google Play Services on the device

2. **"Sign-In failed"**
   - Check that the web client ID is correct
   - Verify Google Sign-In is enabled in Firebase Console
   - Check that the package name in Firebase matches your app

3. **Build errors**
   - Clean and rebuild: `cd android && ./gradlew clean && cd .. && npm run android`

### Debug Information

- Check the console logs for detailed error messages
- Verify the web client ID is correctly set in the configuration
- Ensure Firebase is properly initialized before calling Google Sign-In

## Security Notes

- Never commit the actual web client ID to version control
- Consider using environment variables for production builds
- The web client ID is safe to include in client-side code as it's public

## Additional Configuration

You can customize the Google Sign-In behavior by modifying the configuration in `src/config/googleSignIn.ts`:

- `offlineAccess`: Enable offline access to Google APIs
- `hostedDomain`: Restrict sign-in to specific domains
- `forceCodeForRefreshToken`: Force refresh token generation

## Support

If you encounter issues:
1. Check the Firebase documentation
2. Review the Google Sign-In package documentation
3. Check the console logs for error details
4. Verify all configuration steps are completed 