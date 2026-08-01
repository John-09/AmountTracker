import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: 'default' | 'muted' | 'primary' | 'credit' | 'expense' | 'inverse';
  weight?: TextStyle['fontWeight'];
}

export function AppText({
  children,
  variant = 'body',
  color = 'default',
  weight,
  style,
  ...props
}: PropsWithChildren<AppTextProps>) {
  const { colors } = useAppTheme();
  const colorValue = {
    default: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    credit: colors.credit,
    expense: colors.expense,
    inverse: colors.white,
  }[color];

  return (
    <Text
      {...props}
      style={[styles.base, variantStyles[variant], { color: colorValue }, weight ? { fontWeight: weight } : null, style]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
  },
});

const variantStyles = StyleSheet.create({
  display: { fontSize: 34, lineHeight: 41, fontWeight: '800', letterSpacing: -1 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '700' },
});
