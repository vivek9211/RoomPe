import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, dimensions } from '../constants';
import { Tenant } from '../types/tenant.types';

interface FloorWithTenants {
  id: string;
  floorNumber: number;
  floorName: string;
  totalUnits: number;
  filledUnits: number;
  vacantUnits: number;
  units: any[];
  tenantCount: number;
  occupancyRate: number;
  createdAt: any;
  updatedAt: any;
}

interface TenantStatisticsProps {
  floors: FloorWithTenants[];
  totalTenants: number;
}

interface TenantStatisticsProps {
  floors: FloorWithTenants[];
  totalTenants: number;
}

const TenantStatistics: React.FC<TenantStatisticsProps> = ({ floors, totalTenants }) => {
  const totalUnits = floors.reduce((sum, floor) => sum + floor.totalUnits, 0);
  const occupiedUnits = floors.reduce((sum, floor) => sum + floor.filledUnits, 0);
  const overallOccupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tenant Overview</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalTenants}</Text>
          <Text style={styles.statLabel}>Total Tenants</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{occupiedUnits}</Text>
          <Text style={styles.statLabel}>Occupied Units</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalUnits - occupiedUnits}</Text>
          <Text style={styles.statLabel}>Vacant Units</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Math.round(overallOccupancyRate)}%</Text>
          <Text style={styles.statLabel}>Occupancy Rate</Text>
        </View>
      </View>

      <View style={styles.floorBreakdown}>
        <Text style={styles.sectionTitle}>Floor-wise Breakdown</Text>
        {floors.map((floor) => (
          <View key={floor.id} style={styles.floorRow}>
            <Text style={styles.floorName}>{floor.floorName}</Text>
            <View style={styles.floorStats}>
              <Text style={styles.floorStatText}>
                {floor.tenantCount} tenants
              </Text>
              <Text style={styles.floorStatText}>
                {floor.filledUnits}/{floor.totalUnits} occupied
              </Text>
              <Text style={styles.floorStatText}>
                {Math.round(floor.occupancyRate)}% occupancy
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.backgroundLight,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.sm,
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  statNumber: {
    fontSize: fonts.xl,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: dimensions.spacing.xs,
  },
  statLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  floorBreakdown: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  floorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  floorName: {
    fontSize: fonts.md,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  floorStats: {
    alignItems: 'flex-end',
  },
  floorStatText: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
});

export default TenantStatistics;
