import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from './AppText';
import { adminTheme } from '../adminTheme';
import type { Role } from '../../types/ui';
import { roleLabel } from '../../types/ui';
import { DevRoleSwitcher } from './DevRoleSwitcher';

interface AdminShellProps {
  title: string;
  role: Role;
  onRoleChange?: (role: Role) => void;
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ title, role, onRoleChange, children }) => {
  const router = useRouter();
  const showCategories = role === 'admin';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h3" style={styles.logo}>
          we-ne Admin
        </AppText>
        <AppText variant="caption" style={styles.pageTitle}>
          {title}
        </AppText>
        <View style={styles.right}>
          <AppText variant="small" style={styles.role}>
            {roleLabel[role]}
          </AppText>
          <View style={styles.nav}>
            <TouchableOpacity onPress={() => router.push('/admin' as any)}>
              <AppText variant="caption" style={styles.navText}>
                Events
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/admin/participants' as any)}>
              <AppText variant="caption" style={styles.navText}>
                Participants
              </AppText>
            </TouchableOpacity>
            {showCategories ? (
              <TouchableOpacity onPress={() => router.push('/admin/categories' as any)}>
                <AppText variant="caption" style={styles.navText}>
                  Categories
                </AppText>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={() => router.push('/admin/login' as any)}>
              <AppText variant="caption" style={styles.navText}>
                Logout
              </AppText>
            </TouchableOpacity>
            {typeof __DEV__ !== 'undefined' && __DEV__ ? (
              <TouchableOpacity onPress={() => router.push('/dev/web3' as any)}>
                <AppText variant="caption" style={styles.navText}>
                  Web3 Smoke
                </AppText>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
      <View style={styles.content}>{children}</View>
      {onRoleChange ? (
        <View style={styles.dev}>
          <DevRoleSwitcher value={role} onChange={onRoleChange} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminTheme.colors.background,
  },
  header: {
    paddingHorizontal: adminTheme.spacing.lg,
    paddingTop: adminTheme.spacing.lg,
    paddingBottom: adminTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminTheme.colors.border,
    backgroundColor: adminTheme.colors.background,
  },
  logo: {
    color: adminTheme.colors.text,
  },
  pageTitle: {
    color: adminTheme.colors.textSecondary,
    marginTop: adminTheme.spacing.xs,
  },
  right: {
    marginTop: adminTheme.spacing.sm,
  },
  role: {
    color: adminTheme.colors.textTertiary,
    marginBottom: adminTheme.spacing.xs,
  },
  nav: {
    flexDirection: 'row',
    gap: adminTheme.spacing.md,
  },
  navText: {
    color: adminTheme.colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: adminTheme.spacing.lg,
  },
  dev: {
    paddingHorizontal: adminTheme.spacing.lg,
    paddingBottom: adminTheme.spacing.lg,
  },
});
