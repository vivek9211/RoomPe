/**
 * RoomPe - Rent Management Application
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { colors } from './src/constants';
import { AuthProvider } from './src/contexts/AuthContext';
import { PropertyProvider } from './src/contexts/PropertyContext';
import AppNavigator from './src/navigation/AppNavigator';
import { PushNotificationService } from './src/services/notifications/pushNotifications';
import { NotificationScheduler } from './src/services/notifications/notificationScheduler';

function App() {
  useEffect(() => {
    // Initialize push notifications
    PushNotificationService.initialize();
    
    // Note: NotificationScheduler should only be started by property owners
    // or as a background service, not for every user opening the app
    // Moved to property owner dashboard or background service
  }, []);

  return (
    <AuthProvider>
      <PropertyProvider>
        <SafeAreaProvider>
          <StatusBar 
            barStyle="dark-content" 
            backgroundColor={colors.background}
          />
          <AppNavigator />
        </SafeAreaProvider>
      </PropertyProvider>
    </AuthProvider>
  );
}

export default App;
