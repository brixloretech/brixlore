import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_SAVE_INTERVAL = 5000; // Save every 5 seconds

export function useVideoProgress(videoId: string) {
  const [savedTime, setSavedTime] = useState(0);
  const [savedDuration, setSavedDuration] = useState(0);
  const lastSavedTimeRef = useRef(0);

  useEffect(() => {
    loadProgress();
  }, [videoId]);

  const loadProgress = async () => {
    try {
      const savedData = await AsyncStorage.getItem(`video_progress_${videoId}`);
      if (savedData) {
        const { time, totalDuration } = JSON.parse(savedData);
        // Only resume if less than 90% watched
        if (time > 0 && totalDuration > 0 && time / totalDuration < 0.9) {
          setSavedTime(time);
          setSavedDuration(totalDuration);
        }
      }
    } catch (err) {
      console.error('Failed to load video progress:', err);
    }
  };

  const saveProgress = async (time: number, totalDuration: number) => {
    try {
      await AsyncStorage.setItem(
        `video_progress_${videoId}`,
        JSON.stringify({ time, totalDuration, timestamp: Date.now() })
      );
      lastSavedTimeRef.current = time;
    } catch (err) {
      console.error('Failed to save video progress:', err);
    }
  };

  const shouldSaveProgress = (currentTime: number): boolean => {
    const timeSinceLastSave = currentTime - lastSavedTimeRef.current;
    return timeSinceLastSave >= PROGRESS_SAVE_INTERVAL / 1000;
  };

  const clearProgress = async () => {
    try {
      await AsyncStorage.removeItem(`video_progress_${videoId}`);
      setSavedTime(0);
      setSavedDuration(0);
    } catch (err) {
      console.error('Failed to clear video progress:', err);
    }
  };

  return {
    savedTime,
    savedDuration,
    saveProgress,
    shouldSaveProgress,
    clearProgress,
  };
}
