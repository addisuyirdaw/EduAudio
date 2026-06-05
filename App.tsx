/**
 * App.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Entry point for the Accessible Educational Audio Player.
 * Wraps the player in a SafeAreaView so content is never obscured by the
 * device notch, home indicator, or status bar.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { EducationalAudioPlayer } from './src/components/EducationalAudioPlayer';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <EducationalAudioPlayer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0B1E',
  },
});
