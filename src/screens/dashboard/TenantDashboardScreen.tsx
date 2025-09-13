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
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestore';
import { TenantApplication, TenantApplicationStatus } from '../../types/tenant.types';
import { Property } from '../../types/property.types';
import { usePayments } from '../../hooks/usePayments';
// Removed cleanup functions - no longer needed

interface TenantDashboardScreenProps {
  navigation: any;
}

interface AssignedPropertyData {
  application: TenantApplication;
  property: Property;
}

const TenantDashboardScreen: React.FC<TenantDashboardScreenProps> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [assignedProperty, setAssignedProperty] = useState<AssignedPropertyData | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Payment hooks
  const {
    currentMonthRent,
    pendingPayments,
    paymentStats,
    totalOutstanding,
    currentMonthStatus,
    loading: paymentsLoading,
    refreshPayments
  } = usePayments();

  // Fetch assigned property on component mount and set up real-time listener
  useEffect(() => {
    console.log('TenantDashboard useEffect triggered');
    console.log('userProfile:', userProfile);
    
    if (userProfile?.uid) {
      console.log('User profile found, loading assigned property');
      loadAssignedProperty();
      
      // Set up real-time listener for tenant applications
      const unsubscribe = firestoreService.onTenantApplicationsByTenantChange(
        userProfile.uid,
        async (applications) => {
          console.log('Real-time applications update:', applications);
          // Find the approved application
          const approvedApplication = applications.find(
            (app: TenantApplication) => app.status === TenantApplicationStatus.APPROVED
          );

          if (approvedApplication) {
            // Fetch the property details
            const property = await firestoreService.getPropertyById(approvedApplication.propertyId);
            
            if (property) {
              setAssignedProperty({
                application: approvedApplication,
                property: property,
              });
            }
          } else {
            setAssignedProperty(null);
          }
        }
      );
      
      return () => unsubscribe();
    } else {
      console.log('No user profile found');
    }
  }, [userProfile?.uid]);

  // Auto-refresh payment data when screen comes into focus (e.g., returning from payment page)
  useFocusEffect(
    React.useCallback(() => {
      console.log('TenantDashboard screen focused - refreshing payment data');
      if (userProfile?.uid) {
        // Small delay to prevent immediate refresh on first load
        const timer = setTimeout(() => {
          refreshPayments();
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }, [userProfile?.uid, refreshPayments])
  );

  const loadAssignedProperty = async () => {
    if (!userProfile?.uid) return;

    try {
      setLoadingProperty(true);
      console.log('Loading assigned property for user:', userProfile.uid);
      
      // Get all tenant applications for this user
      const applications = await firestoreService.getTenantApplicationsByTenant(userProfile.uid);
      console.log('Found applications:', applications);
      
      // Find the approved application
      const approvedApplication = applications.find(
        (app: TenantApplication) => app.status === TenantApplicationStatus.APPROVED
      );
      console.log('Approved application:', approvedApplication);

      if (approvedApplication) {
        // Fetch the property details
        const property = await firestoreService.getPropertyById(approvedApplication.propertyId);
        console.log('Property details:', property);
        
        if (property) {
          setAssignedProperty({
            application: approvedApplication,
            property: property,
          });
          console.log('Assigned property set successfully');
        }
      } else {
        console.log('No approved application found');
      }
    } catch (error) {
      console.error('Error loading assigned property:', error);
    } finally {
      setLoadingProperty(false);
    }
  };

  const handlePayDues = () => {
    navigation.navigate('TenantPayments');
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

  const handleFindProperties = () => {
    navigation.navigate('AssignProperty');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'View your notifications');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPayments();
    } catch (error) {
      console.error('Error refreshing payments:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleHelp = () => {
    Alert.alert('Help', 'Contact support at support@roompe.com');
  };

  // Removed cleanup function - no longer needed

  const handleViewPropertyDetails = () => {
    console.log('handleViewPropertyDetails called');
    console.log('assignedProperty:', assignedProperty);
    
    if (assignedProperty) {
      console.log('Navigating to AssignedPropertyDetail with:', {
        property: assignedProperty.property,
        application: assignedProperty.application
      });
      
      navigation.navigate('AssignedPropertyDetail', { 
        property: assignedProperty.property,
        application: assignedProperty.application 
      });
    } else {
      console.log('No assigned property found');
      Alert.alert('No Property', 'You don\'t have an assigned property yet.');
    }
  };

  const getMemberSinceDate = () => {
    if (userProfile?.createdAt) {
      let date: Date;
      if (userProfile.createdAt.toDate && typeof userProfile.createdAt.toDate === 'function') {
        date = userProfile.createdAt.toDate();
      } else {
        date = new Date(userProfile.createdAt as any);
      }
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    }
    return 'Recently';
  };

  const formatMoveInDate = (timestamp: any) => {
    if (!timestamp) return 'Not specified';
    let date: Date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
        translucent={false}
      />
      
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + dimensions.spacing.md }]}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.greeting}>Hello, {userProfile?.name || 'User'}</Text>
            <Text style={styles.memberSince}>Member Since {getMemberSinceDate()}</Text>
          </View>
        </View>
        
                 <View style={styles.actionIcons}>
           <TouchableOpacity style={styles.notificationIcon} onPress={handleNotifications}>
             <Text style={styles.iconText}>🔔</Text>
           </TouchableOpacity>
         </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            title="Pull to refresh payments"
            titleColor={colors.textSecondary}
          />
        }
      >

        {/* Assigned Property Section */}
        {loadingProperty ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your property...</Text>
          </View>
        ) : assignedProperty ? (
          <View style={styles.assignedPropertySection}>
            <Text style={styles.sectionTitle}>Your Assigned Property</Text>
            
                         <TouchableOpacity 
               style={styles.propertyCard} 
               onPress={handleViewPropertyDetails}
               activeOpacity={0.7}
             >
              <View style={styles.propertyHeader}>
                <Text style={styles.propertyName}>{assignedProperty.property.name}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Approved</Text>
                </View>
              </View>
              
              <View style={styles.propertyDetails}>
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyLabel}>Property Type</Text>
                  <Text style={styles.propertyValue}>{assignedProperty.property.type}</Text>
                </View>
                
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyLabel}>Location</Text>
                  <Text style={styles.propertyValue}>
                    {assignedProperty.property.location?.address || 'Address not available'}
                  </Text>
                </View>
                
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyLabel}>Move-in Date</Text>
                  <Text style={styles.propertyValue}>
                    {formatMoveInDate(assignedProperty.application.requestedMoveInDate)}
                  </Text>
                </View>
                
                {assignedProperty.application.requestedRent && (
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyLabel}>Requested Rent</Text>
                    <Text style={styles.propertyValue}>₹{assignedProperty.application.requestedRent}</Text>
                  </View>
                )}
              </View>
              
                             <View style={styles.propertyActions}>
                 <TouchableOpacity 
                   style={styles.viewDetailsButton}
                   onPress={handleViewPropertyDetails}
                   activeOpacity={0.7}
                 >
                   <Text style={styles.viewDetailsText}>View Details</Text>
                 </TouchableOpacity>
               </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noPropertySection}>
            <Text style={styles.sectionTitle}>No Property Assigned</Text>
            <View style={styles.noPropertyCard}>
              <Text style={styles.noPropertyIcon}>🏠</Text>
              <Text style={styles.noPropertyTitle}>No Property Assigned Yet</Text>
              <Text style={styles.noPropertySubtitle}>
                You haven't been assigned to any property yet. Browse available properties and apply!
              </Text>
              <TouchableOpacity style={styles.findPropertiesButton} onPress={handleFindProperties}>
                <Text style={styles.findPropertiesText}>Find Properties</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* My Accounts Section */}
        <View style={styles.accountsSection}>
          <Text style={styles.sectionTitle}>My Accounts</Text>
          
          {paymentsLoading && refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Refreshing payments...</Text>
            </View>
          ) : (
            <View style={styles.accountCards}>
            {/* Current Month Rent */}
            {currentMonthRent && (
              <View style={styles.accountCard}>
                <View style={styles.cardContent}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>
                      {currentMonthRent.month} Rent
                    </Text>
                    <Text style={styles.duesAmount}>
                      ₹{currentMonthRent.amount + (currentMonthRent.lateFee || 0)}
                    </Text>
                    <View style={styles.cardIcon}>
                      <Text style={styles.iconText}>🏠</Text>
                    </View>
                  </View>
                  {currentMonthStatus === 'pending' || currentMonthStatus === 'overdue' ? (
                    <TouchableOpacity style={styles.payButton} onPress={handlePayDues}>
                      <Text style={styles.payButtonText}>Pay Now</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidText}>Paid</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            
            {/* Total Outstanding */}
            {totalOutstanding > 0 && (
              <View style={styles.accountCard}>
                <View style={styles.cardContent}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>Total Outstanding</Text>
                    <Text style={styles.duesAmount}>₹{totalOutstanding}</Text>
                    <View style={styles.cardIcon}>
                      <Text style={styles.iconText}>📅</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.payButton} onPress={handlePayDues}>
                    <Text style={styles.payButtonText}>Pay Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {/* Payment Summary */}
            {paymentStats && (
              <View style={styles.accountCard}>
                <View style={styles.cardContent}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>Payment Summary</Text>
                    <Text style={styles.rentAmount}>
                      {paymentStats.totalPayments} payments
                    </Text>
                    <Text style={styles.rentAmount}>
                      ₹{paymentStats.paidAmount} paid
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.viewButton} onPress={handlePayDues}>
                    <Text style={styles.viewButtonText}>View All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          )}
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
            
            <TouchableOpacity style={styles.lifeCard} onPress={handleFindProperties}>
              <Text style={styles.lifeCardTitle}>Find Properties</Text>
              <Text style={styles.lifeCardSubtitle}>Browse and apply to available properties</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Help Button */}
      <TouchableOpacity style={styles.helpButton} onPress={handleHelp}>
        <Text style={styles.helpIcon}>💬</Text>
        <Text style={styles.helpText}>Help</Text>
      </TouchableOpacity>

      {/* Removed cleanup button - no longer needed */}
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
    paddingTop: dimensions.spacing.md,
    paddingBottom: dimensions.spacing.md,
    minHeight: 70,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.spacing.md,
  },
  avatarText: {
    fontSize: 24,
    color: colors.white,
  },
  userDetails: {
    flex: 1,
  },
  greeting: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.white,
    marginBottom: dimensions.spacing.xs,
  },
  memberSince: {
    fontSize: fonts.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
    color: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
    paddingTop: dimensions.spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.xl,
  },
  loadingText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginTop: dimensions.spacing.sm,
  },
  assignedPropertySection: {
    marginBottom: dimensions.spacing.xl,
  },
  propertyCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  propertyName: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  statusText: {
    fontSize: fonts.sm,
    color: colors.white,
    fontWeight: '500',
  },
  propertyDetails: {
    marginBottom: dimensions.spacing.md,
  },
  propertyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  propertyLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  propertyValue: {
    fontSize: fonts.sm,
    color: colors.textPrimary,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  propertyActions: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: dimensions.spacing.md,
  },
  viewDetailsButton: {
    backgroundColor: colors.primary,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
  noPropertySection: {
    marginBottom: dimensions.spacing.xl,
  },
  noPropertyCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xl,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noPropertyIcon: {
    fontSize: 48,
    marginBottom: dimensions.spacing.md,
  },
  noPropertyTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center',
  },
  noPropertySubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: dimensions.spacing.lg,
    lineHeight: 20,
  },
  findPropertiesButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  findPropertiesText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
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
  paidBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
  },
  paidText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
  },
  viewButtonText: {
    color: colors.textPrimary,
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
  // Removed cleanup button styles - no longer needed
});

export default TenantDashboardScreen; 