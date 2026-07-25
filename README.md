# EduAudio

> **Voice-first, accessible educational tutor for blind and visually impaired students.** 
> Powered by DataHub MCP to index, validate, and catalog structured educational content for interactive learning.

---

## 🎧 Overview

**EduAudio** transforms static educational materials into dynamic, voice-interactive learning sessions. Designed specifically for students with vision loss, it combines high-quality text-to-speech, real-time voice recognition, and AI-driven context awareness to provide a conversational tutoring experience that adheres to strict **WCAG 2.2 AAA accessibility standards**.

---

## ✨ Core Features

*   **AI Interactive Teacher Mode**: A conversational PDF tutor where students can "talk" to their documents, ask questions, and receive context-aware explanations.
*   **DataHub Metadata Catalog Engine**: Integrates with local DataHub instances to fetch structured outlines, topic headings, and accessibility metadata (transcripts, alt-text flags).
*   **Audio Mutex Management**: Custom concurrency control that prevents conflicts between the tutor's voice, the student's input, and system screen readers (VoiceOver/TalkBack).
*   **Structural Verification**: Validates reading content against the document's official structural outline to ensure high-quality educational context without hallucinations.
*   **Voice-First Interface**: Ultra-accessible design featuring full-screen "Push-to-Talk" (PTT) interaction and haptic/audio feedback chimes for all state transitions.

---

## 🛠️ Tech Stack

*   **Framework**: React Native / Expo (TypeScript)
*   **State Management**: Finite State Machine (FSM) via React Context
*   **AI/Voice**: OpenAI API, `expo-speech` (TTS), `@react-native-voice/voice` (STT)
*   **Metadata Graph**: DataHub (GraphQL API)
*   **Accessibility**: WCAG 2.2 AAA Compliance, `expo-haptics`

---

## 📂 Project Structure

*   `src/context/`: Core FSM logic (`TeacherContext`) and `AudioMutex`.
*   `src/services/`: `DataHubService` (Metadata engine), PDF parsing, and audio feedback.
*   `src/hooks/`: Modular logic for voice recognition, TTS, and the AI Teacher interface.
*   `src/components/`: Accessible, high-contrast UI components with semantic ARIA roles.
*   `examples/`: Sample DataHub metadata schemas and API responses.

---

## 🚀 Quickstart

### Prerequisites
*   Node.js (v18+)
*   Expo Go app on your mobile device
*   Local DataHub instance (optional, fallback data included)

### Setup
1.  **Clone the Repository**
    ```bash
    git clone https://github.com/addisuyirdaw/EduAudio.git
    cd EduAudio/EduAudio
    ```
2.  **Install Dependencies**
    ```bash
    npm install
    ```
3.  **Start the Development Server**
    ```bash
    npx expo start
    ```

---

## 📑 Documentation
For deeper technical insights, see our implementation guides:
*   [AI Teacher Implementation Plan](./AI_TEACHER_IMPLEMENTATION_PLAN.md)
*   [FSM & Voice Integration](./FSM_VOICE_INTEGRATION_IMPLEMENTATION.md)
*   [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
*   [DataHub Metadata Example](./examples/datahub_metadata_response.json)
