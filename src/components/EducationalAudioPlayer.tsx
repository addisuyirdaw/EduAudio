/**
 * EducationalAudioPlayer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Core mobile player screen layout for an educational assistant.
 * 
 * ACCESSIBILITY & CONTRAST DETAILS:
 * - Background: #0A0B1E (deep midnight navy)
 * - Accent Purple: #9D8BFF (bright lavender-purple, contrast ratio > 7:1 against background)
 * - Audio Container Background: #16162A (slightly lighter dark blue-grey)
 * - Grouped Header accessibilityLabel="Course: Introduction to Cognitive Psychology. Chapter 3: Memory and Learning by Doctor Sarah Chen"
 * - Live Region: accessibilityLiveRegion="assertive" for immediate status updates.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { RotateCcw, RotateCw, Play, Pause, Mic } from 'lucide-react-native';
import { useEducationalAudio } from '../hooks/useEducationalAudio';
import { Colors, Typography, Spacing, Radius, MIN_TOUCH_TARGET } from '../styles/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format milliseconds as "m:ss" */
function formatTime(ms: number): string {
  if (!ms || ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Compute progress percentage (0–1) safely */
function safeProgress(position: number, duration: number): number {
  if (!duration || duration <= 0) return 0;
  return Math.min(1, Math.max(0, position / duration));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * VisualizerBars
 * Renders a centered, stylized audio visualization placeholder graphic.
 */
const VisualizerBars: React.FC<{ isPlaying: boolean; progress: number }> = ({
  isPlaying,
  progress,
}) => {
  const BAR_COUNT = 24;
  const bars = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      // Create a wave shape (taller in the middle, shorter at edges)
      const distFromCenter = Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
      const baseHeight = 12 + (1 - distFromCenter) * 38;
      return Math.max(8, Math.min(50, baseHeight));
    });
  }, []);

  return (
    <View 
      style={styles.visualizerContainer}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden={true}
    >
      {bars.map((height, i) => {
        const barProgress = i / BAR_COUNT;
        const isPast = barProgress <= progress;
        return (
          <View
            key={i}
            style={[
              styles.visualizerBar,
              {
                height: isPlaying ? height * (0.8 + Math.random() * 0.4) : height,
                backgroundColor: isPast ? Colors.primary : Colors.surfaceElevated,
                opacity: isPast ? 1 : 0.6,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const EducationalAudioPlayer: React.FC = () => {
  const {
    isPlaying,
    isLoading,
    positionMs,
    durationMs,
    playbackSpeed,
    currentChunkIndex,
    currentChunkText,
    isAIListening,
    statusAnnouncement,
    togglePlayPause,
    skipBackward15,
    skipForward15,
    cyclePlaybackSpeed,
    toggleAI,
    seekTo,
  } = useEducationalAudio();

  const progress = safeProgress(positionMs, durationMs);

  // Formatted position and duration labels
  const positionLabel = formatTime(positionMs);
  const durationLabel = formatTime(durationMs || 372000); // 6:12 default fallback

  const handleProgressBarPress = (event: any) => {
    if (!durationMs) return;
    const { locationX } = event.nativeEvent;
    const BAR_WIDTH = SCREEN_WIDTH - 64; // width minus horizontal margins
    const ratio = Math.min(1, Math.max(0, locationX / BAR_WIDTH));
    seekTo(ratio * durationMs);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* ── ASSERTIVE LIVE REGION ──────────────────────────────────────────
          This invisible view uses accessibilityLiveRegion="assertive" to
          immediately announce status updates (such as paragraph transitions,
          playback speed cycles, and timeline skips) to screen readers.
      ──────────────────────────────────────────────────────────────────── */}
      <View
        accessibilityLiveRegion="assertive"
        accessible={false}
        importantForAccessibility="yes"
        style={styles.liveRegion}
      >
        <Text style={styles.liveRegionText}>{statusAnnouncement}</Text>
      </View>

      {/* ── UPPER SECTION (65% of screen height) ────────────────────────── */}
      <View style={styles.upperContent}>
        
        {/* ── HEADER SECTION ──────────────────────────────────────────────
            Grouped into a single accessibility node with the specific label.
        ────────────────────────────────────────────────────────────────── */}
        <View
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Course: Introduction to Cognitive Psychology. Chapter 3: Memory and Learning by Doctor Sarah Chen"
          style={styles.headerContainer}
        >
          <Text style={styles.courseSubtitle}>
            Introduction to Cognitive Psychology
          </Text>
          <Text style={styles.chapterTitle}>
            Chapter 3: Memory & Learning
          </Text>
          <Text style={styles.instructorName}>
            Dr. Sarah Chen
          </Text>
        </View>

        {/* ── CENTRAL HUB (Audio visualization & timeline) ─────────────── */}
        <View style={styles.playerHub}>
          {/* Centered audio visualization placeholder graphic */}
          <VisualizerBars isPlaying={isPlaying} progress={progress} />

          {/* Active paragraph text chunk */}
          <View style={styles.paragraphContainer}>
            <Text style={styles.paragraphText} numberOfLines={3}>
              {currentChunkText}
            </Text>
          </View>

          {/* Scrubber / Progress Line */}
          <Pressable 
            onPress={handleProgressBarPress}
            accessible={true}
            accessibilityRole="progressbar"
            accessibilityLabel={`Lecture progress, ${positionLabel} of ${durationLabel}`}
            accessibilityValue={{
              min: 0,
              max: 100,
              now: Math.round(progress * 100),
              text: `${positionLabel} of ${durationLabel}`,
            }}
            accessibilityActions={[
              { name: 'increment', label: 'Seek forward 15 seconds' },
              { name: 'decrement', label: 'Seek backward 15 seconds' },
            ]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'increment') {
                skipForward15();
              } else if (event.nativeEvent.actionName === 'decrement') {
                skipBackward15();
              }
            }}
            style={styles.progressContainer}
          >
            {/* Sleek progress line track */}
            <View style={styles.progressTrack}>
              {/* Fill */}
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              {/* Thumb */}
              <View style={[styles.progressThumb, { left: `${progress * 100}%` as any }]} />
            </View>

            {/* Timestamps on opposite sides of the line */}
            <View 
              style={styles.progressLabels}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden={true}
            >
              <Text style={styles.timestampText}>{positionLabel}</Text>
              <Text style={styles.timestampText}>{durationLabel}</Text>
            </View>
          </Pressable>
        </View>

        {/* ── SPEED ROW ─────────────────────────────────────────────────── */}
        <View style={styles.speedRow}>
          <Pressable
            onPress={cyclePlaybackSpeed}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Playback speed, currently ${playbackSpeed}x`}
            accessibilityHint="Cycles the playback speed between 1x, 1.5x, 2x, 2.5x, 3x, and 3.5x"
            style={({ pressed }) => [
              styles.speedButton,
              pressed && styles.controlButtonPressed,
            ]}
          >
            <Text style={styles.speedButtonText}>{playbackSpeed}x Speed</Text>
          </Pressable>
        </View>

        {/* ── CONTROLS ROW ────────────────────────────────────────────────
            Symmetrical media control row. All touch targets are at least 
            55 x 55 dp to exceed standard guidelines.
        ────────────────────────────────────────────────────────────────── */}
        <View style={styles.controlsRow}>
          {/* Skip Backward 15s */}
          <Pressable
            onPress={skipBackward15}
            disabled={isLoading}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Skip backward 15 seconds"
            accessibilityState={{ disabled: isLoading }}
            style={({ pressed }) => [
              styles.controlButton,
              pressed && styles.controlButtonPressed,
              isLoading && styles.controlButtonDisabled,
            ]}
          >
            <RotateCcw size={22} color={Colors.primary} />
            <Text style={styles.controlSubscript}>15s</Text>
          </Pressable>

          {/* Play / Pause Toggle (Larger, central action) */}
          <Pressable
            onPress={togglePlayPause}
            disabled={isLoading}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isLoading ? 'Loading audio' : isPlaying ? 'Pause lecture' : 'Play lecture'}
            accessibilityState={{ busy: isLoading }}
            style={({ pressed }) => [
              styles.playButton,
              pressed && styles.controlButtonPressed,
              isLoading && styles.controlButtonDisabled,
            ]}
          >
            {isPlaying ? (
              <Pause size={28} color={Colors.onPrimary} strokeWidth={2.5} />
            ) : (
              <Play size={28} color={Colors.onPrimary} strokeWidth={2.5} style={{ marginLeft: 3 }} />
            )}
          </Pressable>

          {/* Skip Forward 15s */}
          <Pressable
            onPress={skipForward15}
            disabled={isLoading}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Skip forward 15 seconds"
            accessibilityState={{ disabled: isLoading }}
            style={({ pressed }) => [
              styles.controlButton,
              pressed && styles.controlButtonPressed,
              isLoading && styles.controlButtonDisabled,
            ]}
          >
            <RotateCw size={22} color={Colors.primary} />
            <Text style={styles.controlSubscript}>15s</Text>
          </Pressable>
        </View>

      </View>

      {/* ── BOTTOM AI PANEL (Occupies exactly 35% of overall screen height) ── */}
      <Pressable
        onPress={toggleAI}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isAIListening ? 'Ask AI, currently listening' : 'Ask AI'}
        accessibilityHint={
          isAIListening
            ? 'Double-tap to cancel listening'
            : 'Double-tap to activate voice command and ask a question about this lecture'
        }
        accessibilityState={{ selected: isAIListening }}
        style={({ pressed }) => [
          styles.aiPanel,
          isAIListening && styles.aiPanelActive,
          pressed && styles.aiPanelPressed,
        ]}
      >
        {/* Animated wave/pulse rings behind the microphone when active */}
        {isAIListening && (
          <View style={styles.aiOverlay} pointerEvents="none">
            <View style={styles.aiPulseRing} />
            <View style={styles.aiPulseRingOuter} />
          </View>
        )}

        <View style={styles.aiContentContainer}>
          <View style={[styles.micCircle, isAIListening && styles.micCircleActive]}>
            <Mic size={28} color={isAIListening ? Colors.aiActive : Colors.primary} strokeWidth={2} />
          </View>
          <Text style={styles.aiTitle}>
            {isAIListening ? 'Listening…' : 'Ask AI'}
          </Text>
          <Text style={styles.aiSubtitle}>
            {isAIListening 
              ? 'Speak your question about this lecture now' 
              : 'Tap to ask anything about this lecture content'}
          </Text>

          {/* Audio Visualizer Wave Dots when listening */}
          {isAIListening && (
            <View style={styles.listeningWave}>
              <View style={[styles.waveDot, { height: 16 }]} />
              <View style={[styles.waveDot, { height: 24 }]} />
              <View style={[styles.waveDot, { height: 12 }]} />
              <View style={[styles.waveDot, { height: 32 }]} />
              <View style={[styles.waveDot, { height: 18 }]} />
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // Theme Background
  },
  
  // Invisible Live Region
  liveRegion: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    top: 0,
    left: 0,
  },
  liveRegionText: {
    color: Colors.onSurface,
    fontSize: 1,
  },

  // Upper section takes up remaining 65% height
  upperContent: {
    flex: 0.65,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    justifyContent: 'space-between',
    paddingBottom: 12,
  },

  // Header styles (grouped top headers)
  headerContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  courseSubtitle: {
    color: Colors.primary, // Theme Primary
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  chapterTitle: {
    color: Colors.onSurface,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 4,
  },
  instructorName: {
    color: Colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },

  // Central Hub
  playerHub: {
    backgroundColor: Colors.surface, // Theme Surface
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceElevated,
    marginVertical: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 4,
    marginBottom: 16,
  },
  visualizerBar: {
    width: 4,
    borderRadius: 2,
  },
  paragraphContainer: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 16,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paragraphText: {
    color: Colors.onSurface,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Progress Bar / Scrubber
  progressContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 2,
    position: 'relative',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    marginLeft: -8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  timestampText: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },

  // Speed Cycle Control
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  speedButton: {
    minWidth: 120,
    minHeight: MIN_TOUCH_TARGET, // Enforce min touch target 55x55 dp
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  speedButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Controls Row
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 4,
  },
  controlButton: {
    minWidth: MIN_TOUCH_TARGET, // Enforce min touch target 55x55 dp
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlSubscript: {
    fontSize: 8,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  playButton: {
    minWidth: 72, // Highlighted central Play button
    minHeight: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary, // Theme primary color
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  controlButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  controlButtonDisabled: {
    opacity: 0.4,
  },

  // Bottom AI Panel (Occupies exactly 35% of overall screen height)
  aiPanel: {
    flex: 0.35,
    width: '100%',
    backgroundColor: Colors.aiBackground, // Theme AI default background
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  aiPanelActive: {
    backgroundColor: Colors.aiActiveBackground,
    borderTopColor: Colors.aiActive,
  },
  aiPanelPressed: {
    opacity: 0.95,
  },
  aiContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  micCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  micCircleActive: {
    borderColor: Colors.aiActive,
    shadowColor: Colors.aiActive,
    backgroundColor: Colors.aiActiveBackground,
  },
  aiTitle: {
    color: Colors.onSurface,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  aiSubtitle: {
    color: Colors.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // Active AI overlay pulse rings
  aiOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 11, 30, 0.5)',
  },
  aiPulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: Colors.aiActive,
    opacity: 0.6,
  },
  aiPulseRingOuter: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1.5,
    borderColor: Colors.aiActive,
    opacity: 0.25,
  },

  // Listening wave animation indicators
  listeningWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    marginTop: 16,
  },
  waveDot: {
    width: 4,
    backgroundColor: Colors.aiActive,
    borderRadius: 2,
  },
});

export default EducationalAudioPlayer;
