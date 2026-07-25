/**
 * App.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Entry point for the Accessible Educational Audio Player.
 * Wraps the player in a SafeAreaView so content is never obscured by the
 * device notch, home indicator, or status bar.
 * 
 * AUDIO CONFIGURATION
 * Configures expo-av audio mode to support simultaneous hardware capture
 * and background playback for AI Teacher Mode.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { EducationalAudioPlayer } from './src/components/EducationalAudioPlayer';

export default function App() {
  useEffect(() => {
    // Configure audio mode for AI Teacher Mode
    // This enables simultaneous recording and playback with proper ducking
    async function configureAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('[App] Audio mode configured successfully');
      } catch (error) {
        console.error('[App] Audio mode configuration failed:', error);
      }
    }

    configureAudio();
  }, []);

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
