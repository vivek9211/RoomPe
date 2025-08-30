import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';

const OnboardingScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to RoomPe!</Text>
        <Text style={styles.subtitle}>Complete your onboarding to get started</Text>
        
        <TouchableOpacity style={styles.completeButton}>
          <Text style={styles.completeButtonText}>Complete Onboarding</Text>
        </TouchableOpacity>
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
    paddingHorizontal: dimensions.spacing.xl,
    paddingTop: dimensions.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fonts.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xl,
  },
  completeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  completeButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
});

export default OnboardingScreen; 