import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AppText, Button, Card } from '../../ui/components';
import { theme } from '../../ui/theme';
import { schoolRoutes } from '../../lib/schoolRoutes';
import { useEventIdFromParams } from '../../hooks/useEventIdFromParams';
import { extractEventIdFromQrPayload } from '../../lib/scanEventId';

export const UserScanScreen: React.FC = () => {
  const router = useRouter();
  const { eventId: targetEventId } = useEventIdFromParams({ defaultValue: 'evt-001' });
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedEventId, setScannedEventId] = useState<string | null>(targetEventId);
  const [scanLocked, setScanLocked] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetEventId) return;
    setScannedEventId((current) => current ?? targetEventId);
  }, [targetEventId]);

  const activeEventId = useMemo(() => scannedEventId ?? targetEventId ?? null, [scannedEventId, targetEventId]);
  const hasPermission = permission?.granted === true;
  const permissionBlocked = permission?.granted === false && permission?.canAskAgain === false;

  const handleBarcodeScanned = useCallback(
    (result: { data?: string }) => {
      if (scanLocked) return;
      setScanLocked(true);

      const detected = extractEventIdFromQrPayload(result.data);
      if (!detected) {
        setScanError('QRからeventIdを取得できませんでした。もう一度読み取ってください。');
        return;
      }

      setScannedEventId(detected);
      setScanError(null);
    },
    [scanLocked]
  );

  const handleRequestPermission = useCallback(async () => {
    if (permissionBlocked && Platform.OS !== 'web') {
      await Linking.openSettings().catch(() => {});
      return;
    }
    await requestPermission();
  }, [permissionBlocked, requestPermission]);

  const handleResetScan = useCallback(() => {
    setScanLocked(false);
    setScanError(null);
    setScannedEventId(targetEventId ?? null);
  }, [targetEventId]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <AppText variant="h2" style={styles.title}>
          QRを読み取る
        </AppText>
        <AppText variant="caption" style={styles.subtitle}>
          受付のQRを読み取ってください
        </AppText>

        <Card style={styles.cameraCard}>
          {!hasPermission ? (
            <View style={styles.permissionBox}>
              <AppText variant="caption" style={styles.cameraText}>
                {permissionBlocked
                  ? 'カメラ権限がオフです。設定から許可してください。'
                  : 'QR読み取りにはカメラ権限が必要です。'}
              </AppText>
              <Button
                title={permissionBlocked && Platform.OS !== 'web' ? '設定を開く' : 'カメラを許可'}
                size="medium"
                onPress={handleRequestPermission}
                style={styles.permissionButton}
              />
            </View>
          ) : (
            <View style={styles.cameraBox}>
              <CameraView
                style={styles.cameraView}
                facing="back"
                onBarcodeScanned={scanLocked ? undefined : handleBarcodeScanned}
              />
              <View pointerEvents="none" style={styles.overlay}>
                <View style={styles.scanFrame} />
              </View>
            </View>
          )}
        </Card>

        <AppText variant="caption" style={[styles.statusText, scanError ? styles.errorText : undefined]}>
          {scanError
            ? scanError
            : scanLocked
            ? `読み取り完了: ${activeEventId ?? 'eventId不明'}`
            : '枠内にQRを合わせると自動で読み取ります'}
        </AppText>

        <Button
          title={activeEventId ? `確認画面へ進む（${activeEventId}）` : 'QRを読み取ってください'}
          onPress={() => activeEventId && router.push(schoolRoutes.confirm(activeEventId) as any)}
          disabled={!activeEventId}
        />
        <Button
          title="もう一度読み取る"
          variant="secondary"
          onPress={handleResetScan}
          style={styles.secondaryButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  cameraCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  cameraBox: {
    height: 280,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray100,
  },
  cameraView: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 210,
    height: 210,
    borderWidth: 2,
    borderColor: theme.colors.white,
    borderRadius: theme.radius.md,
    backgroundColor: 'transparent',
  },
  permissionBox: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  cameraText: {
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: theme.spacing.md,
    minWidth: 160,
  },
  statusText: {
    marginBottom: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  errorText: {
    color: theme.colors.error,
  },
  secondaryButton: {
    marginTop: theme.spacing.sm,
  },
});
