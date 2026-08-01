import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/use-app-theme';

import { AppText } from './app-text';
import { Button } from './button';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.state}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText color="muted">{label}</AppText>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  icon = 'wallet-outline',
}: {
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.state}>
      <Ionicons name={icon} size={42} color={colors.textMuted} />
      <AppText variant="heading">{title}</AppText>
      <AppText color="muted" style={styles.centered}>
        {message}
      </AppText>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.state}>
      <AppText variant="heading" color="expense">
        Couldn’t load data
      </AppText>
      <AppText color="muted" style={styles.centered}>
        {message}
      </AppText>
      {onRetry ? <Button onPress={onRetry}>Try again</Button> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: { padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  centered: { textAlign: 'center' },
});
