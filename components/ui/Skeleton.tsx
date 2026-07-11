import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

export default function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  delay = 0,
}: SkeletonProps) {
  const { isDarkMode } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1, // Loop indefinitely
        true // Reverse
      )
    );
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const backgroundColor = isDarkMode ? '#334155' : '#E2E8F0'; // Slate-700 / Slate-200

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height: height as number,
          borderRadius,
          backgroundColor,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}
