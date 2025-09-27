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
  Modal,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { Tenant, TenantStatus } from '../../types/tenant.types';
import { Payment, PaymentStatus, PaymentType } from '../../types/payment.types';
import { useTenants } from '../../hooks/useTenants';
import { tenantApiService } from '../../services/api/tenantApi';
import { firestoreService } from '../../services/firestore';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

interface TenantDetailScreenProps {
  navigation: any;
  route: any;
}

const TenantDetailScreen: React.FC<TenantDetailScreenProps> = ({ navigation, route }) => {
  const { tenantId, tenant: tenantFromParams } = route.params || {};
  const { tenant: tenantFromHook, getTenantById, updateTenant, deleteTenant, loading, error, clearError } = useTenants();
  const { user } = useAuth();
  
  const [tenant, setTenant] = useState<Tenant | null>(tenantFromParams || null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [propertyDetails, setPropertyDetails] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [paymentsModalVisible, setPaymentsModalVisible] = useState<boolean>(false);

  useFocusEffect(
    React.useCallback(() => {
      const init = async () => {
        if (tenantFromParams) {
          setTenant(tenantFromParams);
          await loadRelatedDetails(tenantFromParams);
          if (tenantFromParams.id) {
            await loadPayments(tenantFromParams.id as any);
          }
          return;
        }
        if (tenantId) {
          await loadTenantDetails();
        }
      };
      init();
    }, [tenantId, tenantFromParams])
  );

  const loadTenantDetails = async () => {
    try {
      const data = await tenantApiService.getTenantById(tenantId);
      if (data) {
        setTenant(data);
        await loadRelatedDetails(data);
        await loadPayments(data.id);
      }
    } catch (error) {
      console.error('Error loading tenant details:', error);
    }
  };

  const loadRelatedDetails = async (tenantData: Tenant) => {
    try {
      // Load user profile
      if (tenantData.userId) {
        const user = await firestoreService.getUserProfile(tenantData.userId);
        setUserDetails(user);
      }
      // Load property details
      if (tenantData.propertyId) {
        const property = await firestoreService.getPropertyById(tenantData.propertyId);
        setPropertyDetails(property);
      }
    } catch (e) {
      console.error('Error loading related tenant details:', e);
    }
  };

  const loadPayments = async (tenantDocId: string) => {
    try {
      const snap = await firestore()
        .collection('payments')
        .where('tenantId', '==', tenantDocId)
        .get();

      const list: any[] = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (b.createdAt?.toDate?.()?.getTime?.() || 0) - (a.createdAt?.toDate?.()?.getTime?.() || 0));
      setPayments(list as Payment[]);
    } catch (e) {
      console.error('Error loading payments:', e);
      setPayments([]);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (paymentFilter === 'all') return true;
    const status = (p.status as any) as string;
    return status?.toLowerCase() === paymentFilter;
  });

  const renderPaymentsList = () => (
    <>
      <View style={styles.filtersRow}>
        {(['all','paid','pending','overdue'] as const).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterChip, paymentFilter === key && styles.filterChipActive]}
            onPress={() => setPaymentFilter(key)}
          >
            <Text style={[styles.filterChipText, paymentFilter === key && styles.filterChipTextActive]}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {filteredPayments.length === 0 ? (
        <Text style={{ color: colors.textSecondary }}>No payments found for this filter.</Text>
      ) : (
        filteredPayments.map((p) => (
          <View key={p.id} style={styles.paymentRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>{p.type === PaymentType.RENT ? `Rent - ${p.month}` : 'Deposit'}</Text>
              <Text style={styles.paymentSub}>Due: {p.dueDate?.toDate?.()?.toLocaleDateString?.() || '-'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.paymentAmountInline}>₹{p.amount.toLocaleString('en-IN')}</Text>
              <View style={[styles.smallBadge, { backgroundColor: p.status === PaymentStatus.PAID ? colors.success : (p.status === PaymentStatus.OVERDUE ? colors.error : colors.warning) }]}>
                <Text style={styles.smallBadgeText}>{(p.status as any)?.toLowerCase?.()}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </>
  );

  const getCurrentMonthPayment = (): Payment | undefined => {
    const currentMonth = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    const monthPayments = payments.filter((p) => p.type === PaymentType.RENT && p.month === (currentMonth as any));
    return monthPayments.find((p) => p.status === PaymentStatus.PAID) || monthPayments[0];
  };

  const getStatusColor = (status: TenantStatus) => {
    switch (status) {
      case TenantStatus.ACTIVE:
        return colors.success;
      case TenantStatus.PENDING:
        return colors.warning;
      case TenantStatus.INACTIVE:
        return colors.error;
      case TenantStatus.LEFT:
        return colors.textMuted;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: TenantStatus) => {
    switch (status) {
      case TenantStatus.ACTIVE:
        return 'Active';
      case TenantStatus.PENDING:
        return 'Pending';
      case TenantStatus.INACTIVE:
        return 'Inactive';
      case TenantStatus.LEFT:
        return 'Left';
      case TenantStatus.SUSPENDED:
        return 'Suspended';
      case TenantStatus.EVICTED:
        return 'Evicted';
      default:
        return status;
    }
  };

  const handleEditTenant = () => {
    navigation.navigate('EditTenant', { tenantId });
  };

  const handleDeleteTenant = () => {
    Alert.alert(
      'Delete Tenant',
      'Are you sure you want to delete this tenant? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTenant(tenantId);
              Alert.alert('Success', 'Tenant deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete tenant');
            }
          }
        },
      ]
    );
  };

  const handleStatusChange = (newStatus: TenantStatus) => {
    Alert.alert(
      'Change Status',
      `Are you sure you want to change the tenant status to ${getStatusText(newStatus)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Change',
          onPress: async () => {
            try {
              await updateTenant(tenantId, { status: newStatus });
              Alert.alert('Success', 'Tenant status updated successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update tenant status');
            }
          }
        },
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Not set';
    return timestamp.toDate?.().toLocaleDateString() || 'Invalid date';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  if (loading && !tenant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tenant details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!tenant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Tenant Not Found</Text>
          <Text style={styles.errorSubtitle}>The tenant you're looking for doesn't exist or has been deleted.</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Tenant Details</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Overview */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Payment Overview</Text>
          </View>
          <View style={styles.paymentGrid}>
            <View style={[styles.paymentCard, { borderLeftColor: colors.primary }]}>
              <Text style={styles.paymentLabel}>Monthly Rent</Text>
              <Text style={styles.paymentAmount}>₹{(tenant.rent || 0).toLocaleString('en-IN')}</Text>
              {(() => {
                const p = getCurrentMonthPayment();
                const status = p?.status || PaymentStatus.PENDING;
                const bg = status === PaymentStatus.PAID ? colors.success : (status === PaymentStatus.OVERDUE ? colors.error : colors.warning);
                const text = status === PaymentStatus.PAID ? 'Paid' : (status === PaymentStatus.OVERDUE ? 'Overdue' : 'Pending');
                return (
                  <View style={[styles.smallBadge, { backgroundColor: bg }]}>
                    <Text style={styles.smallBadgeText}>{text}</Text>
                  </View>
                );
              })()}
            </View>
            <View style={[styles.paymentCard, { borderLeftColor: colors.success }]}>
              <Text style={styles.paymentLabel}>Security Deposit</Text>
              <Text style={styles.paymentAmount}>₹{(tenant.deposit || 0).toLocaleString('en-IN')}</Text>
              <View style={[styles.smallBadge, { backgroundColor: tenant.depositPaid ? colors.success : colors.error }]}>
                <Text style={styles.smallBadgeText}>{tenant.depositPaid ? 'Paid' : 'Not Paid'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tenant:</Text>
              <Text style={styles.infoValue}>{userDetails?.name || 'Unknown Tenant'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Property:</Text>
              <Text style={styles.infoValue}>{propertyDetails?.name || 'Unknown Property'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Room:</Text>
              <Text style={styles.infoValue}>{tenant.roomId || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoValue}>{formatDate(tenant.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoValue}>{formatDate(tenant.updatedAt)}</Text>
            </View>
          </View>
        </View>

        {/* Financial Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Monthly Rent:</Text>
              <Text style={[styles.infoValue, styles.rentValue]}>{formatCurrency(tenant.rent)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Security Deposit:</Text>
              <Text style={styles.infoValue}>{formatCurrency(tenant.deposit)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Deposit Paid:</Text>
              <Text style={[styles.infoValue, tenant.depositPaid ? styles.successText : styles.errorText]}>
                {tenant.depositPaid ? 'Yes' : 'No'}
              </Text>
            </View>
            {tenant.depositPaidAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Deposit Paid On:</Text>
                <Text style={styles.infoValue}>{formatDate(tenant.depositPaidAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Agreement Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agreement Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Agreement Start:</Text>
              <Text style={styles.infoValue}>{formatDate(tenant.agreementStart)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Agreement End:</Text>
              <Text style={styles.infoValue}>{formatDate(tenant.agreementEnd)}</Text>
            </View>
            {tenant.agreementDetails && (
              <>
                {tenant.agreementDetails.agreementNumber && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Agreement Number:</Text>
                    <Text style={styles.infoValue}>{tenant.agreementDetails.agreementNumber}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Agreement Status:</Text>
                  <Text style={styles.infoValue}>{tenant.agreementDetails.agreementStatus}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Emergency Contact */}
        {tenant.emergencyContact && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{tenant.emergencyContact.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{tenant.emergencyContact.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Relationship:</Text>
                <Text style={styles.infoValue}>{tenant.emergencyContact.relationship}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Payments section - list only in modal */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Payments</Text>
            <TouchableOpacity
              onPress={() => setPaymentsModalVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.openButton}
            >
              <Text style={styles.openButtonText}>View All</Text>
              <Text style={styles.openButtonIcon}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes */}
        {tenant.metadata?.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.notesText}>{tenant.metadata.notes}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={handleEditTenant}>
              <Text style={styles.actionButtonText}>Edit Tenant</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.dangerAction]} onPress={handleDeleteTenant}>
              <Text style={styles.actionButtonText}>Delete Tenant</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Payments Modal */}
      <Modal
        transparent
        visible={paymentsModalVisible}
        animationType="slide"
        onRequestClose={() => setPaymentsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payments</Text>
              <TouchableOpacity
                onPress={() => setPaymentsModalVisible(false)}
                style={styles.openButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.openButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderPaymentsList()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Error Message */}
      {error && (
        <View style={styles.errorMessageContainer}>
          <Text style={styles.errorMessageText}>{error}</Text>
          <TouchableOpacity style={styles.errorMessageButton} onPress={clearError}>
            <Text style={styles.errorMessageButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: dimensions.spacing.lg,
  },
  errorTitle: {
    fontSize: fonts.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  errorSubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  errorButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
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
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
  },
  editButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  statusTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  statusText: {
    fontSize: fonts.xs,
    fontWeight: '600',
    color: colors.white,
  },
  statusActions: {
    flexDirection: 'row',
    gap: dimensions.spacing.sm,
  },
  paymentGrid: {
    flexDirection: 'row',
    gap: dimensions.spacing.sm,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    borderLeftWidth: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  paymentAmount: {
    fontSize: fonts.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
    marginBottom: 4,
  },
  smallBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  smallBadgeText: {
    color: colors.white,
    fontSize: fonts.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.md,
  },
  filterChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  paymentTitle: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  paymentSub: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paymentAmountInline: {
    fontSize: fonts.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  statusButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  section: {
    marginBottom: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.md,
  },
  linkButtonText: {
    color: colors.primary,
    fontSize: fonts.md,
    fontWeight: '600',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(79,70,229,0.06)',
  },
  openButtonText: {
    color: colors.primary,
    fontSize: fonts.sm,
    fontWeight: '700',
  },
  openButtonIcon: {
    color: colors.primary,
    fontSize: fonts.md,
    marginLeft: 6,
    marginTop: -1,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  infoLabel: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: fonts.md,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  rentValue: {
    color: colors.primary,
    fontWeight: '600',
  },
  successText: {
    color: colors.success,
  },
  errorText: {
    color: colors.error,
  },
  notesText: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: colors.primary,
  },
  dangerAction: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
  },
  errorMessageContainer: {
    backgroundColor: colors.error,
    marginHorizontal: dimensions.spacing.lg,
    marginVertical: dimensions.spacing.md,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorMessageText: {
    color: colors.white,
    fontSize: fonts.sm,
    flex: 1,
  },
  errorMessageButton: {
    marginLeft: dimensions.spacing.md,
  },
  errorMessageButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    padding: dimensions.spacing.lg,
    borderTopLeftRadius: dimensions.borderRadius.lg,
    borderTopRightRadius: dimensions.borderRadius.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.md,
  },
  modalTitle: {
    fontSize: fonts.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default TenantDetailScreen;
