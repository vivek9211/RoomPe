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
  TextInput,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useProperty } from '../../contexts/PropertyContext';
import { Property } from '../../types/property.types';
import { Tenant } from '../../types/tenant.types';
import { Room } from '../../types/room.types';
import { firestoreService } from '../../services/firestore';
import { tenantApiService } from '../../services/api/tenantApi';

interface OwnerDashboardScreenProps {
  navigation: any;
  route?: any;
}

interface SearchResult {
  id: string;
  type: 'tenant' | 'room';
  title: string;
  subtitle: string;
  propertyName: string;
  propertyId: string;
  data: any;
}

interface TenantWithUser extends Tenant {
  user?: {
    name: string;
    email: string;
    phone: string;
  };
}

const OwnerDashboardScreen: React.FC<OwnerDashboardScreenProps> = ({ navigation, route }) => {
  const { userProfile, signOut } = useAuth();
  const { selectedProperty, setSelectedProperty } = useProperty();
  const insets = useSafeAreaInsets();
  const [properties, setProperties] = useState<Property[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
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

  // Search functions
  const searchTenantsAndRooms = async (query: string) => {
    if (!query.trim() || !userProfile?.uid) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results: SearchResult[] = [];
      const searchLower = query.toLowerCase().trim();

      // Search tenants across all properties
      for (const property of properties) {
        try {
          const tenants = await tenantApiService.getTenantsByProperty(property.id);
          
          for (const tenant of tenants) {
            try {
              // Get user details for tenant
              const user = await firestoreService.getUserProfile(tenant.userId);
              
              if (user && (
                user.name?.toLowerCase().includes(searchLower) ||
                user.email?.toLowerCase().includes(searchLower) ||
                user.phone?.toLowerCase().includes(searchLower) ||
                tenant.roomId?.toLowerCase().includes(searchLower)
              )) {
                results.push({
                  id: tenant.id,
                  type: 'tenant',
                  title: user.name || 'Unknown Tenant',
                  subtitle: `Room ${tenant.roomId} • ${user.email || 'No Email'}`,
                  propertyName: property.name,
                  propertyId: property.id,
                  data: { ...tenant, user }
                });
              }
            } catch (error) {
              console.error('Error fetching user for tenant:', error);
            }
          }
        } catch (error) {
          console.error('Error fetching tenants for property:', property.id, error);
        }
      }

      // Search rooms across all properties
      for (const property of properties) {
        try {
          // Get rooms for this property (assuming we have a way to get rooms)
          // For now, we'll search by room number patterns
          const roomNumbers = generateRoomNumbers(property);
          
          for (const roomNumber of roomNumbers) {
            if (roomNumber.toLowerCase().includes(searchLower)) {
              // Check if this room has tenants
              const tenants = await tenantApiService.getTenantsByProperty(property.id);
              const roomTenants = tenants.filter(t => t.roomId === roomNumber);
              
              results.push({
                id: `${property.id}-${roomNumber}`,
                type: 'room',
                title: `Room ${roomNumber}`,
                subtitle: `${roomTenants.length} tenant(s) • ${property.name}`,
                propertyName: property.name,
                propertyId: property.id,
                data: { roomNumber, property, tenants: roomTenants }
              });
            }
          }
        } catch (error) {
          console.error('Error searching rooms for property:', property.id, error);
        }
      }

      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching:', error);
      Alert.alert('Search Error', 'Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Helper function to generate room numbers for search
  const generateRoomNumbers = (property: Property): string[] => {
    const roomNumbers: string[] = [];
    
    // Generate room numbers based on property type and total rooms
    for (let i = 1; i <= property.totalRooms; i++) {
      // Format room numbers (e.g., 101, 102, 201, 202, etc.)
      const floor = Math.floor((i - 1) / 10) + 1;
      const room = ((i - 1) % 10) + 1;
      roomNumbers.push(`${floor}${room.toString().padStart(2, '0')}`);
    }
    
    return roomNumbers;
  };

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchTenantsAndRooms(text);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSearchResultPress = (result: SearchResult) => {
    setShowSearchResults(false);
    setSearchQuery('');
    
    if (result.type === 'tenant') {
      // Navigate to tenant details with prefetched data
      navigation.navigate('TenantDetail', { tenantId: result.id, tenant: result.data });
    } else if (result.type === 'room') {
      // Navigate to room management or room details
      navigation.navigate('RoomManagement', { 
        propertyId: result.propertyId,
        roomNumber: result.data.roomNumber 
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
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
           <TouchableOpacity style={styles.notificationIcon} onPress={() => navigation.navigate('Notifications')}>
             <Icon name="notifications-outline" size={20} color={colors.white} />
           </TouchableOpacity>
         </View>
       </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Tenants, Rooms ..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
            onFocus={() => setShowSearchResults(true)}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Icon name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {showSearchResults && (
        <View style={styles.searchResultsContainer}>
          <View style={styles.searchResultsHeader}>
            <Text style={styles.searchResultsTitle}>
              {isSearching ? 'Searching...' : `Search Results (${searchResults.length})`}
            </Text>
            <TouchableOpacity onPress={() => setShowSearchResults(false)}>
              <Icon name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => handleSearchResultPress(item)}
                >
                  <View style={styles.searchResultIcon}>
                    <Icon 
                      name={item.type === 'tenant' ? 'person-outline' : 'home-outline'} 
                      size={24} 
                      color={colors.primary} 
                    />
                  </View>
                  <View style={styles.searchResultContent}>
                    <Text style={styles.searchResultTitle}>{item.title}</Text>
                    <Text style={styles.searchResultSubtitle}>{item.subtitle}</Text>
                    <Text style={styles.searchResultProperty}>{item.propertyName}</Text>
                  </View>
                  <Icon name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              style={styles.searchResultsList}
              showsVerticalScrollIndicator={false}
            />
          ) : !isSearching && searchQuery.length > 0 ? (
            <View style={styles.noSearchResults}>
              <Icon name="search-outline" size={48} color={colors.textMuted} />
              <Text style={styles.noSearchResultsText}>No results found</Text>
              <Text style={styles.noSearchResultsSubtext}>
                Try searching for tenant names, room numbers, or emails
              </Text>
            </View>
          ) : null}
        </View>
      )}

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
            snapToInterval={100 + dimensions.spacing.md}
            decelerationRate="fast"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            bounces={true}
            alwaysBounceHorizontal={true}
            pagingEnabled={false}
          >
            {/* Add Tenant */}
            <Animated.View
              style={{
                transform: [{
                  scale: scrollY.interpolate({
                    inputRange: [0, 100],
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
                <Icon name="person-add-outline" size={24} color={colors.primary} />
                <Text style={styles.actionLabel}>Add Tenant</Text>
              </TouchableOpacity>
            </Animated.View>
            
            {/* Applications */}
            <Animated.View
              style={{
                transform: [{
                  scale: scrollY.interpolate({
                    inputRange: [100, 200],
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
                <Icon name="document-text-outline" size={24} color={colors.primary} />
                <Text style={styles.actionLabel}>Applications</Text>
              </TouchableOpacity>
            </Animated.View>
            
            {/* Receive Payment */}
            <Animated.View
              style={{
                transform: [{
                  scale: scrollY.interpolate({
                    inputRange: [200, 300],
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
                <Icon name="card-outline" size={24} color={colors.primary} />
                <Text style={styles.actionLabel}>Receive Payment</Text>
              </TouchableOpacity>
            </Animated.View>
            
            {/* Add Dues */}
            <Animated.View
              style={{
                transform: [{
                  scale: scrollY.interpolate({
                    inputRange: [300, 400],
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
                <Icon name="wallet-outline" size={24} color={colors.primary} />
                <Text style={styles.actionLabel}>Add Dues</Text>
              </TouchableOpacity>
            </Animated.View>
            
            {/* Add Expense */}
            <Animated.View
              style={{
                transform: [{
                  scale: scrollY.interpolate({
                    inputRange: [400, 500],
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
                <Icon name="receipt-outline" size={24} color={colors.primary} />
                <Text style={styles.actionLabel}>Add Expense</Text>
              </TouchableOpacity>
            </Animated.View>
            
            {/* Send Announcement */}
            <Animated.View
              style={{
                transform: [{
                  scale: scrollY.interpolate({
                    inputRange: [500, 600],
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
                <Icon name="megaphone-outline" size={24} color={colors.primary} />
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
                          index * 100,
                          (index + 1) * 100,
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
    marginRight: dimensions.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
  clearButton: {
    padding: dimensions.spacing.xs,
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
    width: 100,
    minWidth: 100,
    backgroundColor: colors.white,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.lg,
    alignItems: 'center',
    marginRight: dimensions.spacing.md,
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
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
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
  // Search Results Styles
  searchResultsContainer: {
    backgroundColor: colors.white,
    marginHorizontal: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.lg,
    maxHeight: 400,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  searchResultsTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  searchResultsList: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  searchResultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.spacing.md,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  searchResultSubtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  searchResultProperty: {
    fontSize: fonts.xs,
    color: colors.textMuted,
  },
  noSearchResults: {
    padding: dimensions.spacing.xl,
    alignItems: 'center',
  },
  noSearchResultsText: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: dimensions.spacing.md,
    marginBottom: dimensions.spacing.sm,
  },
  noSearchResultsSubtext: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default OwnerDashboardScreen; 