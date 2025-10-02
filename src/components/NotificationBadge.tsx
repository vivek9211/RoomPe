import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, dimensions } from '../constants';

interface NotificationBadgeProps {
  count: number;
  children: React.ReactNode;
  showZero?: boolean;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  count, 
  children, 
  showZero = false 
}) => {
  const shouldShowBadge = count > 0 || (showZero && count === 0);
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View style={styles.container}>
      {children}
      {shouldShowBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NotificationBadge;
