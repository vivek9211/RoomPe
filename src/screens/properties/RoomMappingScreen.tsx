import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { Property } from '../../types/property.types';
import { 
  RoomSharingType, 
  UnitType, 
  Floor, 
  FloorRoomConfig,
  CreateFloorData 
} from '../../types/room.types';

interface RoomMappingScreenProps {
  navigation: any;
  route: any;
}

const RoomMappingScreen: React.FC<RoomMappingScreenProps> = ({ navigation, route }) => {
  const { property } = route.params || {};
  const [totalFloors, setTotalFloors] = useState(1);
  const [floorInputValue, setFloorInputValue] = useState('1');
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (property) {
      // Load existing room mapping if available
      loadExistingRoomMapping();
    }
  }, [property]);

  const loadExistingRoomMapping = async () => {
    // TODO: Load existing room mapping from Firestore
    // For now, we'll start fresh
  };

  const handleTotalFloorsChange = (value: string) => {
    // Update the input value first
    setFloorInputValue(value);
    
    // Only update totalFloors if the input is valid
    if (value === '' || value === '0') {
      return; // Don't update totalFloors for empty or zero input
    }
    
    const floors = parseInt(value);
    if (!isNaN(floors) && floors > 0) {
      const validFloors = Math.max(1, Math.min(floors, 50)); // Limit to 50 floors
      setTotalFloors(validFloors);
    }
  };

  const handleFloorInputBlur = () => {
    // When input loses focus, ensure we have a valid value
    if (floorInputValue === '' || floorInputValue === '0') {
      setFloorInputValue('1');
      setTotalFloors(1);
    } else {
      const floors = parseInt(floorInputValue);
      if (isNaN(floors) || floors < 1) {
        setFloorInputValue('1');
        setTotalFloors(1);
      } else if (floors > 50) {
        setFloorInputValue('50');
        setTotalFloors(50);
      }
    }
  };

  const generateFloorConfigs = (): FloorRoomConfig[] => {
    const configs: FloorRoomConfig[] = [];
    
    for (let i = 0; i < totalFloors; i++) {
      const floorNumber = i;
      const floorName = i === 0 ? 'Ground Floor' : `${i}st Floor`;
      
      configs.push({
        floorId: `floor_${i}`,
        floorName,
        roomConfigs: {
          [RoomSharingType.SINGLE]: 0,
          [RoomSharingType.DOUBLE]: 0,
          [RoomSharingType.TRIPLE]: 0,
          [RoomSharingType.FOUR_SHARING]: 0,
          [RoomSharingType.FIVE_SHARING]: 0,
          [RoomSharingType.SIX_SHARING]: 0,
          [RoomSharingType.SEVEN_SHARING]: 0,
          [RoomSharingType.EIGHT_SHARING]: 0,
          [RoomSharingType.NINE_SHARING]: 0,
        },
        unitConfigs: {
          [UnitType.ROOM]: 0,
          [UnitType.RK]: 0,
          [UnitType.BHK]: 0,
          [UnitType.STUDIO_APARTMENT]: 0,
        },
      });
    }
    
    return configs;
  };

  const handleNext = () => {
    if (totalFloors < 1) {
      Alert.alert('Error', 'Please enter a valid number of floors');
      return;
    }

    const floorConfigs = generateFloorConfigs();
    navigation.navigate('FloorConfiguration', {
      property,
      totalFloors,
      floorConfigs,
    });
  };

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
        <Text style={styles.headerTitle}>Add Rooms in your property</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={styles.mainCard}>
          <Text style={styles.cardTitle}>Add Rooms in your property</Text>
          
          <View style={styles.questionSection}>
            <Text style={styles.questionText}>
              How many floors do you have in your property?
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.floorInput}
                placeholder="Total floors?"
                placeholderTextColor={colors.textMuted}
                value={floorInputValue}
                onChangeText={handleTotalFloorsChange}
                onBlur={handleFloorInputBlur}
                keyboardType="numeric"
                maxLength={2}
              />
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Text style={styles.illustrationIcon}>🏢</Text>
          </View>
        </View>

        {/* Property Info */}
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>{property.name}</Text>
          <Text style={styles.propertyAddress}>
            📍 {property.location?.address || 'Address not available'}
          </Text>
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
  mainCard: {
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
  cardTitle: {
    fontSize: fonts.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xl,
    textAlign: 'center',
  },
  questionSection: {
    marginBottom: dimensions.spacing.xl,
  },
  questionText: {
    fontSize: fonts.lg,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 2,
    borderColor: colors.lightGray,
    paddingHorizontal: dimensions.spacing.md,
    height: 56,
  },
  floorInput: {
    flex: 1,
    fontSize: fonts.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: fonts.xl,
    fontWeight: 'bold',
    color: colors.white,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: dimensions.spacing.lg,
  },
  illustrationIcon: {
    fontSize: 80,
  },
  propertyInfo: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
    alignItems: 'center',
  },
  propertyName: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  propertyAddress: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  title: {
    fontSize: fonts.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
});

export default RoomMappingScreen;
