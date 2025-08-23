import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, dimensions } from '../../constants';
import { Button } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.navigate('Welcome');
    } catch (error: any) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome to RoomPe</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userInfoTitle}>User Information</Text>
          <Text style={styles.userInfoText}>Email: {user?.email}</Text>
          <Text style={styles.userInfoText}>Name: {user?.displayName || 'Not set'}</Text>
          <Text style={styles.userInfoText}>UID: {user?.uid}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            size="large"
            style={styles.signOutButton}
          />
        </View>
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
  },
  header: {
    marginBottom: dimensions.spacing.xxxl,
  },
  title: {
    fontSize: fonts.xxxl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: fonts.md,
    color: colors.textSecondary,
  },
  userInfo: {
    backgroundColor: colors.lightGray,
    padding: dimensions.spacing.lg,
    borderRadius: 12,
    marginBottom: dimensions.spacing.xl,
  },
  userInfoTitle: {
    fontSize: fonts.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  userInfoText: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.sm,
  },
  actions: {
    marginTop: 'auto',
    marginBottom: dimensions.spacing.xl,
  },
  signOutButton: {
    borderColor: colors.error,
  },
});

export default DashboardScreen;
