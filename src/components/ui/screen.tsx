import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@/theme/tokens';
import { useAppTheme } from '@/theme/use-app-theme';

interface ScreenProps {
  scroll?: boolean;
  contentStyle?: ViewStyle;
  includeBottomInset?: boolean;
}

export function Screen({
  children,
  scroll = false,
  contentStyle,
  includeBottomInset = false,
}: PropsWithChildren<ScreenProps>) {
  const { colors } = useAppTheme();
  const content = [styles.content, contentStyle];

  return (
    <SafeAreaView
      edges={includeBottomInset ? ['top', 'bottom'] : ['top']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={content}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 120 },
});
