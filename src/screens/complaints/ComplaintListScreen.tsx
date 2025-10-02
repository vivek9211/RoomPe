import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { 
  Complaint, 
  ComplaintStatus, 
  ComplaintPriority, 
  ComplaintCategory 
} from '../../types/complaint.types';
import { useComplaints } from '../../hooks/useComplaints';
import { useAuth } from '../../contexts/AuthContext';

interface ComplaintListScreenProps {
  navigation: any;
  route: any;
}

const ComplaintListScreen: React.FC<ComplaintListScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { 
    complaints, 
    loading, 
    error, 
    getComplaintsByTenant, 
    refreshComplaints,
    clearError 
  } = useComplaints();
  
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Load complaints when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        loadComplaints();
      }
    }, [user?.uid])
  );

  const loadComplaints = async () => {
    if (user?.uid) {
      await getComplaintsByTenant(user.uid);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshComplaints();
    setRefreshing(false);
  };

  const handleComplaintPress = (complaint: Complaint) => {
    navigation.navigate('ComplaintDetail', { complaintId: complaint.id, complaint });
  };

  const handleNewComplaint = () => {
    navigation.navigate('SubmitComplaint');
  };

  // Filter complaints based on selected filter
  const filteredComplaints = complaints.filter(complaint => {
    switch (filter) {
      case 'open':
        return complaint.status === ComplaintStatus.OPEN;
      case 'in_progress':
        return complaint.status === ComplaintStatus.IN_PROGRESS;
      case 'resolved':
        return complaint.status === ComplaintStatus.RESOLVED;
      case 'closed':
        return complaint.status === ComplaintStatus.CLOSED;
      default:
        return true;
    }
  });

  // Get status color
  const getStatusColor = (status: ComplaintStatus) => {
    const statusColors = {
      [ComplaintStatus.OPEN]: colors.warning,
      [ComplaintStatus.IN_PROGRESS]: colors.primary,
      [ComplaintStatus.RESOLVED]: colors.success,
      [ComplaintStatus.CLOSED]: colors.textMuted,
      [ComplaintStatus.CANCELLED]: colors.error,
      [ComplaintStatus.ESCALATED]: colors.error,
    };
    return statusColors[status] || colors.textSecondary;
  };

  // Get priority color
  const getPriorityColor = (priority: ComplaintPriority) => {
    const priorityColors = {
      [ComplaintPriority.LOW]: colors.success,
      [ComplaintPriority.MEDIUM]: colors.warning,
      [ComplaintPriority.HIGH]: colors.error,
      [ComplaintPriority.URGENT]: '#FF0000',
      [ComplaintPriority.CRITICAL]: '#8B0000',
    };
    return priorityColors[priority] || colors.warning;
  };

  // Get category color
  const getCategoryColor = (category: ComplaintCategory) => {
    const colors = {
      [ComplaintCategory.ELECTRICAL]: '#FF6B6B',
      [ComplaintCategory.PLUMBING]: '#4ECDC4',
      [ComplaintCategory.WATER]: '#45B7D1',
      [ComplaintCategory.CLEANING]: '#96CEB4',
      [ComplaintCategory.SECURITY]: '#FFEAA7',
      [ComplaintCategory.INTERNET]: '#DDA0DD',
      [ComplaintCategory.HVAC]: '#98D8C8',
      [ComplaintCategory.FURNITURE]: '#F7DC6F',
      [ComplaintCategory.STRUCTURAL]: '#BB8FCE',
      [ComplaintCategory.NOISE]: '#85C1E9',
      [ComplaintCategory.OTHER]: '#A9A9A9',
    };
    return colors[category] || '#A9A9A9';
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render complaint card
  const renderComplaintCard = (complaint: Complaint) => (
    <TouchableOpacity
      key={complaint.id}
      style={styles.complaintCard}
      onPress={() => handleComplaintPress(complaint)}
    >
      <View style={styles.complaintHeader}>
        <View style={styles.complaintTitleContainer}>
          <Text style={styles.complaintTitle} numberOfLines={2}>
            {complaint.title}
          </Text>
          <Text style={styles.complaintDate}>
            {formatDate(complaint.createdAt)}
          </Text>
        </View>
        <View style={styles.complaintBadges}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status) }]}>
            <Text style={styles.statusText}>
              {complaint.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(complaint.priority) }]}>
            <Text style={styles.priorityText}>
              {complaint.priority.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.complaintBody}>
        <Text style={styles.complaintDescription} numberOfLines={3}>
          {complaint.description}
        </Text>
        
        <View style={styles.complaintFooter}>
          <View style={[styles.categoryChip, { backgroundColor: getCategoryColor(complaint.category) }]}>
            <Text style={styles.categoryText}>
              {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}
            </Text>
          </View>
          
          {complaint.assignedTo && (
            <Text style={styles.assignedText}>
              Assigned to: {complaint.staff?.staffName || 'Staff'}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && complaints.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading complaints...</Text>
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
        <Text style={styles.headerTitle}>My Complaints</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterChip,
                filter === filterType && styles.filterChipActive
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text style={[
                styles.filterText,
                filter === filterType && styles.filterTextActive
              ]}>
                {filterType.charAt(0).toUpperCase() + filterType.slice(1).replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadComplaints}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {filteredComplaints.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No Complaints Yet' : `No ${filter.replace('_', ' ')} Complaints`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'Submit your first complaint to get started'
                : `No complaints with ${filter.replace('_', ' ')} status found`
              }
            </Text>
            {filter === 'all' && (
              <TouchableOpacity style={styles.submitFirstButton} onPress={handleNewComplaint}>
                <Text style={styles.submitFirstButtonText}>Submit Complaint</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.complaintsList}>
            {filteredComplaints.map(renderComplaintCard)}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleNewComplaint}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
  headerSpacer: {
    width: 32, // Same width as the back button to center the title
  },
  filtersContainer: {
    backgroundColor: colors.white,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  filterChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: 20,
    marginRight: dimensions.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fonts.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  errorContainer: {
    backgroundColor: colors.error,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginVertical: dimensions.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: colors.white,
    fontSize: fonts.sm,
    flex: 1,
  },
  retryButton: {
    marginLeft: dimensions.spacing.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
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
    fontSize: fonts.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: dimensions.spacing.lg,
    paddingHorizontal: dimensions.spacing.lg,
  },
  submitFirstButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  submitFirstButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
  },
  complaintsList: {
    paddingVertical: dimensions.spacing.md,
  },
  complaintCard: {
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
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: dimensions.spacing.sm,
  },
  complaintTitleContainer: {
    flex: 1,
    marginRight: dimensions.spacing.sm,
  },
  complaintTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  complaintDate: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  complaintBadges: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: dimensions.spacing.xs,
  },
  statusText: {
    color: colors.white,
    fontSize: fonts.xs,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    color: colors.white,
    fontSize: fonts.xs,
    fontWeight: '600',
  },
  complaintBody: {
    marginTop: dimensions.spacing.sm,
  },
  complaintDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: dimensions.spacing.sm,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: colors.white,
    fontSize: fonts.xs,
    fontWeight: '600',
  },
  assignedText: {
    fontSize: fonts.xs,
    color: colors.textMuted,
  },
  fab: {
    position: 'absolute',
    bottom: dimensions.spacing.xl,
    right: dimensions.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default ComplaintListScreen;

