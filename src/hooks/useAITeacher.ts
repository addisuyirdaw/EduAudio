/**
 * useAITeacher.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Core hook for AI Interactive Teacher Mode
 * 
 * This hook encapsulates all the logic for the conversational PDF tutoring system,
 * providing a clean interface for components to interact with teacher functionality.
 * 
 * It integrates:
 * - Document loading and parsing
 * - Voice command parsing
 * - Playback control with TTS
 * - Voice interaction (STT)
 * - AI conversation management
 * - Audio feedback coordination
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTeacherContext } from '../context/TeacherContext';
import { useVoiceRecognition } from './useVoiceRecognition';
import { useTextToSpeech } from './useTextToSpeech';
import { dataHubService } from '../services/DataHubService';
import type { PageRange, TeacherState } from '../types/teacher.types';

export interface UseAITeacherReturn {
  // State
  state: TeacherState;
  isReady: boolean;
  isLoading: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  currentDocument: any;
  metadata: any;
  currentPage: number;
  statusMessage: string;
  recognizedText: string;
  
  // Actions
  loadDocument: (uri: string) => Promise<void>;
  startReading: (range: PageRange) => Promise<void>;
  pauseReading: () => Promise<void>;
  resumeReading: () => Promise<void>;
  activateListening: () => Promise<void>;
  askQuestion: (question: string) => Promise<void>;
  cancelListening: () => Promise<void>;
  handleTouchDown: () => Promise<void>;
  handleTouchUp: () => Promise<void>;
  
  // Utilities
  parseVoiceCommand: (command: string) => PageRange | null;
  verifyContent: (text: string) => boolean;
  getAccessibilityLabel: () => string;
}

/**
 * Main hook for AI Teacher Mode functionality
 */
