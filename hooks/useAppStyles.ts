import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors } from '@/constants/colors';

/**
 * A hook to optimize dynamic styles.
 * It memoizes the created stylesheet based on the current theme colors,
 * ensuring `StyleSheet.create` only runs when the theme actually changes,
 * preventing severe memory leaks and performance drops during renders.
 *
 * @param styleCreator A function that takes `ThemeColors` and returns a `StyleSheet` object.
 * @returns The generated stylesheet object.
 */
export function useAppStyles<T>(styleCreator: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => styleCreator(colors), [colors, styleCreator]);
}
