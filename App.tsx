/**
 * RoomPe - Rent Management Application
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { colors } from './src/constants';
import { AuthProvider } from './src/contexts/AuthContext';
import { PropertyProvider } from './src/contexts/PropertyContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
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
