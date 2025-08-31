import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, dimensions as appDimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestore';
import { TenantApplication, TenantApplicationStatus } from '../../types/tenant.types';
import { User } from '../../types/user.types';
import { Property } from '../../types/property.types';

const { width: screenWidth } = Dimensions.get('window');

interface TenantApplicationsScreenProps {
  navigation: any;
  route?: any;
}

interface ApplicationWithDetails extends TenantApplication {
  tenantDetails?: User;
  propertyDetails?: Property;
}

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

const TenantApplicationsScreen: React.FC<TenantApplicationsScreenProps> = ({ navigation, route }) => {
  const { userProfile } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('pending');

  useEffect(() => {
    if (userProfile?.uid) {
      loadTenantApplications();
      
      // Set up real-time listener for all tenant applications (not just pending)
      const unsubscribe = firestoreService.onAllTenantApplicationsChange(
        userProfile.uid,
        async (firebaseApplications) => {
          const applicationsWithDetails = await Promise.all(
            firebaseApplications.map(async (app: any) => {
              try {
                const [tenantDetails, propertyDetails] = await Promise.all([
                  firestoreService.getUserProfile(app.tenantId),
                  firestoreService.getPropertyById(app.propertyId),
                ]);
                
                return {
                  ...app,
                  tenantDetails,
                  propertyDetails,
                };
              } catch (error) {
                console.error('Error fetching application details:', error);
                return app;
              }
            })
          );
          
          setApplications(applicationsWithDetails);
        }
      );
      
      return () => unsubscribe();
    }
  }, [userProfile?.uid]);

  useEffect(() => {
    filterApplications();
  }, [applications, activeFilter]);

  const filterApplications = () => {
    if (activeFilter === 'all') {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(applications.filter(app => app.status === activeFilter));
    }
  };

  const loadTenantApplications = async () => {
    try {
      setLoading(true);
      // Use the new method that gets all applications, not just pending ones
      const applicationsData = await firestoreService.getAllTenantApplicationsByOwner(userProfile!.uid);
      
      const applicationsWithDetails = await Promise.all(
        applicationsData.map(async (app: any) => {
          try {
            const [tenantDetails, propertyDetails] = await Promise.all([
              firestoreService.getUserProfile(app.tenantId),
              firestoreService.getPropertyById(app.propertyId),
            ]);
            
            return {
              ...app,
              tenantDetails,
              propertyDetails,
            };
          } catch (error) {
            console.error('Error fetching application details:', error);
            return app;
          }
        })
      );
      
      setApplications(applicationsWithDetails);
    } catch (error) {
      console.error('Error loading tenant applications:', error);
      Alert.alert('Error', 'Failed to load tenant applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      setProcessing(applicationId);
      
      const status = action === 'approve' ? TenantApplicationStatus.APPROVED : TenantApplicationStatus.REJECTED;
      const reviewNotes = action === 'approve' ? 'Application approved' : 'Application rejected';
      
      await firestoreService.updateTenantApplication(applicationId, {
        status,
        reviewNotes,
        reviewedBy: userProfile!.uid,
      });

      Alert.alert(
        'Success',
        `Application ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error updating application:', error);
      Alert.alert('Error', 'Failed to update application. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    Alert.alert(
      'Delete Application',
      'Are you sure you want to delete this application? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(applicationId);
              await firestoreService.deleteTenantApplication(applicationId);
              Alert.alert('Success', 'Application deleted successfully');
            } catch (error) {
              console.error('Error deleting application:', error);
              Alert.alert('Error', 'Failed to delete application. Please try again.');
            } finally {
              setProcessing(null);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAllApplications = async () => {
    const count = applications.length;
    if (count === 0) {
      Alert.alert('No Applications', 'There are no applications to delete.');
      return;
    }

    Alert.alert(
      'Delete All Applications',
      `Are you sure you want to delete all ${count} applications? This action cannot be undone and will clear the entire collection.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await firestoreService.deleteAllTenantApplicationsForOwner(userProfile!.uid);
              Alert.alert('Success', `All ${count} applications have been deleted successfully`);
              setApplications([]);
            } catch (error) {
              console.error('Error deleting all applications:', error);
              Alert.alert('Error', 'Failed to delete all applications. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'approved': return colors.success;
      case 'rejected': return colors.error;
      default: return colors.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'PENDING';
      case 'approved': return 'APPROVED';
      case 'rejected': return 'REJECTED';
      default: return 'UNKNOWN';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderFilterTab = (filter: FilterType, label: string, count: number) => (
    <TouchableOpacity
      style={[
        styles.filterTab,
        activeFilter === filter && styles.filterTabActive
      ]}
      onPress={() => setActiveFilter(filter)}
    >
      <Text style={[
        styles.filterTabText,
        activeFilter === filter && styles.filterTabTextActive
      ]}>
        {label}
      </Text>
      <View style={[
        styles.filterCount,
        activeFilter === filter && styles.filterCountActive
      ]}>
        <Text style={[
          styles.filterCountText,
          activeFilter === filter && styles.filterCountTextActive
        ]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderApplicationItem = ({ item }: { item: ApplicationWithDetails }) => (
    <View style={styles.applicationCard}>
      {/* Compact header */}
      <View style={styles.cardHeader}>
        <View style={styles.tenantInfo}>
          <View style={styles.tenantAvatar}>
            <Text style={styles.avatarText}>
              {getInitials(item.tenantDetails?.name || 'Unknown')}
            </Text>
          </View>
          <View style={styles.tenantDetails}>
            <Text style={styles.tenantName}>
              {item.tenantDetails?.name || 'Unknown Tenant'}
            </Text>
            <Text style={styles.tenantEmail}>
              {item.tenantDetails?.email || 'No email'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          {(item.status === 'approved' || item.status === 'rejected') && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteApplication(item.id)}
              disabled={processing === item.id}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Compact details */}
      <View style={styles.cardContent}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Property:</Text>
          <Text style={styles.detailValue}>
            {item.propertyDetails?.name || 'Unknown Property'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Applied:</Text>
          <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
        </View>

        {item.requestedRent && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rent:</Text>
            <Text style={styles.rentValue}>₹{item.requestedRent.toLocaleString()}/month</Text>
          </View>
        )}
      </View>

      {/* Action buttons - only show for pending applications */}
      {item.status === 'pending' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleApplicationAction(item.id, 'reject')}
            disabled={processing === item.id}
          >
            {processing === item.id ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.actionButtonText}>Reject</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApplicationAction(item.id, 'approve')}
            disabled={processing === item.id}
          >
            {processing === item.id ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.actionButtonText}>Approve</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const getFilterCounts = () => {
    const counts = {
      all: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
    };
    return counts;
  };

  const filterCounts = getFilterCounts();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
        translucent={false}
      />
      
             {/* Header */}
       <View style={styles.header}>
         <TouchableOpacity
           style={styles.backButton}
           onPress={() => navigation.goBack()}
         >
           <Text style={styles.backIcon}>‹</Text>
         </TouchableOpacity>
         <Text style={styles.headerTitle}>Tenant Applications</Text>
         <View style={styles.headerSpacer} />
       </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {renderFilterTab('all', 'All', filterCounts.all)}
        {renderFilterTab('pending', 'Pending', filterCounts.pending)}
        {renderFilterTab('approved', 'Approved', filterCounts.approved)}
        {renderFilterTab('rejected', 'Rejected', filterCounts.rejected)}
      </View>

      {/* Clear All Button - only show for Approved and Rejected sections */}
      {applications.length > 0 && (activeFilter === 'approved' || activeFilter === 'rejected') && (
        <View style={styles.clearAllContainer}>
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleDeleteAllApplications}
            disabled={loading}
          >
            <Text style={styles.clearAllButtonText}>🗑️ Clear All {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Applications</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredApplications}
          renderItem={renderApplicationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Applications</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'all' 
                  ? 'You don\'t have any tenant applications yet.'
                  : `No ${activeFilter} applications found.`
                }
              </Text>
            </View>
          }
        />
      )}
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
    paddingHorizontal: appDimensions.spacing.lg,
    paddingVertical: appDimensions.spacing.md,
    height: 56,
  },
  backButton: {
    padding: appDimensions.spacing.sm,
    marginRight: appDimensions.spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: appDimensions.spacing.md,
    paddingVertical: appDimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: appDimensions.spacing.sm,
    paddingHorizontal: appDimensions.spacing.sm,
    borderRadius: appDimensions.borderRadius.md,
    marginHorizontal: 2,
  },
  filterTabActive: {
    backgroundColor: colors.lightPrimary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginRight: 4,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  filterCount: {
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: colors.primary,
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterCountTextActive: {
    color: colors.white,
  },
  listContainer: {
    paddingHorizontal: appDimensions.spacing.md,
    paddingBottom: appDimensions.spacing.lg,
    paddingTop: appDimensions.spacing.md,
  },
  applicationCard: {
    backgroundColor: colors.white,
    borderRadius: appDimensions.borderRadius.md,
    marginBottom: appDimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: appDimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  tenantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tenantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: appDimensions.spacing.sm,
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  tenantDetails: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  tenantEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: appDimensions.spacing.sm,
    paddingVertical: 4,
  },
  statusText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appDimensions.spacing.sm,
  },
  deleteButton: {
    paddingHorizontal: appDimensions.spacing.md,
    paddingVertical: appDimensions.spacing.sm,
    borderRadius: appDimensions.borderRadius.sm,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  cardContent: {
    padding: appDimensions.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: appDimensions.spacing.sm,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  rentValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
    textAlign: 'right',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: appDimensions.spacing.md,
    paddingBottom: appDimensions.spacing.md,
    gap: appDimensions.spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: appDimensions.borderRadius.md,
    paddingVertical: appDimensions.spacing.sm,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: appDimensions.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: appDimensions.spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: appDimensions.spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: appDimensions.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearAllContainer: {
    paddingHorizontal: appDimensions.spacing.md,
    paddingVertical: appDimensions.spacing.sm,
    backgroundColor: colors.lightGray,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
  },
  clearAllButton: {
    backgroundColor: colors.error,
    borderRadius: appDimensions.borderRadius.md,
    paddingVertical: appDimensions.spacing.sm,
    alignItems: 'center',
  },
  clearAllButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TenantApplicationsScreen;
