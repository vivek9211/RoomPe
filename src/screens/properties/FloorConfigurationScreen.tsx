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

interface FloorConfigurationScreenProps {
  navigation: any;
  route: any;
}

const FloorConfigurationScreen: React.FC<FloorConfigurationScreenProps> = ({ navigation, route }) => {
  const { property, totalFloors, floorConfigs } = route.params || {};
  const [configs, setConfigs] = useState<FloorRoomConfig[]>(floorConfigs || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (floorConfigs) {
      setConfigs(floorConfigs);
    }
  }, [floorConfigs]);

  const updateRoomConfig = (floorIndex: number, sharingType: RoomSharingType, count: number) => {
    const newConfigs = [...configs];
    newConfigs[floorIndex].roomConfigs[sharingType] = Math.max(0, count);
    setConfigs(newConfigs);
  };

  const updateUnitConfig = (floorIndex: number, unitType: UnitType, count: number) => {
    const newConfigs = [...configs];
    newConfigs[floorIndex].unitConfigs[unitType] = Math.max(0, count);
    setConfigs(newConfigs);
  };

  const getTotalUnitsForFloor = (floorIndex: number): number => {
    const floor = configs[floorIndex];
    if (!floor) return 0;
    
    const roomCount = Object.values(floor.roomConfigs).reduce((sum, count) => sum + count, 0);
    const unitCount = Object.values(floor.unitConfigs).reduce((sum, count) => sum + count, 0);
    
    return roomCount + unitCount;
  };

  const getTotalUnits = (): number => {
    return configs.reduce((total, floor) => total + getTotalUnitsForFloor(configs.indexOf(floor)), 0);
  };

  const handleAddUnits = (floorIndex: number) => {
    navigation.navigate('FloorUnitConfiguration', {
      property,
      floorConfig: configs[floorIndex],
      floorIndex,
      onUpdate: (updatedConfig: FloorRoomConfig) => {
        const newConfigs = [...configs];
        newConfigs[floorIndex] = updatedConfig;
        setConfigs(newConfigs);
      },
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Save room mapping to Firestore
      Alert.alert('Success', 'Room mapping saved successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('RoomMappingComplete', { property }),
        },
      ]);
    } catch (error) {
      console.error('Error saving room mapping:', error);
      Alert.alert('Error', 'Failed to save room mapping');
    } finally {
      setLoading(false);
    }
  };

  if (!property || !configs.length) {
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
        <Text style={styles.headerTitle}>Add Multiple Rooms</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Property Overview */}
        <View style={styles.overviewSection}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewIcon}>🏢</Text>
            <View style={styles.overviewText}>
              <Text style={styles.overviewTitle}>Your Property at a Glance</Text>
              <Text style={styles.overviewSubtitle}>
                Easily add, view, and manage every floor and unit.
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>🏢</Text>
            <Text style={styles.summaryNumber}>{totalFloors}</Text>
            <Text style={styles.summaryLabel}>Total Floors</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>✅</Text>
            <Text style={styles.summaryNumber}>0</Text>
            <Text style={styles.summaryLabel}>Filled Floors</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>🔄</Text>
            <Text style={styles.summaryNumber}>{totalFloors}</Text>
            <Text style={styles.summaryLabel}>Vacant Floors</Text>
          </View>
        </View>

        {/* Floor List */}
        <View style={styles.floorList}>
          {configs.map((floor, index) => (
            <View key={floor.floorId} style={styles.floorCard}>
              <View style={styles.floorHeader}>
                <View style={styles.floorInfo}>
                  <View style={styles.radioButton}>
                    <View style={styles.radioInner} />
                  </View>
                  <Text style={styles.floorName}>{floor.floorName}</Text>
                </View>
                <Text style={styles.floorStatus}>
                  {getTotalUnitsForFloor(index) > 0 ? `${getTotalUnitsForFloor(index)} units` : 'No units added'}
                </Text>
              </View>

              <View style={styles.floorContent}>
                <View style={styles.floorIcon}>
                  <Text style={styles.houseIcon}>🏠</Text>
                </View>
                <TouchableOpacity
                  style={styles.addUnitsButton}
                  onPress={() => handleAddUnits(index)}
                >
                  <Text style={styles.addUnitsButtonText}>+ Add Units</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('RoomMappingComplete', { property })}
          >
            <Text style={styles.actionButtonIcon}>👆</Text>
            <Text style={styles.actionButtonText}>Go to Rooms</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // TODO: Add new floor functionality
              Alert.alert('Info', 'Add Floor functionality coming soon!');
            }}
          >
            <Text style={styles.actionButtonText}>Add Floor</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Room Mapping'}
          </Text>
        </TouchableOpacity>
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
  overviewSection: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewIcon: {
    fontSize: 32,
    marginRight: dimensions.spacing.md,
  },
  overviewText: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  overviewSubtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: dimensions.spacing.xs,
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: dimensions.spacing.sm,
  },
  summaryNumber: {
    fontSize: fonts.xl,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: dimensions.spacing.xs,
  },
  summaryLabel: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  floorList: {
    marginBottom: dimensions.spacing.xl,
  },
  floorCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  floorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.lightGray,
    marginRight: dimensions.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.transparent,
  },
  floorName: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  floorStatus: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
  },
  floorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floorIcon: {
    alignItems: 'center',
  },
  houseIcon: {
    fontSize: 40,
    color: colors.lightGray,
  },
  addUnitsButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.sm,
  },
  addUnitsButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: dimensions.spacing.xl,
  },
  actionButton: {
    backgroundColor: colors.white,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    flex: 1,
    marginHorizontal: dimensions.spacing.xs,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: dimensions.spacing.xs,
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontSize: fonts.md,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
    marginBottom: dimensions.spacing.xl,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: fonts.lg,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.7,
  },
});

export default FloorConfigurationScreen;
