/**
 * TeacherContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Teacher Context with Finite State Machine (FSM)
 * 
 * Manages the global state for the AI Interactive Teacher Mode including:
 * - State machine transitions (IDLE, PARSING_DOC, AI_SPEAKING, LISTENING, THINKING, PAUSED, ERROR)
 * - Document loading and parsing
 * - Playback control
 * - Voice interaction management
 * - Conversation history
 * - Interruption context
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';
import type { TeacherState, TeacherContext, ParsedDocument, PageRange, ConversationMessage, InterruptionContext, AudioMutexState } from '../types/teacher.types';
import { EducationalMetadata, dataHubService } from '../services/DataHubService';
import { audioMutex } from './AudioMutex';
import { voiceCommandParser, ParsedVoiceCommand } from '../services/voiceCommandParser.service';

interface TeacherContextProviderProps {
  children: React.ReactNode;
}

const TeacherContext = createContext<TeacherContext | null>(null);

/**
 * Teacher Context Provider
 * Implements the FSM and provides actions for state transitions
 */
export const TeacherProvider: React.FC<TeacherContextProviderProps> = ({ children }) => {
  // FSM State
  const [state, setState] = useState<TeacherState>('IDLE');
  const [document, setDocument] = useState<ParsedDocument | null>(null);
  const [metadata, setMetadata] = useState<EducationalMetadata | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [interruptionContext, setInterruptionContext] = useState<InterruptionContext | null>(null);
  const [audioMutexState, setAudioMutexState] = useState<AudioMutexState>(audioMutex.getState());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs for async operations
  const stateTransitionRef = useRef<TeacherState>('IDLE');
  const isTransitioningRef = useRef(false);

  // Subscribe to audio mutex state changes
  useEffect(() => {
    const unsubscribe = audioMutex.onStateChange((newState) => {
      setAudioMutexState(newState);
    });
    return unsubscribe;
  }, []);

  /**
   * State transition helper with validation
   */
  const transitionState = useCallback((newState: TeacherState, fromState?: TeacherState) => {
    if (isTransitioningRef.current) {
      console.warn(`[TeacherContext] State transition already in progress, ignoring ${stateTransitionRef.current} → ${newState}`);
      return false;
    }

    if (fromState && stateTransitionRef.current !== fromState) {
      console.warn(`[TeacherContext] Invalid state transition: expected ${fromState}, got ${stateTransitionRef.current}`);
      return false;
    }

    console.log(`[TeacherContext] State transition: ${stateTransitionRef.current} → ${newState}`);
    isTransitioningRef.current = true;
    stateTransitionRef.current = newState;
    setState(newState);
    isTransitioningRef.current = false;
    return true;
  }, []);

  /**
   * Load a document and begin parsing
   * Transition: IDLE → PARSING_DOC
   */
  const loadDocument = useCallback(async (uri: string): Promise<void> => {
    if (!transitionState('PARSING_DOC', 'IDLE')) {
      throw new Error('Cannot load document: invalid state transition');
    }

    try {
      // TODO: Implement actual PDF parsing
      // For now, create a mock document with realistic pages for TTS
      const mockPages = Array.from({ length: 10 }, (_, i) => ({
        pageNumber: i + 1,
        text: `This is the text content of page ${i + 1} of the loaded document. It contains mock paragraphs for testing the audio reading logic.`,
        paragraphs: [
          `This is paragraph one of page ${i + 1}.`,
          `This is paragraph two of page ${i + 1}.`
        ],
        headings: [{ level: 1, text: `Heading for Page ${i + 1}`, position: 0 }],
        tables: [],
        textPosition: [],
      }));

      const mockDocument: ParsedDocument = {
        id: `doc_${Date.now()}`,
        title: 'Sample Document',
        uri,
        totalPages: 10,
        pages: mockPages,
        metadata: {},
      };

      setDocument(mockDocument);
      setCurrentPage(1);
      setPlaybackPosition(0);

      // Fetch Educational Metadata from DataHub
      try {
        const docMetadata = await dataHubService.fetchMetadata(mockDocument.id);
        setMetadata(docMetadata);
      } catch (metaError) {
        console.warn('[TeacherContext] Failed to fetch metadata from DataHub:', metaError);
      }

      // Transition to PAUSED after parsing
      transitionState('PAUSED');
      console.log('[TeacherContext] Document loaded successfully');
    } catch (error) {
      console.error('[TeacherContext] Document loading failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load document');
      transitionState('ERROR');
    }
  }, [transitionState]);

  /**
   * Start reading a specific page range
   * Transition: PAUSED → AI_SPEAKING
   */
  const startReading = useCallback(async (range: PageRange): Promise<void> => {
    if (!transitionState('AI_SPEAKING', 'PAUSED')) {
      throw new Error('Cannot start reading: invalid state transition');
    }

    try {
      // TODO: Implement actual reading logic with TTS
      console.log('[TeacherContext] Starting reading:', range);
      
      // Acquire audio mutex for playback
      // await audioMutex.acquirePlaybackLock(sound);
      
      setCurrentPage(range.startPage);
      setPlaybackPosition(0);
    } catch (error) {
      console.error('[TeacherContext] Start reading failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start reading');
      transitionState('ERROR');
    }
  }, [transitionState]);

  /**
   * Pause reading
   * Transition: AI_SPEAKING → PAUSED
   */
  const pauseReading = useCallback(async (): Promise<void> => {
    if (!transitionState('PAUSED', 'AI_SPEAKING')) {
      throw new Error('Cannot pause: invalid state transition');
    }

    try {
      // TODO: Implement actual pause logic
      console.log('[TeacherContext] Reading paused');
      
      // Release audio mutex
      // await audioMutex.releasePlaybackLock();
    } catch (error) {
      console.error('[TeacherContext] Pause failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to pause');
      transitionState('ERROR');
    }
  }, [transitionState]);

  /**
   * Resume reading
   * Transition: PAUSED → AI_SPEAKING
   */
  const resumeReading = useCallback(async (): Promise<void> => {
    if (!transitionState('AI_SPEAKING', 'PAUSED')) {
      throw new Error('Cannot resume: invalid state transition');
    }

    try {
      // TODO: Implement actual resume logic
      console.log('[TeacherContext] Reading resumed');
      
      // Acquire audio mutex for playback
      // await audioMutex.acquirePlaybackLock(sound);
    } catch (error) {
      console.error('[TeacherContext] Resume failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to resume');
      transitionState('ERROR');
    }
  }, [transitionState]);

  /**
   * Activate listening for voice input
   * Transition: AI_SPEAKING → LISTENING
   */
  const activateListening = useCallback(async (): Promise<void> => {
    if (!transitionState('LISTENING', 'AI_SPEAKING')) {
      throw new Error('Cannot activate listening: invalid state transition');
    }

    try {
      // Save interruption context
      const newInterruptionContext: InterruptionContext = {
        savedPosition: {
          pageNumber: currentPage,
          paragraphIndex: 0, // TODO: Track actual paragraph index
          wordIndex: 0, // TODO: Track actual word index
          timestamp: Date.now(),
        },
        conversationContext: {
          lastSpokenText: '', // TODO: Capture last spoken text
          pageContext: document?.pages[currentPage - 1]?.text || '',
          questionHistory: conversationHistory.map(m => m.content),
        },
      };
      setInterruptionContext(newInterruptionContext);

      // Acquire audio mutex for recording
      await audioMutex.acquireRecordingLock();
      
      console.log('[TeacherContext] Listening activated');
    } catch (error) {
      console.error('[TeacherContext] Activate listening failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to activate listening');
      transitionState('ERROR');
    }
  }, [transitionState, currentPage, document, conversationHistory]);

  /**
   * Ask a question (process speech and get AI response)
   * Transition: LISTENING → THINKING → AI_SPEAKING
   */
  const askQuestion = useCallback(async (question: string): Promise<void> => {
    if (!transitionState('THINKING', 'LISTENING')) {
      throw new Error('Cannot ask question: invalid state transition');
    }

    try {
      // Release recording lock
      await audioMutex.releaseRecordingLock();

      // Add user message to history
      const userMessage: ConversationMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: question,
        timestamp: Date.now(),
        pageContext: currentPage,
      };
      setConversationHistory(prev => [...prev, userMessage]);

      // TODO: Implement actual AI processing (e.g. OpenAI API integration)
      console.log('[TeacherContext] Processing question:', question);
      
      // Simulate AI thinking delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const responseText = `You asked: "${question}". Here is some information from page ${currentPage} of the document. This is a voice tutorial response.`;

      // Add AI response to history
      const aiMessage: ConversationMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        pageContext: currentPage,
      };
      setConversationHistory(prev => [...prev, aiMessage]);

      // Transition to AI_SPEAKING to read the response
      transitionState('AI_SPEAKING');
      
      // Speak the response using TTS, and resume when completed
      try {
        await audioMutex.acquireTTSLock();
        Speech.speak(responseText, {
          onDone: async () => {
            await audioMutex.releaseTTSLock();
            await resumeReading();
          },
          onError: async (error) => {
            console.error('[TeacherContext] AI Speech error:', error);
            await audioMutex.releaseTTSLock();
            await resumeReading();
          },
          onCancelled: async () => {
            await audioMutex.releaseTTSLock();
          },
        });
      } catch (err) {
        console.error('[TeacherContext] AI TTS speak failed:', err);
        await audioMutex.releaseTTSLock();
        await resumeReading();
      }

    } catch (error) {
      console.error('[TeacherContext] Ask question failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process question');
      transitionState('ERROR');
    }
  }, [transitionState, currentPage, resumeReading]);

  /**
   * Cancel listening (timeout or user cancellation)
   * Transition: LISTENING → AI_SPEAKING
   */
  const cancelListening = useCallback(async (): Promise<void> => {
    if (!transitionState('AI_SPEAKING', 'LISTENING')) {
      throw new Error('Cannot cancel listening: invalid state transition');
    }

    try {
      // Release recording lock
      await audioMutex.releaseRecordingLock();
      
      // Clear interruption context
      setInterruptionContext(null);
      
      console.log('[TeacherContext] Listening cancelled, resuming reading');
    } catch (error) {
      console.error('[TeacherContext] Cancel listening failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to cancel listening');
      transitionState('ERROR');
    }
  }, [transitionState]);

  /**
   * Clear error and return to IDLE
   * Transition: ERROR → IDLE
   */
  const clearError = useCallback(() => {
    if (!transitionState('IDLE', 'ERROR')) {
      console.warn('[TeacherContext] Cannot clear error: not in ERROR state');
      return;
    }

    setErrorMessage(null);
    console.log('[TeacherContext] Error cleared');
  }, [transitionState]);

  /**
   * Handle touch down - activate listening with hard pause
   * Called by FullScreenPTT onPanResponderGrant
   * Transition: AI_SPEAKING → LISTENING
   */
  const handleTouchDown = useCallback(async (): Promise<void> => {
    // Only allow touch down from AI_SPEAKING or PAUSED states
    if (state !== 'AI_SPEAKING' && state !== 'PAUSED') {
      console.warn('[TeacherContext] Touch down not allowed in current state:', state);
      return;
    }

    try {
      // Hard pause all audio immediately (< 100ms latency)
      await audioMutex.hardPause();

      // Transition to LISTENING state
      if (!transitionState('LISTENING', state)) {
        console.warn('[TeacherContext] Failed to transition to LISTENING');
        return;
      }

      // Save interruption context
      const newInterruptionContext: InterruptionContext = {
        savedPosition: {
          pageNumber: currentPage,
          paragraphIndex: 0,
          wordIndex: 0,
          timestamp: Date.now(),
        },
        conversationContext: {
          lastSpokenText: '',
          pageContext: document?.pages[currentPage - 1]?.text || '',
          questionHistory: conversationHistory.map(m => m.content),
        },
      };
      setInterruptionContext(newInterruptionContext);

      // Acquire recording lock
      await audioMutex.acquireRecordingLock();

      console.log('[TeacherContext] Touch down handled, now LISTENING');
    } catch (error) {
      console.error('[TeacherContext] Touch down failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to activate listening');
      transitionState('ERROR');
    }
  }, [state, transitionState, currentPage, document, conversationHistory]);

  /**
   * Handle touch up - process voice command
   * Called by FullScreenPTT onPanResponderRelease
   * Transition: LISTENING → PROCESSING → [various states]
   */
  const handleTouchUp = useCallback(async (recognizedText: string): Promise<void> => {
    if (state !== 'LISTENING') {
      console.warn('[TeacherContext] Touch up not allowed in current state:', state);
      return;
    }

    try {
      // Release recording lock
      await audioMutex.releaseRecordingLock();

      // Transition to THINKING state for processing
      if (!transitionState('THINKING', 'LISTENING')) {
        console.warn('[TeacherContext] Failed to transition to THINKING');
        return;
      }

      // Parse the voice command with network awareness
      const { action, offlineMessage } = await voiceCommandParser.processCommand(recognizedText);

      // Handle offline fallback
      if (offlineMessage) {
        console.log('[TeacherContext] Offline fallback triggered');
        try {
          await audioMutex.acquireTTSLock();
          Speech.speak(offlineMessage, {
            onDone: () => {
              audioMutex.releaseTTSLock();
            },
            onError: () => {
              audioMutex.releaseTTSLock();
            },
            onCancelled: () => {
              audioMutex.releaseTTSLock();
            },
          });
        } catch (err) {
          console.error('[TeacherContext] Offline TTS fallback failed:', err);
          audioMutex.releaseTTSLock();
        }
        // Return to PAUSED state
        transitionState('PAUSED');
        return;
      }

      // Execute the parsed command
      await executeVoiceCommand(action);

    } catch (error) {
      console.error('[TeacherContext] Touch up failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process voice command');
      transitionState('ERROR');
    }
  }, [state, transitionState, executeVoiceCommand]);

  /**
   * Execute a parsed voice command
   * Routes to appropriate action based on command type
   */
  const executeVoiceCommand = useCallback(async (command: ParsedVoiceCommand): Promise<void> => {
    console.log('[TeacherContext] Executing voice command:', command.type);

    switch (command.type) {
      case 'PAUSE':
      case 'STOP':
        await pauseReading();
        break;

      case 'RESUME':
        await resumeReading();
        break;

      case 'NEXT':
        if (document) {
          const skipAmount = command.parameters?.amount || 1;
          const nextVal = Math.min(document.totalPages, currentPage + skipAmount);
          if (nextVal !== currentPage) {
            console.log(`[TeacherContext] Navigating next: ${currentPage} -> ${nextVal}`);
            setCurrentPage(nextVal);
            setPlaybackPosition(0);
          }
        }
        await resumeReading();
        break;

      case 'BACK':
        if (document) {
          const skipAmount = command.parameters?.amount || 1;
          const prevVal = Math.max(1, currentPage - skipAmount);
          if (prevVal !== currentPage) {
            console.log(`[TeacherContext] Navigating back: ${currentPage} -> ${prevVal}`);
            setCurrentPage(prevVal);
            setPlaybackPosition(0);
          }
        }
        await resumeReading();
        break;

      case 'REPEAT':
        console.log('[TeacherContext] Repeating current content');
        setPlaybackPosition(0);
        await resumeReading();
        break;

      case 'AI_QUERY':
        // Forward to existing askQuestion handler
        await askQuestion(command.originalText);
        break;

      case 'UNKNOWN':
        console.warn('[TeacherContext] Unknown command:', command.originalText);
        // Return to previous state
        transitionState('PAUSED');
        break;

      default:
        console.warn('[TeacherContext] Unhandled command type:', command.type);
    }
  }, [pauseReading, resumeReading, askQuestion, transitionState, document, currentPage]);

  const contextValue: TeacherContext = {
    state,
    document,
    metadata,
    currentPage,
    playbackPosition,
    conversationHistory,
    interruptionContext,
    audioMutex: audioMutexState,
    loadDocument,
    startReading,
    pauseReading,
    resumeReading,
    activateListening,
    askQuestion,
    cancelListening,
    clearError,
    handleTouchDown,
    handleTouchUp,
  };

  return (
    <TeacherContext.Provider value={contextValue}>
      {children}
    </TeacherContext.Provider>
  );
};

/**
 * Hook to use the Teacher Context
 */
export const useTeacherContext = (): TeacherContext => {
  const context = useContext(TeacherContext);
  if (!context) {
    throw new Error('useTeacherContext must be used within a TeacherProvider');
  }
  return context;
};
