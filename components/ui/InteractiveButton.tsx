import React, { useState } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, Platform, GestureResponderEvent } from 'react-native';
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

interface WebStyle extends ViewStyle {
  cursor?: 'pointer';
  outlineWidth?: number;
  outlineStyle?: 'solid' | 'dotted' | 'dashed';
  outlineColor?: string;
  outlineOffset?: number;
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
  const [isFocused, setIsFocused] = useState(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (e: GestureResponderEvent) => {
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

  const handlePressOut = (e: GestureResponderEvent) => {
    scale.value = withSpring(1, {
      mass: 0.5,
      damping: 12,
      stiffness: 200,
    });
    if (onPressOut) onPressOut(e);
  };

  const webFocusStyle: WebStyle = Platform.OS === 'web' && isFocused ? {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: '#2563EB',
    outlineOffset: 2,
  } : {};

  const webCursorStyle: WebStyle = Platform.OS === 'web' ? {
    cursor: 'pointer',
  } : {};

  return (
    <AnimatedPressable
      style={[
        webCursorStyle,
        style,
        animatedStyle,
        webFocusStyle,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      onFocus={(e) => {
        setIsFocused(true);
        if (props.onFocus) props.onFocus(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        if (props.onBlur) props.onBlur(e);
      }}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}


