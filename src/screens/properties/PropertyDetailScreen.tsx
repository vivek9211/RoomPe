import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { Property } from '../../types/property.types';

interface PropertyDetailScreenProps {
  navigation: any;
  route: any;
}

const PropertyDetailScreen: React.FC<PropertyDetailScreenProps> = ({ navigation, route }) => {
  const { property } = route.params || {};

  if (!property) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Property Not Found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleEditProperty = () => {
    navigation.navigate('EditProperty', { property });
  };

  const handleRoomMapping = () => {
    navigation.navigate('RoomMapping', { property });
  };

  const handleRoomManagement = () => {
    navigation.navigate('RoomManagement', { property });
  };

  const handleViewTenants = () => {
    // TODO: Navigate to tenants list for this property
    Alert.alert('Info', 'Tenant management feature coming soon!');
  };

  const handleViewPayments = () => {
    // TODO: Navigate to payments for this property
    Alert.alert('Info', 'Payment management feature coming soon!');
  };

  const handleViewMaintenance = () => {
    // TODO: Navigate to maintenance for this property
    Alert.alert('Info', 'Maintenance management feature coming soon!');
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
        <Text style={styles.headerTitle}>Property Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Property Info Card */}
        <View style={styles.propertyCard}>
          <Text style={styles.propertyName}>{property.name}</Text>
          <Text style={styles.propertyAddress}>
            📍 {property.location?.address || 'Address not available'}
          </Text>
          
          <View style={styles.propertyStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Type</Text>
              <Text style={styles.statValue}>{property.type}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={styles.statValue}>{property.status}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Rooms</Text>
              <Text style={styles.statValue}>{property.totalRooms || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Available</Text>
              <Text style={styles.statValue}>{property.availableRooms || 0}</Text>
            </View>
          </View>

          {property.pricing && (
            <View style={styles.pricingSection}>
              <Text style={styles.sectionTitle}>Pricing</Text>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Base Rent:</Text>
                <Text style={styles.pricingValue}>₹{property.pricing.baseRent || 0}/month</Text>
              </View>
              <View style={styles.pricingRow}>
                <Text style={styles.pricingLabel}>Deposit:</Text>
                <Text style={styles.pricingValue}>₹{property.pricing.deposit || 0}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleRoomManagement}
            >
              <Text style={styles.actionButtonText}>🏠 Room Management</Text>
              <Text style={styles.actionButtonSubtext}>Manage rooms, beds & tenants</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleRoomMapping}
            >
              <Text style={styles.actionButtonText}>🗺️ Room Mapping</Text>
              <Text style={styles.actionButtonSubtext}>Configure floor & room layout</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.infoButton]}
              onPress={handleViewTenants}
            >
              <Text style={styles.actionButtonText}>👥 Tenants</Text>
              <Text style={styles.actionButtonSubtext}>View & manage tenants</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.successButton]}
              onPress={handleViewPayments}
            >
              <Text style={styles.actionButtonText}>💰 Payments</Text>
              <Text style={styles.actionButtonSubtext}>Track rent & payments</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.warningButton]}
              onPress={handleViewMaintenance}
            >
              <Text style={styles.actionButtonText}>🔧 Maintenance</Text>
              <Text style={styles.actionButtonSubtext}>Handle maintenance requests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEditProperty}
            >
              <Text style={styles.actionButtonText}>✏️ Edit Property</Text>
              <Text style={styles.actionButtonSubtext}>Modify property details</Text>
            </TouchableOpacity>
          </View>
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
  propertyName: {
    fontSize: fonts.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
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
  pricingSection: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: dimensions.spacing.md,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
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
    marginBottom: dimensions.spacing.xl,
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
});

export default PropertyDetailScreen;
