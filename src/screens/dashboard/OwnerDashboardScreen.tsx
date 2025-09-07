import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useProperty } from '../../contexts/PropertyContext';
import { Property } from '../../types/property.types';
import { firestoreService } from '../../services/firestore';

interface OwnerDashboardScreenProps {
  navigation: any;
  route?: any;
}

const OwnerDashboardScreen: React.FC<OwnerDashboardScreenProps> = ({ navigation, route }) => {
  const { userProfile, signOut } = useAuth();
  const { selectedProperty, setSelectedProperty } = useProperty();
  const insets = useSafeAreaInsets();
  const [properties, setProperties] = useState<Property[]>([]);
  
  // Animation values for scroll effects
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  


  useEffect(() => {
    if (userProfile?.uid) {
      loadProperties();
      
      // Set up real-time listener for properties
      const unsubscribe = firestoreService.onPropertiesByOwnerChange(
        userProfile.uid,
        (firebaseProperties) => {
          // Convert Firebase data to Property objects
          const properties: Property[] = firebaseProperties.map((firebaseProperty: any) => ({
            id: firebaseProperty.id,
            name: firebaseProperty.name,
            ownerId: firebaseProperty.ownerId,
            type: firebaseProperty.type,
            status: firebaseProperty.status,
            location: firebaseProperty.location,
            totalRooms: firebaseProperty.totalRooms,
            availableRooms: firebaseProperty.availableRooms,
            createdAt: firebaseProperty.createdAt,
            updatedAt: firebaseProperty.updatedAt,
            pricing: firebaseProperty.pricing,
          }));
          
          setProperties(properties);
          console.log('Properties updated in dashboard real-time:', properties);
          
          // Auto-select first property if none is selected
          if (!selectedProperty && properties.length > 0) {
            setSelectedProperty(properties[0]);
          }
        }
      );
      
      // Cleanup listener on unmount
      return () => unsubscribe();
    }
  }, [userProfile?.uid]);

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);



  const loadProperties = async () => {
    if (!userProfile?.uid) {
      console.log('No user profile, skipping property load');
      return;
    }

    try {
      // Load properties from Firebase for the current user
      const firebaseProperties = await firestoreService.getPropertiesByOwner(userProfile.uid);
      
      // Convert Firebase data to Property objects
      const properties: Property[] = firebaseProperties.map((firebaseProperty: any) => ({
        id: firebaseProperty.id,
        name: firebaseProperty.name,
        ownerId: firebaseProperty.ownerId,
        type: firebaseProperty.type,
        status: firebaseProperty.status,
        location: firebaseProperty.location,
        totalRooms: firebaseProperty.totalRooms,
        availableRooms: firebaseProperty.availableRooms,
        createdAt: firebaseProperty.createdAt,
        updatedAt: firebaseProperty.updatedAt,
        pricing: firebaseProperty.pricing,
      }));
      
      setProperties(properties);
      console.log('Properties loaded in dashboard:', properties);
      
      // Auto-select first property if none is selected
      if (!selectedProperty && properties.length > 0) {
        setSelectedProperty(properties[0]);
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
      case 'viewApplications':
        navigation.navigate('TenantApplications');
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
      <View style={[styles.topBar, { paddingTop: insets.top + dimensions.spacing.md }]}>
         <View style={styles.propertySelector}>
           <TouchableOpacity style={styles.propertyButton} onPress={handlePropertySwitch}>
             <Text style={styles.propertyName}>
               {selectedProperty?.name || 'No Property Selected'}
             </Text>
             <Text style={styles.dropdownIcon}>▼</Text>
           </TouchableOpacity>
         </View>
         
         <View style={styles.actionIcons}>
           <TouchableOpacity style={styles.notificationIcon}>
             <Text style={styles.iconText}>🔔</Text>
           </TouchableOpacity>
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
        {/* No Property Selected Message */}
        {!selectedProperty && (
          <View style={styles.noPropertyMessage}>
            <Text style={styles.noPropertyTitle}>
              {properties.length === 0 ? 'Welcome to RoomPe!' : 'No Property Selected'}
            </Text>
            <Text style={styles.noPropertySubtitle}>
              {properties.length === 0 
                ? 'Get started by adding your first property to manage your rental business'
                : 'Please select a property from the dropdown above to view dashboard information'
              }
            </Text>
            <TouchableOpacity
              style={styles.selectPropertyButton}
              onPress={properties.length === 0 ? () => navigation.navigate('AddProperty') : handlePropertySwitch}
            >
              <Text style={styles.selectPropertyButtonText}>
                {properties.length === 0 ? 'Add Your First Property' : 'Select Property'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
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
        <Animated.View 
          style={[
            styles.quickActionsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          {/* Horizontal ScrollView for Quick Actions */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScrollContainer}
            snapToInterval={80 + dimensions.spacing.md}
            decelerationRate="fast"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            bounces={true}
            alwaysBounceHorizontal={false}
          >
                         <Animated.View
               style={{
                 transform: [{
                   scale: scrollY.interpolate({
                     inputRange: [0, 80],
                     outputRange: [1, 1.05],
                     extrapolate: 'clamp',
                   }),
                 }],
               }}
             >
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('addTenant')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionIcon}>👥</Text>
                <Text style={styles.actionLabel}>Add Tenant</Text>
              </TouchableOpacity>
            </Animated.View>
            
                         <Animated.View
               style={{
                 transform: [{
                   scale: scrollY.interpolate({
                     inputRange: [80, 160],
                     outputRange: [1, 1.05],
                     extrapolate: 'clamp',
                   }),
                 }],
               }}
             >
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('viewApplications')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={styles.actionLabel}>Applications</Text>
              </TouchableOpacity>
            </Animated.View>
            
                         <Animated.View
               style={{
                 transform: [{
                   scale: scrollY.interpolate({
                     inputRange: [160, 240],
                     outputRange: [1, 1.05],
                     extrapolate: 'clamp',
                   }),
                 }],
               }}
             >
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('receivePayment')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionIcon}>💱</Text>
                <Text style={styles.actionLabel}>Receive Payment</Text>
              </TouchableOpacity>
            </Animated.View>
            
                         <Animated.View
               style={{
                 transform: [{
                   scale: scrollY.interpolate({
                     inputRange: [160, 240],
                     outputRange: [1, 1.05],
                     extrapolate: 'clamp',
                   }),
                 }],
               }}
             >
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('addDues')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionIcon}>💰</Text>
                <Text style={styles.actionLabel}>Add Dues</Text>
              </TouchableOpacity>
            </Animated.View>
            
                         <Animated.View
               style={{
                 transform: [{
                   scale: scrollY.interpolate({
                     inputRange: [240, 320],
                     outputRange: [1, 1.05],
                     extrapolate: 'clamp',
                   }),
                 }],
               }}
             >
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('addExpense')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionIcon}>📄</Text>
                <Text style={styles.actionLabel}>Add Expense</Text>
              </TouchableOpacity>
            </Animated.View>
            
                         <Animated.View
               style={{
                 transform: [{
                   scale: scrollY.interpolate({
                     inputRange: [320, 400],
                     outputRange: [1, 1.05],
                     extrapolate: 'clamp',
                   }),
                 }],
               }}
             >
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => handleQuickAction('sendAnnouncement')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionIcon}>📢</Text>
                <Text style={styles.actionLabel}>Send Announcement</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
          
          {/* Scroll Indicator */}
          <View style={styles.scrollIndicator}>
            <View style={styles.scrollDots}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.scrollDot,
                    {
                                             backgroundColor: scrollY.interpolate({
                         inputRange: [
                           index * 80,
                           (index + 1) * 80,
                         ],
                         outputRange: [colors.textMuted, colors.primary],
                         extrapolate: 'clamp',
                       }),
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>

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

  propertySelector: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
     propertyButton: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.15)',
     paddingHorizontal: dimensions.spacing.lg,
     paddingVertical: dimensions.spacing.sm,
     borderRadius: dimensions.borderRadius.xl,
     minWidth: 120,
     maxWidth: 280,
     justifyContent: 'center',
   },
  propertyName: {
    fontSize: fonts.lg,
    color: colors.white,
    fontWeight: '600',
    marginRight: dimensions.spacing.sm,
    maxWidth: 200,
    textAlign: 'center',
    flexShrink: 1,
  },
  dropdownIcon: {
    fontSize: fonts.md,
    color: colors.white,
    fontWeight: 'bold',
  },

  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
     notificationIcon: {
     backgroundColor: 'rgba(255, 255, 255, 0.15)',
     borderRadius: 18,
     width: 36,
     height: 36,
     justifyContent: 'center',
     alignItems: 'center',
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
     borderRadius: dimensions.borderRadius.lg,
     paddingHorizontal: dimensions.spacing.md,
     height: 44,
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
     borderRadius: dimensions.borderRadius.lg,
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
     borderRadius: dimensions.borderRadius.lg,
     marginHorizontal: dimensions.spacing.xs,
     alignItems: 'center',
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
  quickActionsScrollContainer: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
  },
     quickActionButton: {
     width: 80,
     minWidth: 80,
     backgroundColor: colors.white,
     padding: dimensions.spacing.md,
     borderRadius: dimensions.borderRadius.lg,
     alignItems: 'center',
     marginRight: dimensions.spacing.md,
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
     backgroundColor: 'rgba(76, 175, 80, 0.1)',
     padding: dimensions.spacing.lg,
     borderRadius: dimensions.borderRadius.lg,
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
  helpButtonIcon: {
    fontSize: 20,
    marginBottom: dimensions.spacing.xs,
  },
  helpText: {
    fontSize: fonts.sm,
    color: colors.white,
    fontWeight: '500',
  },
  scrollIndicator: {
    alignItems: 'center',
    marginTop: dimensions.spacing.md,
  },
  scrollDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: colors.textMuted,
  },
     noPropertyMessage: {
     backgroundColor: colors.white,
     padding: dimensions.spacing.xl,
     borderRadius: dimensions.borderRadius.lg,
     marginBottom: dimensions.spacing.xl,
     alignItems: 'center',
   },
  noPropertyTitle: {
    fontSize: fonts.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  noPropertySubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: dimensions.spacing.lg,
    lineHeight: 22,
  },
     selectPropertyButton: {
     backgroundColor: colors.primary,
     paddingHorizontal: dimensions.spacing.lg,
     paddingVertical: dimensions.spacing.md,
     borderRadius: dimensions.borderRadius.lg,
   },
  selectPropertyButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
});

export default OwnerDashboardScreen; 