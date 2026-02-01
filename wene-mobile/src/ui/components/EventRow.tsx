import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { theme } from '../theme';

interface EventRowProps {
  title: string;
  datetime: string;
  host: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export const EventRow: React.FC<EventRowProps> = ({
  title,
  datetime,
  host,
  leftSlot,
  rightSlot,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity style={[styles.row, style]} onPress={onPress} disabled={!onPress}>
      {leftSlot ? <View style={styles.left}>{leftSlot}</View> : null}
      <View style={styles.body}>
        <AppText variant="bodyLarge">{title}</AppText>
        <AppText variant="caption">{datetime}</AppText>
        <AppText variant="caption">主催: {host}</AppText>
      </View>
      {rightSlot ? <View style={styles.right}>{rightSlot}</View> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  left: {
    marginRight: theme.spacing.sm,
  },
  body: {
    flex: 1,
  },
  right: {
    marginLeft: theme.spacing.sm,
  },
});
