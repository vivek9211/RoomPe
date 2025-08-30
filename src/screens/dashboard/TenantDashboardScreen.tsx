import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

interface TenantDashboardScreenProps {
  navigation: any;
}

const TenantDashboardScreen: React.FC<TenantDashboardScreenProps> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [currentTime, setCurrentTime] = useState('10:34');
  const [batteryLevel, setBatteryLevel] = useState('47');

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    }, 60000);

    // Update battery level (mock - replace with actual battery API)
    const batteryInterval = setInterval(() => {
      setBatteryLevel(Math.floor(Math.random() * 30 + 40).toString());
    }, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(batteryInterval);
    };
  }, []);

  const handlePayDues = () => {
    navigation.navigate('Payments');
  };

  const handleExpressCheckIn = () => {
    Alert.alert('Express Check-In', 'Complete your Digital Check-In in under 90 seconds!');
  };

  const handleReportIssue = () => {
    navigation.navigate('AddMaintenance');
  };

  const handleAttendance = () => {
    Alert.alert('Attendance', 'Mark your attendance for leave requests');
  };

  const handleStories = () => {
    Alert.alert('Stories', 'View property updates and announcements');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'View your notifications');
  };

  const handleHelp = () => {
    Alert.alert('Help', 'Contact support at support@roompe.com');
  };

  const getMemberSinceDate = () => {
    if (userProfile?.createdAt) {
      const date = new Date(userProfile.createdAt);
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    }
    return 'Recently';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.timeText}>{currentTime}</Text>
        <View style={styles.statusIcons}>
          <Text style={styles.signalIcon}>📶</Text>
          <Text style={styles.wifiIcon}>📶</Text>
          <Text style={styles.batteryIcon}>🔋</Text>
          <Text style={styles.batteryLevel}>{batteryLevel}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.greeting}>Hello, {userProfile?.name || 'User'}</Text>
              <Text style={styles.memberSince}>Member Since {getMemberSinceDate()}</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.storiesButton} onPress={handleStories}>
              <View style={styles.storiesIcon}>
                <Text style={styles.iconText}>📢</Text>
              </View>
              <Text style={styles.actionLabel}>Stories</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.notificationButton} onPress={handleNotifications}>
              <View style={styles.notificationIcon}>
                <Text style={styles.iconText}>🔔</Text>
              </View>
              <Text style={styles.actionLabel}>Notification</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Accounts Section */}
        <View style={styles.accountsSection}>
          <Text style={styles.sectionTitle}>My Accounts</Text>
          
          <View style={styles.accountCards}>
            <View style={styles.accountCard}>
              <View style={styles.cardContent}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>Pay dues to get credits</Text>
                  <View style={styles.cardIcon}>
                    <Text style={styles.iconText}>💰</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.payButton} onPress={handlePayDues}>
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.accountCard}>
              <View style={styles.cardContent}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>Total Dues</Text>
                  <Text style={styles.duesAmount}>₹10000</Text>
                  <View style={styles.cardIcon}>
                    <Text style={styles.iconText}>📅</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.payButton} onPress={handlePayDues}>
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.accountCard}>
              <View style={styles.cardContent}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>Rent</Text>
                  <Text style={styles.rentAmount}>₹100</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* New Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>New Features!</Text>
          
          <TouchableOpacity style={styles.expressCheckInBanner} onPress={handleExpressCheckIn}>
            <View style={styles.bannerHeader}>
              <Text style={styles.bannerTitle}>EXPRESS CHECK-IN</Text>
              <Text style={styles.clockIcon}>⏰</Text>
            </View>
            
            <Text style={styles.bannerDescription}>
              Complete your Digital Check-In in under{' '}
              <Text style={styles.highlightedText}>90 seconds</Text>
            </Text>
            
            <Text style={styles.bannerSubtitle}>Get ready to move in</Text>
            
            <View style={styles.bannerGraphics}>
              <Text style={styles.keysIcon}>🔑</Text>
              <View style={styles.phoneMockup}>
                <Text style={styles.phoneTitle}>DIGITAL CHECK-IN</Text>
                <Text style={styles.phoneDetails}>Room: Single Sharing</Text>
                <Text style={styles.phoneDetails}>Property: Rama PG</Text>
                <Text style={styles.phoneDetails}>Check-in: 15 Dec 2024</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Life in Property Section */}
        <View style={styles.lifeSection}>
          <Text style={styles.sectionTitle}>Life in Property</Text>
          
          <View style={styles.lifeCards}>
            <TouchableOpacity style={styles.lifeCard} onPress={handleReportIssue}>
              <Text style={styles.lifeCardTitle}>Facing Issues?</Text>
              <Text style={styles.lifeCardSubtitle}>Register your issues in one click</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.lifeCard} onPress={handleAttendance}>
              <Text style={styles.lifeCardTitle}>Attendance</Text>
              <Text style={styles.lifeCardSubtitle}>Mark your attendance for leave requests</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Help Button */}
      <TouchableOpacity style={styles.helpButton} onPress={handleHelp}>
        <Text style={styles.helpIcon}>💬</Text>
        <Text style={styles.helpText}>Help</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
    backgroundColor: colors.background,
  },
  timeText: {
    fontSize: fonts.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalIcon: {
    fontSize: 16,
    marginRight: dimensions.spacing.xs,
  },
  wifiIcon: {
    fontSize: 16,
    marginRight: dimensions.spacing.xs,
  },
  batteryIcon: {
    fontSize: 16,
    marginRight: dimensions.spacing.xs,
  },
  batteryLevel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.xl,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.spacing.md,
  },
  avatarText: {
    fontSize: 24,
  },
  userDetails: {
    flex: 1,
  },
  greeting: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  memberSince: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  storiesButton: {
    alignItems: 'center',
  },
  storiesIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: dimensions.spacing.xs,
  },
  notificationButton: {
    alignItems: 'center',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: dimensions.spacing.xs,
  },
  iconText: {
    fontSize: 20,
    color: colors.white,
  },
  actionLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  accountsSection: {
    marginBottom: dimensions.spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  accountCards: {
    gap: dimensions.spacing.md,
  },
  accountCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  duesAmount: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  rentAmount: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
  },
  payButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
  featuresSection: {
    marginBottom: dimensions.spacing.xl,
  },
  expressCheckInBanner: {
    backgroundColor: '#1E293B',
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  bannerTitle: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: '#FCD34D',
  },
  clockIcon: {
    fontSize: 20,
    color: '#FCD34D',
  },
  bannerDescription: {
    fontSize: fonts.md,
    color: colors.white,
    marginBottom: dimensions.spacing.sm,
  },
  highlightedText: {
    backgroundColor: '#FCD34D',
    color: '#1E293B',
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    fontSize: fonts.md,
    color: '#94A3B8',
    marginBottom: dimensions.spacing.lg,
  },
  bannerGraphics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  keysIcon: {
    fontSize: 32,
  },
  phoneMockup: {
    backgroundColor: '#334155',
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  phoneTitle: {
    fontSize: fonts.md,
    fontWeight: 'bold',
    color: '#FCD34D',
    marginBottom: dimensions.spacing.xs,
  },
  phoneDetails: {
    fontSize: fonts.sm,
    color: colors.white,
    marginBottom: dimensions.spacing.xs,
  },
  lifeSection: {
    marginBottom: dimensions.spacing.xl,
  },
  lifeCards: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  lifeCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lifeCardTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  lifeCardSubtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  helpButton: {
    position: 'absolute',
    bottom: dimensions.spacing.xl,
    right: dimensions.spacing.xl,
    backgroundColor: colors.success,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  helpIcon: {
    fontSize: 20,
    marginBottom: dimensions.spacing.xs,
  },
  helpText: {
    fontSize: fonts.sm,
    color: colors.white,
    fontWeight: '500',
  },
});

export default TenantDashboardScreen; 