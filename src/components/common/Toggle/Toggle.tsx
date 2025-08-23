import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { colors, fonts, dimensions } from '../../../constants';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  leftLabel: string;
  rightLabel: string;
  disabled?: boolean;
  style?: any;
}

const Toggle: React.FC<ToggleProps> = ({
  value,
  onValueChange,
  leftLabel,
  rightLabel,
  disabled = false,
  style,
}) => {
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [value, translateX]);

  // Calculate proper dimensions to keep slider within container
  const containerPadding = dimensions.spacing.xl * 4; // Left and right padding
  const containerWidth = dimensions.screenWidth - containerPadding;
  const sliderMargin = 4; // Top and bottom margin
  const sliderWidth = (containerWidth - (sliderMargin * 2)) / 2; // Half width minus margins
  const maxTranslateX = sliderWidth;

  const sliderTranslateX = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [sliderMargin, sliderMargin + maxTranslateX],
  });

  return (
    <View style={[styles.container, style]}>
      
      <View style={[styles.toggleContainer, disabled && styles.disabled]}>
        {/* Background Labels */}
        <View style={styles.labelContainer}>
          <View style={styles.leftHalf}>
            <Text style={[
              styles.backgroundLabel,
              !value && styles.activeBackgroundLabel
            ]}>
              {leftLabel}
            </Text>
          </View>
          <View style={styles.rightHalf}>
            <Text style={[
              styles.backgroundLabel,
              value && styles.activeBackgroundLabel
            ]}>
              {rightLabel}
            </Text>
          </View>
        </View>
        
        {/* Sliding Button */}
        <Animated.View
          style={[
            styles.slider,
            {
              width: sliderWidth,
              transform: [{ translateX: sliderTranslateX }],
            },
          ]}
        />
        
        {/* Touchable Areas */}
        <TouchableOpacity
          style={[styles.touchArea, styles.leftTouchArea]}
          onPress={() => onValueChange(false)}
          activeOpacity={0.8}
          disabled={disabled}
        />
        <TouchableOpacity
          style={[styles.touchArea, styles.rightTouchArea]}
          onPress={() => onValueChange(true)}
          activeOpacity={0.8}
          disabled={disabled}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: dimensions.spacing.lg,
  },
  label: {
    fontSize: fonts.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
    textAlign: 'center',
  },
  toggleContainer: {
    height: 60,
    backgroundColor: colors.lightGray,
    borderRadius: dimensions.borderRadius.lg,
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: dimensions.spacing.xl,
  },
  disabled: {
    opacity: 0.6,
  },
  labelContainer: {
    flexDirection: 'row',
    height: '100%',
    zIndex: 1,
  },
  leftHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: dimensions.spacing.xs, // Push Tenant text slightly left
  },
  rightHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: dimensions.spacing.xs, // Push Owner text slightly right
  },
  backgroundLabel: {
    fontSize: fonts.md,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  activeBackgroundLabel: {
    color: colors.white,
  },
  slider: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    zIndex: 2,
  },
  leftTouchArea: {
    left: 0,
  },
  rightTouchArea: {
    right: 0,
  },
});

export default Toggle;
