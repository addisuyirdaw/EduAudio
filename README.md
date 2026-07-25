# EduAudio Agent

> An accessible, context-aware AI agent powered by DataHub MCP to index, validate, and catalog educational audio data for visually impaired and blind students.

---

## 🎧 Overview

**EduAudio Agent** connects educational repositories to **DataHub's Model Context Protocol (MCP)** and **Agent Context Kit**. Instead of relying on linear screen readers or unorganized file structures, EduAudio allows blind students and educators to navigate complex course structures, query audio lessons with voice/text, and automatically validate data accessibility metadata without hallucinations.

---

## ✨ Core Features

* **Voice & Context-Aware Cataloging:** Automatically scans audio lesson repositories, extracts topic hierarchies, and registers metadata schemas into DataHub so agents can retrieve specific lessons instantly.
* **Automated Accessibility & Quality Checks:** Inspects incoming educational assets for missing transcripts, corrupted audio links, or broken schema tags, automatically flagging errors and writing updated descriptions back to the DataHub graph.
* **Intelligent Audio Navigation:** Allows blind students and educators to query datasets in plain English, returning exact audio timestamps and lesson summaries.

---

## 🛠️ Architecture & Tech Stack

* **Metadata Graph Platform:** DataHub Open Source (MCP Server & Agent Context Kit)
* **Frontend / App:** React Native / Expo (TypeScript)
* **Backend Agent Services:** Node.js / Python
* **AI Engine:** Context-aware LLM pipeline integrated with DataHub GraphQL API

---

## 🚀 Quickstart & Setup

### Prerequisites
* Node.js (v18+)
* Python 3.10+
* Docker Desktop (for running DataHub locally)

### 1. Clone the Repository
```bash
git clone [https://github.com/addisuyirdaw/EduAudio.git](https://github.com/addisuyirdaw/EduAudio.git)
cd EduAudio
