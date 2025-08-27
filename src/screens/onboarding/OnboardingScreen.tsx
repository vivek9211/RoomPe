import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, Alert } from 'react-native';
import { Button } from '../../components/common';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { OnboardingStep } from '../../types/onboarding.types';
import { UserRole } from '../../types/user.types';
import PersonalInfoStep from './steps/PersonalInfoStep';
import TenantSpecificStep from './steps/TenantSpecificStep';

interface OnboardingScreenProps {
  navigation: any;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { userProfile, completeGoogleOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.PERSONAL_INFO);
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Get onboarding steps based on user role
  const getOnboardingSteps = (role: UserRole) => {
    const baseSteps = [
      OnboardingStep.PERSONAL_INFO,
      OnboardingStep.ROLE_SPECIFIC,
    ];

    return baseSteps;
  };

  const steps = getOnboardingSteps(userProfile?.role || UserRole.TENANT);
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStep = steps[currentStepIndex + 1];
      setCurrentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const previousStep = steps[currentStepIndex - 1];
      setCurrentStep(previousStep);
    }
  };

  const handleStepComplete = (stepData: any) => {
    setOnboardingData((prev: any) => ({
      ...prev,
      [currentStep]: stepData
    }));
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    try {
      // Complete the onboarding process
      // This will update the user profile and mark onboarding as complete
      const role = userProfile?.role === UserRole.OWNER ? 'owner' : 'tenant';
      await completeGoogleOnboarding(role, {
        ...onboardingData,
        onboardingCompleted: true
      });
      
      // Navigate to dashboard
      navigation.navigate('Dashboard');
    } catch (error: any) {
      console.error('Failed to complete onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentStep = () => {
    const commonProps = {
      data: onboardingData[currentStep] || {},
      onComplete: handleStepComplete,
      onNext: handleNext,
      onPrevious: handlePrevious,
    };

    switch (currentStep) {
      case OnboardingStep.PERSONAL_INFO:
        return <PersonalInfoStep {...commonProps} />;
      case OnboardingStep.ROLE_SPECIFIC:
        return userProfile?.role === UserRole.OWNER ? 
          <View><Text>Owner specific step - Coming soon</Text></View> : 
          <TenantSpecificStep {...commonProps} />;
      default:
        return <PersonalInfoStep {...commonProps} />;
    }
  };

  const getStepTitle = (step: OnboardingStep) => {
    switch (step) {
      case OnboardingStep.PERSONAL_INFO:
        return 'Personal Information';
      case OnboardingStep.ROLE_SPECIFIC:
        return userProfile?.role === UserRole.OWNER ? 'Property Management' : 'Rental Preferences';
      default:
        return 'Onboarding';
    }
  };

  const getStepSubtitle = (step: OnboardingStep) => {
    switch (step) {
      case OnboardingStep.PERSONAL_INFO:
        return 'Tell us about yourself';
      case OnboardingStep.ROLE_SPECIFIC:
        return userProfile?.role === UserRole.OWNER ? 
          'Set up your property management preferences' : 
          'Tell us about your rental needs';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{getStepTitle(currentStep)}</Text>
        <Text style={styles.subtitle}>{getStepSubtitle(currentStep)}</Text>
        
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {steps.map((step, index) => (
            <View
              key={step}
              style={[
                styles.progressStep,
                index <= currentStepIndex ? styles.progressStepActive : styles.progressStepInactive
              ]}
            />
          ))}
        </View>
        
        <Text style={styles.progressText}>
          Step {currentStepIndex + 1} of {steps.length}
        </Text>
      </View>

      {/* Step content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navigation}>
        {currentStepIndex > 0 && (
          <Button
            title="Previous"
            onPress={handlePrevious}
            variant="outline"
            size="large"
            style={styles.navButton}
          />
        )}
        
        {currentStepIndex === steps.length - 1 ? (
          <Button
            title="Complete Onboarding"
            onPress={handleCompleteOnboarding}
            loading={loading}
            variant="primary"
            size="large"
            style={styles.navButton}
          />
        ) : (
          <Button
            title="Next"
            onPress={handleNext}
            variant="primary"
            size="large"
            style={styles.navButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: dimensions.spacing.xl,
    paddingTop: dimensions.spacing.xl,
    paddingBottom: dimensions.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: {
    fontSize: fonts.xxxl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    marginBottom: dimensions.spacing.md,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  progressStepInactive: {
    backgroundColor: colors.lightGray,
  },
  progressText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.xl,
    paddingTop: dimensions.spacing.lg,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  navButton: {
    flex: 1,
    marginHorizontal: dimensions.spacing.sm,
  },
});

export default OnboardingScreen; 