import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';
import { Button } from '../../components/common';

interface WelcomeScreenProps {
  navigation: any; // Replace with proper navigation type
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const handleLogin = () => {
    console.log('Login button pressed!');
    // Navigate to login screen
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    console.log('Register button pressed!');
    // Navigate to register screen
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* App Logo/Brand */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>RoomPe</Text>
          <Text style={styles.tagline}>Rent Management Made Simple</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Login"
            onPress={handleLogin}
            variant="primary"
            size="large"
            style={styles.loginButton}
          />
          
          <Button
            title="Register now"
            onPress={handleRegister}
            variant="outline"
            size="large"
            style={styles.registerButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.xl,
    paddingTop: dimensions.spacing.xxxl,
    paddingBottom: dimensions.spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: dimensions.spacing.xxxl,
  },
  logoText: {
    fontSize: fonts.display,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: 2,
    marginBottom: dimensions.spacing.sm,
  },
  tagline: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '400' as const,
  },
  buttonContainer: {
    gap: dimensions.spacing.md,
  },
  loginButton: {
    marginBottom: dimensions.spacing.sm,
  },
  registerButton: {
    borderColor: colors.primary,
  },
});

export default WelcomeScreen;
