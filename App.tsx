/**
 * RoomPe - Rent Management Application
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import { colors } from './src/constants';

function App() {
  const [currentScreen, setCurrentScreen] = useState('Welcome');

  // Navigation object that handles screen transitions
  const navigation = {
    navigate: (screen: string) => {
      console.log(`Navigating to ${screen}`);
      setCurrentScreen(screen);
    },
    goBack: () => {
      console.log('Going back');
      if (currentScreen === 'LoginScreen' || currentScreen === 'RegisterScreen') {
        setCurrentScreen('Welcome');
      }
    },
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'LoginScreen':
        return <LoginScreen navigation={navigation} />;
      case 'RegisterScreen':
        return <RegisterScreen navigation={navigation} />;
      case 'Welcome':
      default:
        return <WelcomeScreen navigation={navigation} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={colors.background}
      />
      {renderCurrentScreen()}
    </SafeAreaProvider>
  );
}

export default App;
