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
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import EmailVerificationScreen from './src/screens/auth/EmailVerificationScreen';
import PhoneVerificationScreen from './src/screens/auth/PhoneVerificationScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import { colors } from './src/constants';
import { AuthProvider } from './src/contexts/AuthContext';

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
      if (currentScreen === 'LoginScreen' || currentScreen === 'RegisterScreen' || currentScreen === 'ForgotPassword') {
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
      case 'ForgotPassword':
        return <ForgotPasswordScreen navigation={navigation} />;
      case 'EmailVerification':
        return <EmailVerificationScreen navigation={navigation} />;
      case 'PhoneVerification':
        return <PhoneVerificationScreen navigation={navigation} />;
      case 'Dashboard':
        return <DashboardScreen navigation={navigation} />;
      case 'Welcome':
      default:
        return <WelcomeScreen navigation={navigation} />;
    }
  };

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor={colors.background}
        />
        {renderCurrentScreen()}
      </SafeAreaProvider>
    </AuthProvider>
  );
}

export default App;
