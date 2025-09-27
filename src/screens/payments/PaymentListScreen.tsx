import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';
import { usePayments } from '../../hooks/usePayments';
import { useProperty } from '../../contexts/PropertyContext';
import { useAuth } from '../../contexts/AuthContext';
import { PaymentStatus } from '../../types/payment.types';
import { firestoreService } from '../../services/firestore';

// Local formatting functions
const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

const PaymentListScreen: React.FC = () => {
  const { user } = useAuth();
  const { selectedProperty: dashboardSelectedProperty } = useProperty();
  const { 
    loading, 
    payments, 
    pendingPayments, 
    syncPaymentStatus, 
    syncAllPayments,
    lastSyncResult 
  } = usePayments();
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [month, setMonth] = useState<string | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'tenants' | 'transactions'>('tenants');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);

  // Auto-select property from dashboard when available
  useEffect(() => {
    if (dashboardSelectedProperty) {
      setSelectedProperty(dashboardSelectedProperty.id);
    }
  }, [dashboardSelectedProperty]);

  // Load available properties when component mounts
  useEffect(() => {
    if (user) {
      loadAvailableProperties();
    }
  }, [user]);

  const loadAvailableProperties = async () => {
    try {
      if (user) {
        const properties = await firestoreService.getPropertiesByOwner(user.uid);
        setAvailableProperties(properties);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const handleRefresh = () => {
    setLastRefreshedAt(Date.now());
  };

  const filtered = useMemo(() => {
    let list = payments;
    if (filter !== 'all') {
      list = list.filter((p) => (p.status as unknown as string)?.toLowerCase() === filter);
    }
    if (roomId) {
      list = list.filter((p) => p.roomId === roomId);
    }
    if (month !== 'all') {
      list = list.filter((p) => p.month === month);
    }
    // Filter by selected property - only show payments for tenants in the selected property
    if (selectedProperty) {
      list = list.filter((p) => p.propertyId === selectedProperty);
    }
    return list;
  }, [payments, filter, roomId, month, selectedProperty]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    payments.forEach((p) => { if (p.month) set.add(p.month); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [payments]);

  const tenantSummaries = useMemo(() => {
    // Group filtered payments by tenant and month
    const byTenant = new Map<string, any>();
    const list = month === 'all' ? filtered : filtered.filter(p => p.month === month);
    list.forEach((p) => {
      const key = p.tenantId;
      const existing = byTenant.get(key);
      const pick = (x: any, y: any) => {
        // Priority: PAID > PENDING > OVERDUE > others
        const pr: Record<string, number> = { paid: 1, pending: 2, overdue: 3 } as any;
        const sx = pr[(x?.status as any)?.toLowerCase?.()] || 99;
        const sy = pr[(y?.status as any)?.toLowerCase?.()] || 99;
        return sx <= sy ? x : y;
      };
      if (!existing) {
        byTenant.set(key, { tenantId: p.tenantId, roomId: p.roomId, month: p.month, payment: p });
      } else {
        // Prefer current month's payment and better status
        const better = pick(existing.payment, p);
        byTenant.set(key, { tenantId: p.tenantId, roomId: p.roomId, month: p.month, payment: better });
      }
    });
    return Array.from(byTenant.values());
  }, [filtered, month]);

  const totals = useMemo(() => {
    const totalPaid = payments
      .filter((p) => p.status === PaymentStatus.PAID)
      .reduce((s, p) => s + (p.amount || 0), 0);
    const totalPending = payments
      .filter((p) => p.status === PaymentStatus.PENDING)
      .reduce((s, p) => s + (p.amount || 0), 0);
    const totalOverdue = payments
      .filter((p) => p.status === PaymentStatus.OVERDUE)
      .reduce((s, p) => s + (p.amount || 0), 0);
    return { totalPaid, totalPending, totalOverdue };
  }, [payments]);

  const handleSyncAllPayments = async () => {
    try {
      setSyncing(true);
      const result = await syncAllPayments();
      
      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Synced ${result.synced} payments. ${result.updated} payments were updated.${result.errors.length > 0 ? `\n\nErrors: ${result.errors.join(', ')}` : ''}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Sync Failed',
          `Failed to sync payments. Errors: ${result.errors.join(', ')}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Sync Error', error.message || 'Failed to sync payments');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return colors.success;
      case PaymentStatus.PENDING:
        return colors.warning;
      case PaymentStatus.OVERDUE:
        return colors.error;
      case PaymentStatus.FAILED:
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'Paid';
      case PaymentStatus.PENDING:
        return 'Pending';
      case PaymentStatus.OVERDUE:
        return 'Overdue';
      case PaymentStatus.FAILED:
        return 'Failed';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Payments</Text>
            </View>
          </View>

          {/* Property Filter */}
          <TouchableOpacity
            style={styles.propertyFilter}
            onPress={() => setShowPropertyPicker(true)}
          >
            <Text style={styles.propertyFilterIcon}>🏢</Text>
            <Text style={selectedProperty ? styles.propertyFilterText : styles.propertyFilterPlaceholder}>
              {selectedProperty 
                ? availableProperties.find(p => p.id === selectedProperty)?.name || 'Selected Property'
                : 'All Properties'
              }
            </Text>
            <Text style={styles.propertyFilterArrow}>▼</Text>
          </TouchableOpacity>

          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'tenants' && styles.tabButtonActive]}
              onPress={() => setActiveTab('tenants')}
            >
              <Text style={[styles.tabText, activeTab === 'tenants' && styles.tabTextActive]}>Tenants</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'transactions' && styles.tabButtonActive]}
              onPress={() => setActiveTab('transactions')}
            >
              <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>Transactions</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderLeftColor: colors.success }]}> 
              <Text style={styles.statLabel}>Paid</Text>
              <Text style={styles.statValue}>{formatCurrency(totals.totalPaid)}</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: colors.warning }]}> 
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>{formatCurrency(totals.totalPending)}</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: colors.error }]}> 
              <Text style={styles.statLabel}>Overdue</Text>
              <Text style={styles.statValue}>{formatCurrency(totals.totalOverdue)}</Text>
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filtersRow}>
            {(['all','paid','pending','overdue'] as const).map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.filterChip, filter === key && styles.filterChipActive]}
                onPress={() => setFilter(key)}
              >
                <Text style={[styles.filterChipText, filter === key && styles.filterChipTextActive]}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
            {/* Room and Month quick selectors (placeholder simple chips) */}
            <TouchableOpacity
              style={[styles.filterChip, month !== 'all' && styles.filterChipActive]}
              onPress={() => setMonth(month === 'all' ? (availableMonths[0] || 'all') : 'all')}
            >
              <Text style={[styles.filterChipText, month !== 'all' && styles.filterChipTextActive]}>
                {month === 'all' ? 'Month: All' : `Month: ${month}`}
              </Text>
            </TouchableOpacity>
          </View>

          {lastRefreshedAt ? (
            <Text style={styles.helper}>Last refreshed: {new Date(lastRefreshedAt).toLocaleString()}</Text>
          ) : null}

          {lastSyncResult && (
            <View style={styles.syncResult}>
              <Text style={styles.syncResultTitle}>Last Sync Result:</Text>
              <Text style={styles.syncResultText}>
                Synced: {lastSyncResult.synced} | Updated: {lastSyncResult.updated}
              </Text>
              {lastSyncResult.errors.length > 0 && (
                <Text style={styles.syncErrorText}>
                  Errors: {lastSyncResult.errors.join(', ')}
                </Text>
              )}
            </View>
          )}

          {/* Tenants Tab */}
          {activeTab === 'tenants' && tenantSummaries.length > 0 && (
            <View style={styles.paymentList}>
              <Text style={styles.sectionTitle}>Tenants</Text>
              {tenantSummaries.map((item) => (
                <View key={`${item.tenantId}`} style={styles.paymentItem}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentAmount}>{item.roomId ? `Room ${item.roomId}` : 'Room N/A'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.payment.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(item.payment.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentDescription}>{item.month}</Text>
                  <Text style={styles.paymentDate}>Amount: {formatCurrency(item.payment.amount)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && filtered.length > 0 && (
            <View style={styles.paymentList}>
              <Text style={styles.sectionTitle}>Transactions</Text>
              {filtered.map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(payment.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentDescription}>{payment.description || payment.month}</Text>
                  <Text style={styles.paymentDate}>
                    Due: {payment.dueDate.toDate().toLocaleDateString()}
                  </Text>
                  {payment.transactionId && (
                    <Text style={styles.transactionId}>
                      Transaction: {payment.transactionId}
                    </Text>
                  )}
                  {payment.status === PaymentStatus.PENDING && payment.transactionId && (
                    <TouchableOpacity 
                      style={styles.syncSingleButton}
                      onPress={() => syncPaymentStatus(payment.id)}
                    >
                      <Text style={styles.syncSingleButtonText}>Sync Status</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {pendingPayments.length > 0 && (
            <View style={styles.paymentList}>
              <Text style={styles.sectionTitle}>Pending Payments</Text>
              {pendingPayments.map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(payment.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentDescription}>{payment.description || payment.month}</Text>
                  <Text style={styles.paymentDate}>
                    Due: {payment.dueDate.toDate().toLocaleDateString()}
                  </Text>
                  {payment.transactionId && (
                    <Text style={styles.transactionId}>
                      Transaction: {payment.transactionId}
                    </Text>
                  )}
                  {payment.transactionId && (
                    <TouchableOpacity 
                      style={styles.syncSingleButton}
                      onPress={() => syncPaymentStatus(payment.id)}
                    >
                      <Text style={styles.syncSingleButtonText}>Sync Status</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {((activeTab === 'transactions' && filtered.length === 0) || (activeTab === 'tenants' && tenantSummaries.length === 0)) && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No payments found</Text>
              <Text style={styles.emptyStateSubtext}>
                Payments will appear here once they are created
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Property Picker Modal */}
      {showPropertyPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Properties</Text>
              <TouchableOpacity onPress={() => setShowPropertyPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {availableProperties.map((property) => (
                <TouchableOpacity
                  key={property.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedProperty(property.id);
                    setShowPropertyPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{property.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingTop: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.xl,
  },
  title: {
    fontSize: fonts.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  propertyFilter: {
    backgroundColor: colors.white,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginTop: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  propertyFilterIcon: {
    fontSize: 16,
    marginRight: dimensions.spacing.sm,
  },
  propertyFilterText: {
    fontSize: fonts.sm,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  propertyFilterPlaceholder: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  propertyFilterArrow: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: dimensions.spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.md,
    padding: 4,
    marginTop: dimensions.spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: dimensions.borderRadius.sm,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: dimensions.spacing.sm,
    marginTop: dimensions.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    borderLeftWidth: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statLabel: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: fonts.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: dimensions.spacing.sm,
    marginTop: dimensions.spacing.md,
  },
  filterChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: 6,
    borderRadius: 18,
  },
  filterChipActive: {
    backgroundColor: 'rgba(79,70,229,0.08)',
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
  helper: { 
    color: colors.textSecondary, 
    marginTop: dimensions.spacing.sm,
  },
  syncResult: {
    backgroundColor: colors.surface,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginTop: dimensions.spacing.md,
  },
  syncResultTitle: {
    fontSize: fonts.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  syncResultText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  syncErrorText: {
    fontSize: fonts.sm,
    color: colors.error,
    marginTop: dimensions.spacing.xs,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: dimensions.spacing.md,
    marginBottom: dimensions.spacing.md,
  },
  paymentList: {
    marginTop: dimensions.spacing.lg,
  },
  paymentItem: {
    backgroundColor: colors.white,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  paymentAmount: {
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
    fontSize: fonts.sm,
    fontWeight: '500',
    color: colors.white,
  },
  paymentDescription: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  paymentDate: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  transactionId: {
    fontSize: fonts.xs,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: dimensions.spacing.sm,
  },
  syncSingleButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  syncSingleButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: dimensions.spacing.xl,
  },
  emptyStateText: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: dimensions.spacing.lg,
    bottom: dimensions.spacing.lg + 56,
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  fabText: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    width: '90%',
    maxHeight: '70%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: dimensions.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalClose: {
    fontSize: fonts.xl,
    color: colors.textSecondary,
    padding: dimensions.spacing.sm,
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: dimensions.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalItemText: {
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
});

export default PaymentListScreen;
