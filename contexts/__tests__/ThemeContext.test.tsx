import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../ThemeContext';
import { Text, Button, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../../constants/colors';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(() => Promise.resolve(null)), // Start with no saved preference
}));

const TestComponent = () => {
  const { isDarkMode, toggleTheme, setTheme, colors } = useTheme();

  return (
    <View testID="theme-container" style={{ backgroundColor: colors.background }}>
      <Text testID="theme-status">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</Text>
      <Button testID="toggle-btn" title="Toggle" onPress={toggleTheme} />
      <Button testID="set-dark-btn" title="Set Dark" onPress={() => setTheme(true)} />
    </View>
  );
};

describe('ThemeContext TDD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default light theme', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Wait for the useEffect inside ThemeProvider to complete
    await waitFor(() => {
      expect(getByTestId('theme-status').props.children).toBe('Light Mode');
    });

    // Check if correct colors are applied (lightColors)
    expect(getByTestId('theme-container').props.style.backgroundColor).toBe(lightColors.background);
  });

  it('should toggle theme when toggleTheme is called', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId('theme-status').props.children).toBe('Light Mode');
    });

    fireEvent.press(getByTestId('toggle-btn'));

    await waitFor(() => {
      expect(getByTestId('theme-status').props.children).toBe('Dark Mode');
      expect(getByTestId('theme-container').props.style.backgroundColor).toBe(darkColors.background);
    });

    // Verify AsyncStorage was called to save the preference
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_theme', 'dark');
  });

  it('should set explicit theme when setTheme is called', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId('theme-status').props.children).toBe('Light Mode');
    });

    fireEvent.press(getByTestId('set-dark-btn'));

    await waitFor(() => {
      expect(getByTestId('theme-status').props.children).toBe('Dark Mode');
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_theme', 'dark');
  });
});
