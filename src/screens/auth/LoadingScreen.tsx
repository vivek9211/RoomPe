import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginTop: dimensions.spacing.md,
  },
});

export default LoadingScreen; 