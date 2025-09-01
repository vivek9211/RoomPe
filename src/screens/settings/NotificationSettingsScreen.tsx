import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';

interface NotificationSettingsScreenProps {
  navigation: any;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState({
    rentReminders: true,
    maintenanceUpdates: true,
    paymentConfirmations: true,
    propertyAlerts: true,
    generalUpdates: false,
  });

  const toggleSwitch = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderSettingItem = (
    title: string,
    subtitle: string,
    value: boolean,
    onToggle: () => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingItemLeft}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.lightGray, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          {renderSettingItem(
            'Rent Reminders',
            'Get notified about upcoming rent payments',
            notifications.rentReminders,
            () => toggleSwitch('rentReminders')
          )}
          {renderSettingItem(
            'Maintenance Updates',
            'Receive updates about maintenance requests',
            notifications.maintenanceUpdates,
            () => toggleSwitch('maintenanceUpdates')
          )}
          {renderSettingItem(
            'Payment Confirmations',
            'Get notified when payments are received',
            notifications.paymentConfirmations,
            () => toggleSwitch('paymentConfirmations')
          )}
          {renderSettingItem(
            'Property Alerts',
            'Important updates about your property',
            notifications.propertyAlerts,
            () => toggleSwitch('propertyAlerts')
          )}
          {renderSettingItem(
            'General Updates',
            'App updates and general announcements',
            notifications.generalUpdates,
            () => toggleSwitch('generalUpdates')
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 Tip</Text>
          <Text style={styles.infoText}>
            You can customize which notifications you receive. Important notifications about rent and maintenance will still be sent even if disabled.
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    paddingTop: dimensions.spacing.md,
    paddingBottom: dimensions.spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    padding: dimensions.spacing.sm,
  },
  backButtonText: {
    fontSize: fonts.xl,
    color: colors.textPrimary,
  },
  headerTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.white,
    marginBottom: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  settingItemLeft: {
    flex: 1,
    marginRight: dimensions.spacing.md,
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
  infoSection: {
    backgroundColor: colors.lightPrimary,
    marginHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
    padding: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
  },
  infoTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: dimensions.spacing.sm,
  },
  infoText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen;
