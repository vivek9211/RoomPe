import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, dimensions } from '../../../constants';

interface SocialButtonProps {
  title: string;
  onPress: () => void;
  provider: 'google' | 'facebook' | 'apple';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const SocialButton: React.FC<SocialButtonProps> = ({
  title,
  onPress,
  provider,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getProviderIcon = () => {
    switch (provider) {
      case 'google':
        return '🔍'; // Google icon emoji
      case 'facebook':
        return '📘'; // Facebook icon emoji
      case 'apple':
        return '🍎'; // Apple icon emoji
      default:
        return '';
    }
  };

  const getProviderStyle = () => {
    switch (provider) {
      case 'google':
        return styles.google;
      case 'facebook':
        return styles.facebook;
      case 'apple':
        return styles.apple;
      default:
        return {};
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getProviderStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={colors.textPrimary}
          size="small"
        />
      ) : (
        <>
          <Text style={styles.icon}>{getProviderIcon()}</Text>
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
    minHeight: 48,
  },
  google: {
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  facebook: {
    borderColor: '#1877F2',
    backgroundColor: '#1877F2',
  },
  apple: {
    borderColor: colors.black,
    backgroundColor: colors.black,
  },
  icon: {
    fontSize: fonts.lg,
    marginRight: dimensions.spacing.sm,
  },
  text: {
    fontSize: fonts.md,
    fontWeight: '500' as const,
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default SocialButton;
