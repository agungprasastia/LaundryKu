import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from '@/constants/colors';

interface ThemeContextType {
  isDarkMode: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  colors: lightColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(systemColorScheme === 'dark');

  useEffect(() => {
    // Load theme from storage
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('app_theme');
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === 'dark');
        } else {
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (e) {
        console.error('Failed to load theme preference:', e);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await AsyncStorage.setItem('app_theme', newTheme ? 'dark' : 'light');
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  };

  const setTheme = async (isDark: boolean) => {
    setIsDarkMode(isDark);
    try {
      await AsyncStorage.setItem('app_theme', isDark ? 'dark' : 'light');
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
