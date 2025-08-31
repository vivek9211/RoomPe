import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  StatusBar,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { Tenant, TenantStatus } from '../../types/tenant.types';
import { useTenants } from '../../hooks/useTenants';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestore';

const TenantListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { 
    tenants, 
    loading, 
    error, 
    stats,
    getTenantsByProperty, 
    getTenantStats,
    clearError 
  } = useTenants();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TenantStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);

  // Load tenants when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadAvailableProperties();
        loadTenants();
        loadStats();
      }
    }, [user, selectedProperty])
  );

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

  const loadTenants = async () => {
    if (selectedProperty) {
      await getTenantsByProperty(selectedProperty);
    } else {
      // Clear tenants when no property is selected
      // TODO: Implement loading tenants for all user properties
    }
  };

  const loadStats = async () => {
    if (selectedProperty) {
      await getTenantStats(selectedProperty);
    } else {
      // Clear stats when no property is selected
      // TODO: Implement loading stats for all user properties
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadTenants(), loadStats()]);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    // Filter by status
    if (filterStatus !== 'all' && tenant.status !== filterStatus) {
      return false;
    }
    
    // Filter by search term (if we had user data, we could search by name/email)
    if (searchTerm && !tenant.userId.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

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

  const handleAddTenant = () => {
    navigation.navigate('AddTenant');
  };

  const handleTenantPress = (tenant: Tenant) => {
    navigation.navigate('TenantDetail', { tenantId: tenant.id });
  };

  const handleEditTenant = (tenant: Tenant) => {
    navigation.navigate('EditTenant', { tenantId: tenant.id });
  };

  const handleDeleteTenant = (tenant: Tenant) => {
    Alert.alert(
      'Delete Tenant',
      `Are you sure you want to delete this tenant? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete functionality
            Alert.alert('Success', 'Tenant deleted successfully');
          }
        },
      ]
    );
  };

  const renderTenantItem = ({ item }: { item: Tenant }) => (
    <TouchableOpacity 
      style={styles.tenantCard}
      onPress={() => handleTenantPress(item)}
    >
      <View style={styles.tenantHeader}>
        <View style={styles.tenantInfo}>
          <Text style={styles.tenantName}>Tenant #{item.userId.slice(-6)}</Text>
          <Text style={styles.tenantProperty}>Property: {item.propertyId.slice(-6)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.tenantDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Rent:</Text>
          <Text style={styles.detailValue}>₹{item.rent.toLocaleString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Deposit:</Text>
          <Text style={styles.detailValue}>₹{item.deposit.toLocaleString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Agreement:</Text>
          <Text style={styles.detailValue}>
            {item.agreementStart?.toDate?.().toLocaleDateString()} - {item.agreementEnd?.toDate?.().toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.tenantActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditTenant(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteTenant(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Tenant Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.totalTenants || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.activeTenants || 0}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.pendingTenants || 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats?.occupancyRate?.toFixed(1) || 0}%</Text>
          <Text style={styles.statLabel}>Occupancy</Text>
        </View>
      </View>
    </View>
  );

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity 
          style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterChipText, filterStatus === 'all' && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, filterStatus === TenantStatus.ACTIVE && styles.filterChipActive]}
          onPress={() => setFilterStatus(TenantStatus.ACTIVE)}
        >
          <Text style={[styles.filterChipText, filterStatus === TenantStatus.ACTIVE && styles.filterChipTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, filterStatus === TenantStatus.PENDING && styles.filterChipActive]}
          onPress={() => setFilterStatus(TenantStatus.PENDING)}
        >
          <Text style={[styles.filterChipText, filterStatus === TenantStatus.PENDING && styles.filterChipTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, filterStatus === TenantStatus.LEFT && styles.filterChipActive]}
          onPress={() => setFilterStatus(TenantStatus.LEFT)}
        >
          <Text style={[styles.filterChipText, filterStatus === TenantStatus.LEFT && styles.filterChipTextActive]}>
            Left
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
        <Text style={styles.headerTitle}>Tenants</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddTenant}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Property Selector */}
      <View style={styles.propertyContainer}>
        <Text style={styles.propertyLabel}>Select Property</Text>
        <TouchableOpacity
          style={styles.propertyPicker}
          onPress={() => setShowPropertyPicker(true)}
        >
          <Text style={selectedProperty ? styles.propertyPickerText : styles.propertyPickerPlaceholder}>
            {selectedProperty 
              ? availableProperties.find(p => p.id === selectedProperty)?.name || 'Selected Property'
              : 'Choose a property to view tenants'
            }
          </Text>
          <Text style={styles.propertyPickerArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tenants..."
          placeholderTextColor={colors.textMuted}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Stats Card */}
      {stats && renderStatsCard()}

      {/* Filter Chips */}
      {renderFilterChips()}

      {/* Tenants List */}
      <FlatList
        data={filteredTenants}
        renderItem={renderTenantItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No Tenants Found</Text>
            <Text style={styles.emptySubtitle}>
              {loading ? 'Loading tenants...' : 'Add your first tenant to get started'}
            </Text>
            {!loading && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddTenant}>
                <Text style={styles.emptyButtonText}>Add Tenant</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={clearError}>
            <Text style={styles.errorButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Property Picker Modal */}
      {showPropertyPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Property</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: {
    fontSize: fonts.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
  },
  addButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
  },
  propertyContainer: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  propertyLabel: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  propertyPicker: {
    backgroundColor: colors.lightGray,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPickerText: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  propertyPickerPlaceholder: {
    fontSize: fonts.md,
    color: colors.textMuted,
  },
  propertyPickerArrow: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.white,
  },
  searchInput: {
    backgroundColor: colors.lightGray,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
  statsCard: {
    backgroundColor: colors.white,
    marginHorizontal: dimensions.spacing.lg,
    marginVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: fonts.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginTop: dimensions.spacing.xs,
  },
  filterContainer: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: 20,
    marginRight: dimensions.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  listContainer: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.lg,
  },
  tenantCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tenantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tenantProperty: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginTop: dimensions.spacing.xs,
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
  tenantDetails: {
    marginBottom: dimensions.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.xs,
  },
  detailLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fonts.sm,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  tenantActions: {
    flexDirection: 'row',
    gap: dimensions.spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  editButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: dimensions.spacing.lg,
  },
  emptyTitle: {
    fontSize: fonts.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  emptySubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: colors.error,
    marginHorizontal: dimensions.spacing.lg,
    marginVertical: dimensions.spacing.md,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: colors.white,
    fontSize: fonts.sm,
    flex: 1,
  },
  errorButton: {
    marginLeft: dimensions.spacing.md,
  },
  errorButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
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
    fontSize: fonts.lg,
    color: colors.textSecondary,
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalItemText: {
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
});

export default TenantListScreen;
