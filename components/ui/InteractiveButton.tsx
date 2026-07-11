import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface InteractiveButtonProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hapticFeedback?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function InteractiveButton({
  children,
  style,
  scaleTo = 0.95,
  hapticFeedback = true,
  onPressIn,
  onPressOut,
  onPress,
  ...props
}: InteractiveButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (e: import("react-native").GestureResponderEvent) => {
    scale.value = withSpring(scaleTo, {
      mass: 0.5,
      damping: 12,
      stiffness: 200,
    });
    if (hapticFeedback && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: import("react-native").GestureResponderEvent) => {
    scale.value = withSpring(1, {
      mass: 0.5,
      damping: 12,
      stiffness: 200,
    });
    if (onPressOut) onPressOut(e);
  };

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
