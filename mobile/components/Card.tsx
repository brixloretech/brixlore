import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows } from '../constants/theme';
import { AnimatedPressableComponent } from './AnimatedPressable';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  rounded?: keyof typeof borderRadius;
  noShadow?: boolean;
};

export function Card({ children, style, onPress, rounded = 'md', noShadow }: CardProps) {
  const cardStyle = [
    styles.card,
    { borderRadius: borderRadius[rounded] },
    !noShadow && shadows.card,
  ].filter(Boolean);

  if (onPress) {
    return (
      <AnimatedPressableComponent style={cardStyle} onPress={onPress}>
        {children}
      </AnimatedPressableComponent>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
});
