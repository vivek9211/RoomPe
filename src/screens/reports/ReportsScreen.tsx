import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';

const ReportsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>View and generate reports</Text>
        
        <TouchableOpacity style={styles.reportButton}>
          <Text style={styles.reportButtonText}>Generate Report</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.xl,
    paddingTop: dimensions.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fonts.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xl,
  },
  reportButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  reportButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '500',
  },
});

export default ReportsScreen;
