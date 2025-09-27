import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { Property } from '../../types/property.types';
import { TenantApplication, Tenant } from '../../types/tenant.types';
import { firestoreService } from '../../services/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { tenantApiService } from '../../services/api/tenantApi';

interface AssignedPropertyDetailScreenProps {
  navigation: any;
  route: any;
}

interface AssignedPropertyData {
  application: TenantApplication;
  property: Property;
  tenant?: Tenant;
}

const AssignedPropertyDetailScreen: React.FC<AssignedPropertyDetailScreenProps> = ({ navigation, route }) => {
  const { property, application } = route.params || {};
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [propertyData, setPropertyData] = useState<AssignedPropertyData | null>(null);
  const [roomInfo, setRoomInfo] = useState<any>(null);

  const loadRoomInfo = async (roomId: string) => {
    try {
      // Try to get room mapping first (now that we've added tenant permissions)
      try {
        const roomMapping = await firestoreService.getRoomMapping(property.id);
        if (roomMapping && roomMapping.floors) {
          // Search through floors to find the room
          for (const floor of roomMapping.floors) {
            if (floor.units) {
              for (const unit of floor.units) {
                if (unit.id === roomId) {
                  return {
                    roomNumber: unit.unitNumber,
                    roomType: unit.unitType,
                    floorName: floor.floorName,
                    capacity: unit.capacity,
                    sharingType: unit.sharingType
                  };
                }
              }
            }
          }
        }
      } catch (mappingError) {
        console.log('Room mapping not accessible, using fallback approach');
      }
      
      // Fallback approach if room mapping is not accessible
      // Try to parse room number from roomId (assuming format like "room_101" or "101")
      let roomNumber = roomId;
      if (roomId.includes('_')) {
        roomNumber = roomId.split('_').pop() || roomId;
      }
      
      // Try to determine room type from property type or use default
      const propertyType = propertyData?.property?.type || 'flat';
      let roomType = 'Room';
      if (propertyType === 'flat' || propertyType === 'apartment') {
        roomType = 'Flat';
      } else if (propertyType === 'pg') {
        roomType = 'Room';
      }
      
      return {
        roomNumber: roomNumber,
        roomType: roomType,
        floorName: 'Ground Floor', // Default - could be enhanced
        capacity: 1, // Default - could be enhanced
        sharingType: 'Single' // Default - could be enhanced
      };
    } catch (error) {
      console.error('Error loading room info:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadPropertyData = async () => {
      if (property && application && user) {
        setLoading(true);
        try {
          // Fetch tenant data for the current user
          const tenantData = await tenantApiService.getTenantByUserId(user.uid);
          setPropertyData({ 
            property, 
            application, 
            tenant: tenantData 
          });

          // Load room information if tenant has roomId
          if (tenantData?.roomId) {
            const room = await loadRoomInfo(tenantData.roomId);
            setRoomInfo(room);
          }
        } catch (error) {
          console.error('Error loading tenant data:', error);
          // Fallback to property data without tenant info
          setPropertyData({ property, application });
        } finally {
          setLoading(false);
        }
      } else if (property && application) {
        setPropertyData({ property, application });
      }
    };

    loadPropertyData();
  }, [property, application, user]);

  if (!propertyData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Property Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading property details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (timestamp: any) => {
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
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRoomType = (roomType: string) => {
    switch (roomType?.toLowerCase()) {
      case 'room':
        return 'Room';
      case 'flat':
        return 'Flat';
      case 'rk':
        return 'RK';
      case '1bhk':
        return '1 BHK';
      case '2bhk':
        return '2 BHK';
      case '3bhk':
        return '3 BHK';
      default:
        return roomType || 'Room';
    }
  };

  const handlePayDeposit = () => {
    if (propertyData.tenant?.depositPaid) {
      Alert.alert(
        'Deposit Already Paid',
        'Your security deposit has already been paid.',
        [{ text: 'OK' }]
      );
      return;
    }

    navigation.navigate('DepositPayment', {
      property: propertyData.property,
      tenant: propertyData.tenant,
    });
  };

  const handleContactOwner = () => {
    Alert.alert(
      'Contact Owner',
      'Contact information feature coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handleViewDocuments = () => {
    Alert.alert(
      'Documents',
      'Property documents and agreements will be available here.',
      [{ text: 'OK' }]
    );
  };

  const handleReportIssue = () => {
    navigation.navigate('AddMaintenance', { property: propertyData.property });
  };

  const handleViewPayments = () => {
    navigation.navigate('Payments');
  };

  const handleViewMaintenance = () => {
    navigation.navigate('MaintenanceList');
  };

  const handleCheckIn = () => {
    Alert.alert(
      'Digital Check-In',
      'Complete your digital check-in process to get your room keys!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Check-In', style: 'default' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Property</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Property Info Card */}
        <View style={styles.propertyCard}>
          <View style={styles.propertyHeader}>
            <Text style={styles.propertyName}>{propertyData.property.name}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Approved</Text>
            </View>
          </View>
          
          <Text style={styles.propertyAddress}>
            📍 {propertyData.property.location?.address || 'Address not available'}
          </Text>
          
          <View style={styles.propertyStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Property Type</Text>
              <Text style={styles.statValue}>{propertyData.property.type}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Application Status</Text>
              <Text style={styles.statValue}>Approved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Move-in Date</Text>
              <Text style={styles.statValue}>
                {formatDate(propertyData.application.requestedMoveInDate)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Application Date</Text>
              <Text style={styles.statValue}>
                {formatDate(propertyData.application.createdAt)}
              </Text>
            </View>
          </View>

          {/* Room Details */}
          <View style={styles.roomSection}>
            <Text style={styles.sectionTitle}>Assigned Room</Text>
            
            {roomInfo ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Room Type:</Text>
                  <Text style={styles.detailValue}>{formatRoomType(roomInfo.roomType)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Room Number:</Text>
                  <Text style={styles.detailValue}>{roomInfo.roomNumber}</Text>
                </View>
                
                {roomInfo.floorName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Floor:</Text>
                    <Text style={styles.detailValue}>{roomInfo.floorName}</Text>
                  </View>
                )}
                
                {roomInfo.capacity && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Capacity:</Text>
                    <Text style={styles.detailValue}>{roomInfo.capacity} person{roomInfo.capacity > 1 ? 's' : ''}</Text>
                  </View>
                )}
                
                {roomInfo.sharingType && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Sharing:</Text>
                    <Text style={styles.detailValue}>{roomInfo.sharingType}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Room Assignment:</Text>
                <Text style={styles.detailValue}>Pending</Text>
              </View>
            )}
          </View>

          {/* Property Pricing */}
          {propertyData.property.pricing && (
            <View style={styles.pricingSection}>
              <Text style={styles.sectionTitle}>Property Pricing</Text>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Tenant Rent:</Text>
                <Text style={styles.pricingValue}>
                  ₹{propertyData.tenant?.rent || propertyData.property.pricing.baseRent || 0}/month
                </Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Tenant Deposit:</Text>
                <Text style={styles.pricingValue}>
                  ₹{propertyData.tenant?.deposit || propertyData.property.pricing.deposit || 0}
                </Text>
              </View>
              {propertyData.property.pricing.utilities && (
                <View style={styles.pricingRow}>
                  <Text style={styles.pricingLabel}>Utilities:</Text>
                  <Text style={styles.pricingValue}>₹{propertyData.property.pricing.utilities}/month</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleCheckIn}
            >
              <Text style={styles.actionButtonText}>🔑 Digital Check-In</Text>
              <Text style={styles.actionButtonSubtext}>Complete check-in process</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.successButton]}
              onPress={handleViewPayments}
            >
              <Text style={styles.actionButtonText}>💰 Payments</Text>
              <Text style={styles.actionButtonSubtext}>View rent & payments</Text>
            </TouchableOpacity>
            
            {!propertyData.tenant?.depositPaid && (
              <TouchableOpacity
                style={[styles.actionButton, styles.warningButton]}
                onPress={handlePayDeposit}
              >
                <Text style={styles.actionButtonText}>💳 Pay Deposit</Text>
                <Text style={styles.actionButtonSubtext}>Pay security deposit</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, styles.infoButton]}
              onPress={handleReportIssue}
            >
              <Text style={styles.actionButtonText}>🔧 Report Issue</Text>
              <Text style={styles.actionButtonSubtext}>Report maintenance issues</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleViewMaintenance}
            >
              <Text style={styles.actionButtonText}>📋 Maintenance</Text>
              <Text style={styles.actionButtonSubtext}>View maintenance history</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleContactOwner}
            >
              <Text style={styles.actionButtonText}>📞 Contact Owner</Text>
              <Text style={styles.actionButtonSubtext}>Get in touch with owner</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.grayButton]}
              onPress={handleViewDocuments}
            >
              <Text style={styles.actionButtonText}>📄 Documents</Text>
              <Text style={styles.actionButtonSubtext}>View agreements & docs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Property Amenities */}
        {propertyData.property.amenities && propertyData.property.amenities.length > 0 && (
          <View style={styles.amenitiesCard}>
            <Text style={styles.sectionTitle}>Available Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {propertyData.property.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <Text style={styles.amenityText}>✓ {amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Property Rules */}
        {propertyData.property.rules && propertyData.property.rules.length > 0 && (
          <View style={styles.rulesCard}>
            <Text style={styles.sectionTitle}>Property Rules</Text>
            <View style={styles.rulesList}>
              {propertyData.property.rules.map((rule, index) => (
                <View key={index} style={styles.ruleItem}>
                  <Text style={styles.ruleText}>• {rule}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
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
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    height: 56,
  },
  backButton: {
    marginRight: dimensions.spacing.md,
  },
  backIcon: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginTop: dimensions.spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  propertyCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xl,
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  propertyName: {
    fontSize: fonts.xl,
    fontWeight: '700',
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
  propertyAddress: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.lg,
  },
  propertyStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.lg,
  },
  statItem: {
    width: '48%',
    marginBottom: dimensions.spacing.md,
  },
  statLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  roomSection: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: dimensions.spacing.md,
    marginBottom: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.sm,
  },
  detailLabel: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fonts.md,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  pricingSection: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: dimensions.spacing.md,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.sm,
  },
  pricingLabel: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  pricingValue: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionsCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: colors.primary,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.md,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  infoButton: {
    backgroundColor: colors.info,
  },
  successButton: {
    backgroundColor: colors.success,
  },
  warningButton: {
    backgroundColor: colors.warning,
  },
  editButton: {
    backgroundColor: colors.gray,
  },
  grayButton: {
    backgroundColor: colors.gray,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionButtonSubtext: {
    color: colors.white,
    fontSize: fonts.xs,
    textAlign: 'center',
    opacity: 0.9,
  },
  amenitiesCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    width: '50%',
    marginBottom: dimensions.spacing.sm,
  },
  amenityText: {
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
  rulesCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rulesList: {
    marginBottom: dimensions.spacing.md,
  },
  ruleItem: {
    marginBottom: dimensions.spacing.sm,
  },
  ruleText: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});

export default AssignedPropertyDetailScreen;
