import React from 'react';
import { View, Image, StyleSheet, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, typography, shadows, spacing } from '../constants/theme';
import { AnimatedPressableComponent } from './AnimatedPressable';
import { AddToMyListButton } from './AddToMyListButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_ASPECT = 16 / 9;

export type VideoThumbnailItem = {
  id: string;
  title: string;
  subtitle?: string;
  thumbnailUri?: string;
};

type VideoThumbnailProps = {
  item: VideoThumbnailItem;
  onPress?: () => void;
};

export function VideoThumbnail({ item, onPress }: VideoThumbnailProps) {
  return (
    <AnimatedPressableComponent style={styles.wrapper} onPress={onPress}>
      <View style={styles.imageContainer}>
        {item.thumbnailUri ? (
          <Image source={{ uri: item.thumbnailUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="film-outline" size={48} color={colors.foreground} />
          </View>
        )}
        <View style={styles.overlay} />
        {/* Add to My List button */}
        <View style={styles.addButtonContainer}>
          <AddToMyListButton contentId={item.id} size="sm" />
        </View>
        <View style={styles.playIcon}>
          <Ionicons name="play" size={36} color={colors.foreground} />
        </View>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>
        ) : null}
      </View>
    </AnimatedPressableComponent>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    marginRight: 16,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH / CARD_ASPECT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    ...shadows.card,
    position: 'relative',
  },
  addButtonContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  playIcon: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.foreground,
  },
  subtitle: {
    ...typography.caption,
    color: colors.foreground,
    opacity: 0.85,
    marginTop: 2,
  },
});
