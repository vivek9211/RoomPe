import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import LottieView from 'lottie-react-native';
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
          
          {/* Lottie Animation - Full Width */}
          <View style={styles.animationContainer}>
            <LottieView
              source={{
                uri: 'https://lottie.host/e67fa508-0b38-4484-9ac4-951b487b562d/g9PkzBADI1.lottie'
              }}
              autoPlay
              loop
              style={styles.animation}
              onAnimationFinish={() => {
                console.log('Animation finished');
              }}
            />
          </View>
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
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
    marginBottom: dimensions.spacing.md,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: dimensions.spacing.xxl,
    marginBottom: dimensions.spacing.xl,
    width: '100%',
  },
  animation: {
    width: '100%',
    height: 300,
    maxWidth: 400,
  },
  buttonContainer: {
    gap: dimensions.spacing.md,
    marginTop: -dimensions.spacing.lg,
  },
  loginButton: {
    marginBottom: dimensions.spacing.sm,
  },
  registerButton: {
    borderColor: colors.primary,
  },
});

export default WelcomeScreen;
