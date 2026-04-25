import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

type SectionCardProps = {
  icon: keyof typeof iconMap;
  title: string;
  onPress?: () => void;
};

const iconMap = {
  add: 'add-circle-outline',
  rate: 'star-outline',
} as const;

export function SectionCard({ icon, title, onPress }: SectionCardProps) {
  const ionicon = iconMap[icon];
  return (
    <Card rounded="lg" onPress={onPress}>
      <View style={styles.content}>
        <Ionicons name={ionicon as any} size={40} color={colors.foreground} />
        <Text style={styles.title}>{title}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.body,
    color: colors.foreground,
    marginTop: spacing.sm,
  },
});