export function useAITeacher(): UseAITeacherReturn {
  const context = useTeacherContext();
  const voiceRecognition = useVoiceRecognition();
  const textToSpeech = useTextToSpeech();
  
  // Local state for UI feedback
  const [statusMessage, setStatusMessage] = useState('Ready to load a document');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Refs for timeout management
  const listeningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update status message based on state changes
  useEffect(() => {
    switch (context.state) {
      case 'IDLE':
        setStatusMessage('Ready to load a document');
        break;
      case 'PARSING_DOC':
        setStatusMessage('Parsing document...');
        break;
      case 'AI_SPEAKING':
        setStatusMessage(`Reading page ${context.currentPage} of ${context.document?.totalPages || 0}`);
        setIsSpeaking(true);
        setIsListening(false);
        break;
      case 'LISTENING':
        setStatusMessage('Listening... Speak your question');
        setIsListening(true);
        setIsSpeaking(false);
        break;
      case 'THINKING':
        setStatusMessage('Processing your question...');
        setIsListening(false);
        setIsSpeaking(false);
        break;
      case 'PAUSED':
        setStatusMessage('Paused. Tap to resume or ask a question');
        setIsSpeaking(false);
        setIsListening(false);
        break;
      case 'ERROR':
        setStatusMessage('An error occurred. Please try again.');
        setIsSpeaking(false);
        setIsListening(false);
        break;
    }
  }, [context.state, context.currentPage, context.document]);

  // Setup listening timeout (5 seconds for no speech detection)
  useEffect(() => {
    if (context.state === 'LISTENING') {
      // Clear any existing timeout
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
      }

      // Set new timeout for no speech detection
      listeningTimeoutRef.current = setTimeout(() => {
        console.log('[useAITeacher] No speech detected, cancelling listening');
        context.cancelListening();
      }, 5000);
    }

    // Cleanup timeout on unmount or state change
    return () => {
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
      }
    };
  }, [context.state, context.cancelListening]);

  /**
   * Parse voice command to extract page range
   * Supports formats like:
   * - "Teach me pages 25 to 47"
   * - "Read pages 5 to 12"
   * - "Explain pages 10 to 20"
   * - "Chapter 3"
   */
  const parseVoiceCommand = useCallback((command: string): PageRange | null => {
    const lowerCommand = command.toLowerCase();
    
    // Parse "pages X to Y" pattern
    const pagesMatch = lowerCommand.match(/pages?\s+(\d+)\s+(?:to|-)\s+(\d+)/);
    if (pagesMatch) {
      const startPage = parseInt(pagesMatch[1], 10);
      const endPage = parseInt(pagesMatch[2], 10);
      
      if (startPage > 0 && endPage > 0 && startPage <= endPage) {
        return {
          startPage,
          endPage,
          type: 'pages',
        };
      }
    }

    // Parse "chapter X" pattern
    const chapterMatch = lowerCommand.match(/chapter\s+(\d+)/);
    if (chapterMatch) {
      const chapterNum = parseInt(chapterMatch[1], 10);
      // TODO: Map chapter to actual page range from document structure
      return {
        startPage: 1, // Placeholder
        endPage: 10, // Placeholder
        type: 'chapter',
        chapterName: `Chapter ${chapterNum}`,
      };
    }

    console.warn('[useAITeacher] Could not parse voice command:', command);
    return null;
  }, []);

  /**
   * Get accessibility label based on current state
   * Provides screen reader announcements for WCAG compliance
   */
  const getAccessibilityLabel = useCallback((): string => {
    switch (context.state) {
      case 'IDLE':
        return 'AI Teacher Mode ready. Load a document to begin.';
      case 'PARSING_DOC':
        return 'Parsing document. Please wait.';
      case 'AI_SPEAKING':
        return `AI Teacher Mode active. Reading page ${context.currentPage} of ${context.document?.totalPages || 0}. Tap anywhere to ask a question.`;
      case 'LISTENING':
        return 'Microphone active. Speak your question now.';
      case 'THINKING':
        return 'Processing your question. Please wait.';
      case 'PAUSED':
        return `Reading paused at page ${context.currentPage}. Double-tap to resume or ask a question.`;
      case 'ERROR':
        return 'An error occurred. Double-tap to clear error and try again.';
      default:
        return 'AI Teacher Mode';
    }
  }, [context.state, context.currentPage, context.document]);

  /**
   * Load document wrapper with status updates
   */
  const loadDocument = useCallback(async (uri: string) => {
    try {
      setStatusMessage('Loading document...');
      await context.loadDocument(uri);
      setStatusMessage('Document loaded successfully');
    } catch (error) {
      setStatusMessage('Failed to load document');
      console.error('[useAITeacher] Load document error:', error);
    }
  }, [context]);

  /**
   * Start reading wrapper with status updates
   */
  const startReading = useCallback(async (range: PageRange) => {
    try {
      setStatusMessage(`Starting to read pages ${range.startPage} to ${range.endPage}...`);
      await context.startReading(range);
    } catch (error) {
      setStatusMessage('Failed to start reading');
      console.error('[useAITeacher] Start reading error:', error);
    }
  }, [context]);

  /**
   * Pause reading wrapper with status updates
   */
  const pauseReading = useCallback(async () => {
    try {
      setStatusMessage('Pausing...');
      await context.pauseReading();
    } catch (error) {
      setStatusMessage('Failed to pause');
      console.error('[useAITeacher] Pause error:', error);
    }
  }, [context]);

  /**
   * Resume reading wrapper with status updates
   */
  const resumeReading = useCallback(async () => {
    try {
      setStatusMessage('Resuming...');
      await context.resumeReading();
    } catch (error) {
      setStatusMessage('Failed to resume');
      console.error('[useAITeacher] Resume error:', error);
    }
  }, [context]);

  /**
   * Activate listening wrapper with status updates
   */
  const activateListening = useCallback(async () => {
    try {
      setStatusMessage('Activating microphone...');
      await context.activateListening();
    } catch (error) {
      setStatusMessage('Failed to activate microphone');
      console.error('[useAITeacher] Activate listening error:', error);
    }
  }, [context]);

  /**
   * Ask question wrapper with status updates
   */
  const askQuestion = useCallback(async (question: string) => {
    try {
      setStatusMessage('Processing question...');
      await context.askQuestion(question);
    } catch (error) {
      setStatusMessage('Failed to process question');
      console.error('[useAITeacher] Ask question error:', error);
    }
  }, [context]);

  /**
   * Cancel listening wrapper with status updates
   */
  const cancelListening = useCallback(async () => {
    try {
      setStatusMessage('Cancelling...');
      await context.cancelListening();
    } catch (error) {
      setStatusMessage('Failed to cancel');
      console.error('[useAITeacher] Cancel listening error:', error);
    }
  }, [context]);

  /**
   * Handle touch down - activate voice recognition
   * Integrates with FullScreenPTT component
   */
  const handleTouchDown = useCallback(async () => {
    try {
      // Call context handler for FSM transition
      await context.handleTouchDown();
      
      // Start voice recognition
      await voiceRecognition.startListening();
      
      setStatusMessage('Listening...');
    } catch (error) {
      setStatusMessage('Failed to activate microphone');
      console.error('[useAITeacher] Handle touch down error:', error);
    }
  }, [context, voiceRecognition]);

  /**
   * Handle touch up - process recognized speech
   * Integrates with FullScreenPTT component
   */
  const handleTouchUp = useCallback(async () => {
    try {
      // Stop voice recognition
      await voiceRecognition.stopListening();
      
      // Get recognized text
      const text = voiceRecognition.recognizedText;
      
      if (text && text.trim().length > 0) {
        setStatusMessage('Processing command...');
        // Call context handler with recognized text
        await context.handleTouchUp(text);
      } else {
        // No speech detected, cancel listening
        setStatusMessage('No speech detected');
        await context.cancelListening();
      }
    } catch (error) {
      setStatusMessage('Failed to process voice input');
      console.error('[useAITeacher] Handle touch up error:', error);
    }
  }, [context, voiceRecognition]);

  return {
    // State
    state: context.state,
    isReady: context.state === 'IDLE' || context.state === 'PAUSED',
    isLoading: context.state === 'PARSING_DOC' || context.state === 'THINKING',
    isListening,
    isSpeaking,
    currentDocument: context.document,
    metadata: context.metadata,
    currentPage: context.currentPage,
    statusMessage,
    recognizedText: voiceRecognition.recognizedText,
    
    // Actions
    loadDocument,
    startReading,
    pauseReading,
    resumeReading,
    activateListening,
    askQuestion,
    cancelListening,
    handleTouchDown,
    handleTouchUp,
    
    // Utilities
    parseVoiceCommand,
    verifyContent: (text: string) => {
      if (!context.metadata || !context.currentPage) return false;
      return dataHubService.verifyStructuralContext(context.metadata, context.currentPage, text);
    },
    getAccessibilityLabel,
  };
}
