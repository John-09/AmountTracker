import { useColorScheme } from 'react-native';

import { darkColors, lightColors } from './tokens';

export function useAppTheme() {
  const scheme = useColorScheme();
  return {
    colors: scheme === 'dark' ? darkColors : lightColors,
    isDark: scheme === 'dark',
  };
}
