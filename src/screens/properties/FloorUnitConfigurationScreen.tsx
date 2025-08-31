import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { Property } from '../../types/property.types';
import { 
  RoomSharingType, 
  UnitType, 
  FloorRoomConfig 
} from '../../types/room.types';

interface FloorUnitConfigurationScreenProps {
  navigation: any;
  route: any;
}

const FloorUnitConfigurationScreen: React.FC<FloorUnitConfigurationScreenProps> = ({ navigation, route }) => {
  const { property, floorConfig, floorIndex, onUpdate } = route.params || {};
  const [config, setConfig] = useState<FloorRoomConfig>(floorConfig);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['room']));

  useEffect(() => {
    if (floorConfig) {
      setConfig(floorConfig);
    }
  }, [floorConfig]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateRoomCount = (sharingType: RoomSharingType, delta: number) => {
    const newConfig = { ...config };
    const currentCount = newConfig.roomConfigs[sharingType] || 0;
    newConfig.roomConfigs[sharingType] = Math.max(0, currentCount + delta);
    setConfig(newConfig);
  };

  const updateUnitCount = (unitType: UnitType, delta: number) => {
    const newConfig = { ...config };
    const currentCount = newConfig.unitConfigs[unitType] || 0;
    newConfig.unitConfigs[unitType] = Math.max(0, currentCount + delta);
    setConfig(newConfig);
  };

  const getTotalRooms = (): number => {
    return Object.values(config.roomConfigs).reduce((sum, count) => sum + count, 0);
  };

  const getTotalBeds = (): number => {
    let totalBeds = 0;
    Object.entries(config.roomConfigs).forEach(([sharingType, count]) => {
      const sharingNumber = parseInt(sharingType.replace(/\D/g, '')) || 1;
      totalBeds += count * sharingNumber;
    });
    return totalBeds;
  };

  const getTotalUnits = (): number => {
    return Object.values(config.unitConfigs).reduce((sum, count) => sum + count, 0);
  };

  const getTotalUnitBeds = (): number => {
    let totalBeds = 0;
    Object.entries(config.unitConfigs).forEach(([unitType, count]) => {
      let bedCount = 1;
      switch (unitType) {
        case UnitType.RK:
          bedCount = 1;
          break;
        case UnitType.BHK:
          bedCount = 2; // Default to 2 BHK
          break;
        case UnitType.STUDIO_APARTMENT:
          bedCount = 1;
          break;
        default:
          bedCount = 1;
      }
      totalBeds += count * bedCount;
    });
    return totalBeds;
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(config);
    }
    navigation.goBack();
  };

  const renderSharingSection = () => {
    const sharingTypes = [
      { type: RoomSharingType.SINGLE, label: 'Single Sharing' },
      { type: RoomSharingType.DOUBLE, label: 'Double Sharing' },
      { type: RoomSharingType.TRIPLE, label: '3 Sharing' },
      { type: RoomSharingType.FOUR_SHARING, label: '4 Sharing' },
      { type: RoomSharingType.FIVE_SHARING, label: '5 Sharing' },
      { type: RoomSharingType.SIX_SHARING, label: '6 Sharing' },
      { type: RoomSharingType.SEVEN_SHARING, label: '7 Sharing' },
      { type: RoomSharingType.EIGHT_SHARING, label: '8 Sharing' },
      { type: RoomSharingType.NINE_SHARING, label: '9 Sharing' },
    ];

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('room')}
        >
          <Text style={styles.sectionTitle}>Room</Text>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>
              {getTotalRooms()} Unit/ {getTotalBeds()} Bed
            </Text>
          </View>
          <Text style={styles.expandIcon}>
            {expandedSections.has('room') ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {expandedSections.has('room') && (
          <View style={styles.sectionContent}>
            {sharingTypes.map(({ type, label }) => (
              <View key={type} style={styles.sharingRow}>
                <Text style={styles.sharingLabel}>{label}</Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updateRoomCount(type, -1)}
                  >
                    <Text style={styles.counterButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>
                    {config.roomConfigs[type] || 0}
                  </Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updateRoomCount(type, 1)}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderUnitSection = (unitType: UnitType, label: string) => {
    const isExpanded = expandedSections.has(unitType);
    const count = config.unitConfigs[unitType] || 0;
    let bedCount = 1;
    
    switch (unitType) {
      case UnitType.RK:
        bedCount = 1;
        break;
      case UnitType.BHK:
        bedCount = 2;
        break;
      case UnitType.STUDIO_APARTMENT:
        bedCount = 1;
        break;
    }

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(unitType)}
        >
          <Text style={styles.sectionTitle}>{label}</Text>
          <View style={styles.sectionTag}>
            <Text style={styles.sectionTagText}>
              {count} Unit/ {count * bedCount} Bed
            </Text>
          </View>
          <Text style={styles.expandIcon}>
            {isExpanded ? '>' : '>'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.sharingRow}>
              <Text style={styles.sharingLabel}>{label} Units</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateUnitCount(unitType, -1)}
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{count}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateUnitCount(unitType, 1)}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (!property || !config) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Configuration Not Found</Text>
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
        <Text style={styles.headerTitle}>
          Add units to {config.floorName}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Room Section */}
        {renderSharingSection()}

        {/* RK Section */}
        {renderUnitSection(UnitType.RK, 'RK')}

        {/* BHK Section */}
        {renderUnitSection(UnitType.BHK, 'BHK')}

        {/* Studio Apartment Section */}
        {renderUnitSection(UnitType.STUDIO_APARTMENT, 'Studio Apartment')}

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Floor Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Rooms:</Text>
            <Text style={styles.summaryValue}>{getTotalRooms()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Units:</Text>
            <Text style={styles.summaryValue}>{getTotalUnits()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Beds:</Text>
            <Text style={styles.summaryValue}>{getTotalBeds() + getTotalUnitBeds()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.addUnitsButton}
          onPress={handleSave}
        >
          <Text style={styles.addUnitsButtonText}>Add Units</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100, // Space for bottom button
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dimensions.spacing.lg,
    backgroundColor: colors.lightGray,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  sectionTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
    marginHorizontal: dimensions.spacing.md,
  },
  sectionTagText: {
    fontSize: fonts.sm,
    color: colors.white,
    fontWeight: '500',
  },
  expandIcon: {
    fontSize: fonts.lg,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  sectionContent: {
    padding: dimensions.spacing.lg,
  },
  sharingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  sharingLabel: {
    fontSize: fonts.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: dimensions.spacing.sm,
  },
  counterButtonText: {
    fontSize: fonts.lg,
    fontWeight: 'bold',
    color: colors.white,
  },
  counterValue: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  summarySection: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xl,
  },
  summaryTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  summaryLabel: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.primary,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  addUnitsButton: {
    backgroundColor: colors.primary,
    paddingVertical: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  addUnitsButtonText: {
    color: colors.white,
    fontSize: fonts.lg,
    fontWeight: '600',
  },
});

export default FloorUnitConfigurationScreen;
