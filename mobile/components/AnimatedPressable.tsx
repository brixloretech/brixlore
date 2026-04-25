import React from 'react';
import { Pressable, PressableProps, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { scales, animations } from '../constants/theme';

// Check if running in Expo Go
// Safe check for Expo Go - executionEnvironment may not be available in all versions
const isExpoGo = 
  Constants.executionEnvironment === 'storeClient' ||
  Constants.executionEnvironment === Constants.ExecutionEnvironment?.StoreClient ||
  !Constants.executionEnvironment;

// Conditionally import reanimated
let Animated: any;
let AnimatedPressable: any;
let useAnimatedStyle: any;
let useSharedValue: any;
let withSpring: any;
let withTiming: any;

if (!isExpoGo) {
  try {
    const Reanimated = require('react-native-reanimated');
    Animated = Reanimated.default;
    useAnimatedStyle = Reanimated.useAnimatedStyle;
    useSharedValue = Reanimated.useSharedValue;
    withSpring = Reanimated.withSpring;
    withTiming = Reanimated.withTiming;
    AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  } catch (e) {
    console.warn('react-native-reanimated not available, using fallback');
  }
}

type AnimatedPressableProps = PressableProps & {
  children: React.ReactNode;
  scaleOnPress?: boolean;
  scaleValue?: number;
};

// Fallback component for Expo Go (no animations)
function AnimatedPressableFallback({
  children,
  style,
  ...props
}: AnimatedPressableProps) {
  return (
    <Pressable style={style} {...props}>
      {children}
    </Pressable>
  );
}

// Animated component for development builds
function AnimatedPressableComponentAnimated({
  children,
  scaleOnPress = true,
  scaleValue = scales.pressed,
  style,
  ...props
}: AnimatedPressableProps) {
  if (!useSharedValue || !useAnimatedStyle || !AnimatedPressable) {
    return <AnimatedPressableFallback style={style} {...props}>{children}</AnimatedPressableFallback>;
  }

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    if (scaleOnPress && withSpring && withTiming) {
      scale.value = withSpring(scaleValue, {
        damping: 15,
        stiffness: 300,
      });
      opacity.value = withTiming(0.9, { duration: animations.fast });
    }
  };

  const handlePressOut = () => {
    if (scaleOnPress && withSpring && withTiming) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
      opacity.value = withTiming(1, { duration: animations.fast });
    }
  };

  return (
    <AnimatedPressable
      {...props}
      style={[style, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {children}
    </AnimatedPressable>
  );
}

// Export the appropriate component based on environment
export const AnimatedPressableComponent = isExpoGo
  ? AnimatedPressableFallback
  : AnimatedPressableComponentAnimated;
