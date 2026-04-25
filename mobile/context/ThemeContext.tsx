import React, { createContext, useContext, useMemo } from 'react';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

type Theme = {
  colors: typeof colors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  shadows: typeof shadows;
  isDark: true;
};

const theme: Theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  isDark: true,
};

const ThemeContext = createContext<Theme | null>(null);

export function DarkThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => theme, []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within DarkThemeProvider');
  return ctx;
}
