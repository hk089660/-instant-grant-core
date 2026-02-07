import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextStyle } from 'react-native';
import { AppText } from './AppText';
import { adminTheme } from '../adminTheme';
import type { Role } from '../../types/ui';

interface DevRoleSwitcherProps {
  value: Role;
  onChange: (role: Role) => void;
}

const roles: Role[] = ['viewer', 'operator', 'admin'];

export const DevRoleSwitcher: React.FC<DevRoleSwitcherProps> = ({ value, onChange }) => {
  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <AppText variant="small" style={styles.label}>
        Dev Role
      </AppText>
      <View style={styles.buttons}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.button, value === role && styles.buttonActive]}
            onPress={() => onChange(role)}
          >
            <AppText
              variant="small"
              style={[styles.buttonText, value === role && styles.buttonTextActive] as unknown as TextStyle}
            >
              {role}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: adminTheme.spacing.md,
  },
  label: {
    color: adminTheme.colors.textTertiary,
    marginBottom: adminTheme.spacing.xs,
  },
  buttons: {
    flexDirection: 'row',
    gap: adminTheme.spacing.sm,
  },
  button: {
    paddingHorizontal: adminTheme.spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: adminTheme.colors.border,
    borderRadius: adminTheme.radius.sm,
  },
  buttonActive: {
    backgroundColor: adminTheme.colors.text,
  },
  buttonText: {
    color: adminTheme.colors.textSecondary,
  },
  buttonTextActive: {
    color: adminTheme.colors.background,
  },
});
