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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { 
  Complaint, 
  ComplaintStatus, 
  ComplaintPriority, 
  ComplaintCategory 
} from '../../types/complaint.types';
import { useComplaints } from '../../hooks/useComplaints';

interface ComplaintDetailScreenProps {
  navigation: any;
  route: any;
}

const ComplaintDetailScreen: React.FC<ComplaintDetailScreenProps> = ({ navigation, route }) => {
  const { complaintId, complaint: complaintFromParams } = route.params || {};
  const { complaint, getComplaintById, loading, error } = useComplaints();
  
  const [complaintData, setComplaintData] = useState<Complaint | null>(complaintFromParams || null);

  useEffect(() => {
    if (complaintFromParams) {
      setComplaintData(complaintFromParams);
    } else if (complaintId) {
      loadComplaintDetails();
    }
  }, [complaintId, complaintFromParams]);

  useEffect(() => {
    if (complaint) {
      setComplaintData(complaint);
    }
  }, [complaint]);

  const loadComplaintDetails = async () => {
    if (complaintId) {
      await getComplaintById(complaintId);
    }
  };

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
    const categoryColors = {
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
    return categoryColors[category] || '#A9A9A9';
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format relative time
  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(timestamp);
  };

  if (loading && !complaintData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading complaint details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!complaintData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Complaint Not Found</Text>
          <Text style={styles.errorSubtitle}>The complaint you're looking for doesn't exist or has been deleted.</Text>
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
        <Text style={styles.headerTitle}>Complaint Details</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status and Priority */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Status & Priority</Text>
            <Text style={styles.complaintId}>#{complaintData.id.slice(-8)}</Text>
          </View>
          <View style={styles.badgesContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaintData.status) }]}>
              <Text style={styles.statusText}>
                {complaintData.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(complaintData.priority) }]}>
              <Text style={styles.priorityText}>
                {complaintData.priority.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.categoryChip, { backgroundColor: getCategoryColor(complaintData.category) }]}>
              <Text style={styles.categoryText}>
                {complaintData.category.charAt(0).toUpperCase() + complaintData.category.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Complaint Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Complaint Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Title:</Text>
              <Text style={styles.infoValue}>{complaintData.title}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>
                {complaintData.type.charAt(0).toUpperCase() + complaintData.type.slice(1)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoValue}>{formatDate(complaintData.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoValue}>{formatRelativeTime(complaintData.updatedAt)}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{complaintData.description}</Text>
          </View>
        </View>

        {/* Staff Assignment */}
        {complaintData.assignedTo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Staff</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Assigned To:</Text>
                <Text style={styles.infoValue}>
                  {complaintData.staff?.staffName || 'Staff Member'}
                </Text>
              </View>
              {complaintData.staff?.staffPhone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{complaintData.staff.staffPhone}</Text>
                </View>
              )}
              {complaintData.staff?.staffEmail && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{complaintData.staff.staffEmail}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Resolution */}
        {complaintData.resolution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolution</Text>
            <View style={styles.resolutionCard}>
              <Text style={styles.resolutionText}>{complaintData.resolution}</Text>
              {complaintData.resolvedAt && (
                <Text style={styles.resolutionDate}>
                  Resolved on {formatDate(complaintData.resolvedAt)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        {complaintData.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{complaintData.notes}</Text>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Complaint Created</Text>
                <Text style={styles.timelineDate}>{formatDate(complaintData.createdAt)}</Text>
              </View>
            </View>
            
            {complaintData.assignedTo && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: colors.warning }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Assigned to Staff</Text>
                  <Text style={styles.timelineDate}>
                    {complaintData.staff?.staffName || 'Staff Member'}
                  </Text>
                </View>
              </View>
            )}
            
            {complaintData.resolvedAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Resolved</Text>
                  <Text style={styles.timelineDate}>{formatDate(complaintData.resolvedAt)}</Text>
                </View>
              </View>
            )}
            
            {complaintData.closedAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: colors.textMuted }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Closed</Text>
                  <Text style={styles.timelineDate}>{formatDate(complaintData.closedAt)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        {complaintData.status === ComplaintStatus.OPEN && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Add More Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
                <Text style={[styles.actionButtonText, styles.secondaryActionText]}>Cancel Complaint</Text>
              </TouchableOpacity>
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
  complaintId: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dimensions.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: 20,
  },
  statusText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: 20,
  },
  priorityText: {
    color: colors.white,
    fontSize: fonts.sm,
    fontWeight: '600',
  },
  categoryChip: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: 20,
  },
  categoryText: {
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
  descriptionCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionText: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  resolutionCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resolutionText: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: dimensions.spacing.sm,
  },
  resolutionDate: {
    fontSize: fonts.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  notesCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesText: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  timelineCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: dimensions.spacing.lg,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: dimensions.spacing.md,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  timelineDate: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  secondaryAction: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
  },
  secondaryActionText: {
    color: colors.primary,
  },
});

export default ComplaintDetailScreen;

