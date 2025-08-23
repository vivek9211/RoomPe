// Dimension constants for RoomPe application
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const dimensions = {
  // Screen dimensions
  screenWidth: width,
  screenHeight: height,
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    round: 50,
  },
  
  // Button dimensions
  button: {
    height: 48,
    minWidth: 120,
    paddingHorizontal: 24,
  },
  
  // Input dimensions
  input: {
    height: 48,
    paddingHorizontal: 16,
  },
  
  // Icon sizes
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    xxl: 48,
    xxxl: 64,
  },
  
  // Header height
  headerHeight: 56,
  
  // Bottom tab height
  bottomTabHeight: 60,
};
