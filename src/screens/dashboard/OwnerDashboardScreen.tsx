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
import { Property } from '../../types/property.types';

interface OwnerDashboardScreenProps {
  navigation: any;
  route?: any;
}

const OwnerDashboardScreen: React.FC<OwnerDashboardScreenProps> = ({ navigation, route }) => {
  const { userProfile } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (route?.params?.selectedProperty) {
      setSelectedProperty(route.params.selectedProperty);
    }
    loadProperties();
  }, [route?.params?.selectedProperty]);

  const loadProperties = async () => {
    try {
      // Mock data - replace with actual API call
      const mockProperties: Property[] = [
        {
          id: '1',
          name: 'Sri Sai Balaji Mens PG',
          ownerId: userProfile?.uid || '',
          type: 'pg' as any,
          status: 'active' as any,
          location: {
            address: '123 Main Street',
            city: 'Bangalore',
            state: 'Karnataka',
            postalCode: '560001',
            country: 'India',
          },
          totalRooms: 20,
          availableRooms: 5,
          createdAt: new Date() as any,
          updatedAt: new Date() as any,
          pricing: {
            baseRent: 8000,
            deposit: 16000,
            currency: 'INR',
          },
        },
      ];
      setProperties(mockProperties);
      if (!selectedProperty && mockProperties.length > 0) {
        setSelectedProperty(mockProperties[0]);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const handlePropertySwitch = () => {
    navigation.navigate('PropertySelection');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'addTenant':
        navigation.navigate('AddTenant');
        break;
      case 'receivePayment':
        navigation.navigate('AddPayment');
        break;
      case 'addDues':
        navigation.navigate('AddPayment');
        break;
      case 'addExpense':
        // Navigate to expense screen
        Alert.alert('Coming Soon', 'Expense management will be available soon');
        break;
      case 'sendAnnouncement':
        // Navigate to announcement screen
        Alert.alert('Coming Soon', 'Announcement feature will be available soon');
        break;
    }
  };

  const handleViewReports = () => {
    navigation.navigate('Reports');
  };

  const handleHelp = () => {
    Alert.alert('Help', 'Contact support at support@roompe.com');
  };

  const getCurrentMonth = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[new Date().getMonth()];
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
        translucent={false}
      />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>10:16</Text>
        </View>
        
        <View style={styles.propertySelector}>
          <TouchableOpacity style={styles.propertyButton} onPress={handlePropertySwitch}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>RentOk</Text>
            </View>
            <Text style={styles.propertyName}>
              {selectedProperty?.name || 'Select Property'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statusIcons}>
          <View style={styles.statusIconRow}>
            <Text style={styles.signalIcon}>📶</Text>
            <Text style={styles.wifiIcon}>📶</Text>
            <Text style={styles.batteryIcon}>🔋</Text>
          </View>
          <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.notificationIcon}>
              <Text style={styles.iconText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpIcon}>
              <Text style={styles.iconText}>❓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search Tenants, Rooms ...</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* August Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{getCurrentMonth()} Summary for</Text>
            <TouchableOpacity style={styles.propertiesDropdown}>
              <Text style={styles.propertiesText}>All {properties.length} Properties</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryAmount}>₹0</Text>
              <Text style={styles.summaryLabel}>Today's Collection</Text>
              <Text style={styles.summaryIcon}>💰</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryAmount}>₹0</Text>
              <Text style={styles.summaryLabel}>{getCurrentMonth()}'s Collection</Text>
              <Text style={styles.summaryIcon}>💰</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryAmount}>₹0</Text>
              <Text style={styles.summaryLabel}>{getCurrentMonth()}'s Dues</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('addTenant')}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionLabel}>Add Tenant</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('receivePayment')}
            >
              <Text style={styles.actionIcon}>💱</Text>
              <Text style={styles.actionLabel}>Receive Payment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('addDues')}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>Add Dues</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('addExpense')}
            >
              <Text style={styles.actionIcon}>📄</Text>
              <Text style={styles.actionLabel}>Add Expense</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('sendAnnouncement')}
            >
              <Text style={styles.actionIcon}>📢</Text>
              <Text style={styles.actionLabel}>Send Announcement</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reports Section */}
        <View style={styles.reportsSection}>
          <Text style={styles.sectionTitle}>View your reports in PDF and Excel</Text>
          <TouchableOpacity style={styles.reportCard} onPress={handleViewReports}>
            <Text style={styles.reportTitle}>All Property Summary Report</Text>
            <View style={styles.reportFeatures}>
              <View style={styles.reportFeature}>
                <Text style={styles.checkmark}>✅</Text>
                <Text style={styles.featureText}>Rooms & Tenants Count</Text>
              </View>
              <View style={styles.reportFeature}>
                <Text style={styles.checkmark}>✅</Text>
                <Text style={styles.featureText}>Bookings & Leads Count</Text>
              </View>
              <View style={styles.reportFeature}>
                <Text style={styles.checkmark}>✅</Text>
                <Text style={styles.featureText}>Total Potential Collection</Text>
              </View>
              <View style={styles.reportFeature}>
                <Text style={styles.checkmark}>✅</Text>
                <Text style={styles.featureText}>Property Performance</Text>
              </View>
            </View>
          </TouchableOpacity>
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
  topBar: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    height: 80,
  },
  timeContainer: {
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: fonts.md,
    color: colors.white,
    fontWeight: '500',
  },
  propertySelector: {
    flex: 1,
    alignItems: 'center',
  },
  propertyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.lg,
  },
  logoContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.spacing.sm,
  },
  logoText: {
    fontSize: fonts.sm,
    fontWeight: 'bold',
    color: colors.primary,
  },
  propertyName: {
    fontSize: fonts.md,
    color: colors.white,
    fontWeight: '500',
    marginRight: dimensions.spacing.sm,
    maxWidth: 120,
  },
  dropdownIcon: {
    fontSize: fonts.sm,
    color: colors.white,
  },
  statusIcons: {
    alignItems: 'flex-end',
  },
  statusIconRow: {
    flexDirection: 'row',
    marginBottom: dimensions.spacing.xs,
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
  },
  actionIcons: {
    flexDirection: 'row',
  },
  notificationIcon: {
    marginRight: dimensions.spacing.sm,
  },
  helpIcon: {
    marginRight: dimensions.spacing.sm,
  },
  iconText: {
    fontSize: 20,
  },
  searchContainer: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    height: 48,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: dimensions.spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: fonts.md,
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  summarySection: {
    marginBottom: dimensions.spacing.xl,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  summaryTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  propertiesDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  propertiesText: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    marginRight: dimensions.spacing.sm,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginHorizontal: dimensions.spacing.xs,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryAmount: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: dimensions.spacing.xs,
  },
  summaryLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: dimensions.spacing.xs,
  },
  summaryIcon: {
    fontSize: 16,
  },
  quickActionsSection: {
    marginBottom: dimensions.spacing.xl,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '18%',
    backgroundColor: colors.white,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: dimensions.spacing.xs,
  },
  actionLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  reportsSection: {
    marginBottom: dimensions.spacing.xl,
  },
  reportCard: {
    backgroundColor: colors.success + '20',
    padding: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  reportTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  reportFeatures: {
    gap: dimensions.spacing.sm,
  },
  reportFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    marginRight: dimensions.spacing.sm,
  },
  featureText: {
    fontSize: fonts.md,
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

export default OwnerDashboardScreen; 