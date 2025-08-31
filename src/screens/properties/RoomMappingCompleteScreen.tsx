import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { Property } from '../../types/property.types';

interface RoomMappingCompleteScreenProps {
  navigation: any;
  route: any;
}

const RoomMappingCompleteScreen: React.FC<RoomMappingCompleteScreenProps> = ({ navigation, route }) => {
  const { property } = route.params || {};

  const handleGoToDashboard = () => {
    navigation.navigate('OwnerTabs');
  };

  const handleViewRooms = () => {
    // TODO: Navigate to room management screen
    Alert.alert('Info', 'Room management screen coming soon!');
  };

  if (!property) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Property Not Found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Room Mapping Complete!</Text>
      </View>

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successIcon}>
          <Text style={styles.checkmark}>✅</Text>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Room Mapping Created Successfully!</Text>
        <Text style={styles.subtitle}>
          Your property "{property.name}" now has a complete room structure with floors and units configured.
        </Text>

        {/* Property Info */}
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>{property.name}</Text>
          <Text style={styles.propertyAddress}>
            📍 {property.location?.address || 'Address not available'}
          </Text>
        </View>

        {/* Next Steps */}
        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>What's Next?</Text>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Add tenants to your rooms</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Set up rent collection</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Track maintenance requests</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewRooms}
          >
            <Text style={styles.primaryButtonText}>View Rooms</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoToDashboard}
          >
            <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
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
  header: {
    backgroundColor: colors.success,
    paddingVertical: dimensions.spacing.xl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fonts.xl,
    fontWeight: '700',
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
    paddingTop: dimensions.spacing.xl,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: dimensions.spacing.xl,
  },
  checkmark: {
    fontSize: 80,
  },
  title: {
    fontSize: fonts.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: dimensions.spacing.xl,
    lineHeight: 24,
  },
  propertyInfo: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  propertyName: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  propertyAddress: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  nextSteps: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xl,
    width: '100%',
  },
  nextStepsTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
    textAlign: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: dimensions.spacing.md,
  },
  stepText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    flex: 1,
  },
  actionButtons: {
    width: '100%',
    gap: dimensions.spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: fonts.lg,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    paddingVertical: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: fonts.lg,
    fontWeight: '600',
  },
});

export default RoomMappingCompleteScreen;
