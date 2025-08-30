// Google Sign-In Configuration
// You need to get the web client ID from Firebase Console
// Go to Project Settings > General > Your Apps > Web App
export const GOOGLE_SIGN_IN_CONFIG = {
  // Replace this with your actual web client ID from Firebase Console
  webClientId: '290507797128-9bqfgorshb4mid6ot3b3ff3jeaio7cil.apps.googleusercontent.com',
  
  // Optional configurations
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
};

// Instructions to get web client ID:
// 1. Go to Firebase Console (https://console.firebase.google.com/)
// 2. Select your project
// 3. Go to Project Settings (gear icon)
// 4. Go to General tab
// 5. Scroll down to "Your apps" section
// 6. If you don't have a web app, click "Add app" and choose Web
// 7. Copy the Client ID from the web app configuration
// 8. Replace 'YOUR_WEB_CLIENT_ID_HERE' with the actual client ID 