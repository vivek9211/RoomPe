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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestore';
import { TenantApplication, TenantApplicationStatus } from '../../types/tenant.types';
import { User } from '../../types/user.types';
import { Property } from '../../types/property.types';

interface TenantApplicationsScreenProps {
  navigation: any;
  route?: any;
}

interface ApplicationWithDetails extends TenantApplication {
  tenantDetails?: User;
  propertyDetails?: Property;
}

const TenantApplicationsScreen: React.FC<TenantApplicationsScreenProps> = ({ navigation, route }) => {
  const { userProfile } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.uid) {
      loadTenantApplications();
      
      // Set up real-time listener for tenant applications
      const unsubscribe = firestoreService.onTenantApplicationsChange(
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

  const loadTenantApplications = async () => {
    try {
      setLoading(true);
      const applicationsData = await firestoreService.getTenantApplicationsByOwner(userProfile!.uid);
      
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

  const renderApplicationItem = ({ item }: { item: ApplicationWithDetails }) => (
    <View style={styles.applicationCard}>
      <View style={styles.applicationHeader}>
        <Text style={styles.applicationTitle}>
          Application from {item.tenantDetails?.name || 'Unknown Tenant'}
        </Text>
        <Text style={styles.applicationDate}>
          {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown Date'}
        </Text>
      </View>

      <View style={styles.applicationDetails}>
        <Text style={styles.detailLabel}>Property:</Text>
        <Text style={styles.detailValue}>
          {item.propertyDetails?.name || 'Unknown Property'}
        </Text>

        <Text style={styles.detailLabel}>Tenant:</Text>
        <Text style={styles.detailValue}>
          {item.tenantDetails?.name || 'Unknown'} ({item.tenantDetails?.email || 'No email'})
        </Text>

        <Text style={styles.detailLabel}>Phone:</Text>
        <Text style={styles.detailValue}>
          {item.tenantDetails?.phone || 'No phone'}
        </Text>

        {item.message && (
          <>
            <Text style={styles.detailLabel}>Message:</Text>
            <Text style={styles.detailValue}>{item.message}</Text>
          </>
        )}

        {item.requestedRent && (
          <>
            <Text style={styles.detailLabel}>Requested Rent:</Text>
            <Text style={styles.detailValue}>₹{item.requestedRent} / month</Text>
          </>
        )}
      </View>

      <View style={styles.applicationActions}>
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
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
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
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      ) : (
        <>
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Pending Applications</Text>
            <Text style={styles.sectionSubtitle}>
              Review and manage tenant applications for your properties
            </Text>
          </View>

          <FlatList
            data={applications}
            renderItem={renderApplicationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No Applications</Text>
                <Text style={styles.emptySubtitle}>
                  You don't have any pending tenant applications at the moment.
                </Text>
              </View>
            }
          />
        </>
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
  content: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.xl,
  },
  applicationCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  applicationTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  applicationDate: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  applicationDetails: {
    marginBottom: dimensions.spacing.lg,
  },
  detailLabel: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  detailValue: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.md,
    lineHeight: 20,
  },
  applicationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: dimensions.spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: dimensions.borderRadius.md,
    paddingVertical: dimensions.spacing.md,
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
    fontSize: fonts.md,
    fontWeight: '600',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: dimensions.spacing.lg,
  },
  emptyTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  emptySubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default TenantApplicationsScreen;
