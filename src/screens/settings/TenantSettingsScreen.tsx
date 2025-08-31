import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

interface TenantSettingsScreenProps {
  navigation: any;
}

const TenantSettingsScreen: React.FC<TenantSettingsScreenProps> = ({ navigation }) => {
  const { signOut, userProfile } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleNavigateToProfile = () => {
    navigation.navigate('Profile');
  };

  const handleNavigateToAssignProperty = () => {
    navigation.navigate('AssignProperty');
  };

  const handleNavigateToNotifications = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleNavigateToPrivacy = () => {
    navigation.navigate('PrivacySettings');
  };

  const handleNavigateToHelp = () => {
    navigation.navigate('HelpSupport');
  };

  const handleNavigateToAbout = () => {
    navigation.navigate('AboutApp');
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void,
    showArrow: boolean = true
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingItemLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {showArrow && <Text style={styles.arrowIcon}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account and preferences</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {renderSettingItem('👤', 'Edit Profile', 'Update your personal information', handleNavigateToProfile)}
          {renderSettingItem('🏠', 'Assign Property', 'Find and apply for properties', handleNavigateToAssignProperty)}
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          {renderSettingItem('🔔', 'Notifications', 'Manage notification preferences', handleNavigateToNotifications)}
          {renderSettingItem('🔒', 'Privacy & Security', 'Manage your privacy settings', handleNavigateToPrivacy)}
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {renderSettingItem('❓', 'Help & Support', 'Get help and contact support', handleNavigateToHelp)}
          {renderSettingItem('ℹ️', 'About', 'App version and information', handleNavigateToAbout)}
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: dimensions.spacing.xl,
    paddingTop: dimensions.spacing.xl,
    paddingBottom: dimensions.spacing.lg,
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
  },
  section: {
    marginBottom: dimensions.spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: fonts.xl,
    marginRight: dimensions.spacing.md,
    width: 30,
    textAlign: 'center',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: fonts.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  settingSubtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  arrowIcon: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: colors.error,
    marginHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xl,
  },
  versionText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
});

export default TenantSettingsScreen;
