# StudyPro 🎓

> **Master your academic journey** — track courses, manage lecture notes with multi-modal attachments, connect with peers, and share knowledge in real time.

---

## 📌 Table of Contents
1. [Overview & Purpose](#-overview--purpose)
2. [Target Audience](#-target-audience)
3. [Key Features](#-key-features)
   - [Course & Curriculum Management](#1-course--curriculum-management)
   - [Interactive Day-by-Day Lecture Notes](#2-interactive-day-by-day-lecture-notes)
   - [Analytics & Quick Review Panel](#3-analytics--quick-review-panel)
   - [Community & Peer Social Feed](#4-community--peer-social-feed)
   - [Real-Time 1-on-1 Peer Messaging](#5-real-time-1-on-1-peer-messaging)
   - [Instant Notification System](#6-instant-notification-system)
   - [Account, Profile & Security](#7-account-profile--security)
4. [System Architecture](#-system-architecture)
   - [Frontend Architecture](#frontend-architecture)
   - [Backend & Data Layer (Supabase)](#backend--data-layer-supabase)
   - [Real-time Communication Flow](#real-time-communication-flow)
5. [License](#-license)

---

## 🌟 Overview & Purpose

**StudyPro** is a modern, full-featured academic companion and social learning platform designed to replace fragmented spreadsheets, paper notebooks, and disjointed messaging apps. 

Students often struggle to balance multiple courses, track which lecture day covers which topic, retain audio/video recordings and slide decks, and discuss coursework with peers. **StudyPro** unifies all these requirements into a cohesive web application:

- **Structured Academic Tracking**: Organize courses by degree, semester/year, and individual subjects.
- **Rich-Media Note Taking**: Record audio lectures, take webcam snapshots/video, and attach documents (PDF, Word, Excel, PPT) organized cleanly by day and subject.
- **Collaborative Social Learning**: Share insights on a public community wall, ask questions, exchange attachments, and chat 1-on-1 with fellow students in real time.
- **Actionable Visual Insights**: Keep momentum with visual course completion distributions and study metrics.

---

## 🎯 Target Audience

- **Undergraduate & Postgraduate Students**: Managing multiple semesters, lab modules, lecture notes, and study groups.
- **High School & Academy Learners**: Preparing for standardized exams across academic subjects.
- **Bootcamp & Self-Paced Learners**: Tracking customized curriculum roadmaps, day-by-day progress, and study milestones.
- **Academic Study Groups**: Collaborating on assignments, sharing lecture summaries, and direct peer-to-peer discussions.

---

## 🚀 Key Features

### 1. Course & Curriculum Management
- **Course Creation Wizard (`AddCourseModal`)**:
  - Define course titles and degrees (e.g., *Bachelor of Computer Applications*, *B.Sc.*, *M.Sc.*, *Diploma*).
  - Configure academic structure: **Semester-based** (1st to 8th) or **Annual-based** (1st to 4th Year).
  - Specify start dates and optional anticipated completion dates.
  - Add initial subject lists dynamically.
- **Flexible Active Course Editing (`EditCourseModal`)**:
  - Update course titles, degrees, structures, and current semesters.
  - **Clear End Date Action**: Dedicated one-click button to reset/clear mistakenly set completion dates back to ongoing status.
  - **Unlocked Subject System**: Modify, rename, or add new subjects on active courses without restrictions. Delete unwanted subjects with safety confirmation dialogues.
- **Course Detail Workspace (`CourseDetail`)**:
  - Dedicated hub for individual courses showing all enrolled subjects.
  - Navigation between subjects, day-based lecture logs, and attached study materials.
  - Comprehensive course deletion and update workflows.

### 2. Interactive Day-by-Day Lecture Notes
- **Multi-Modal Lecture Notes (`NoteModal`)**:
  - Organize notes sequentially by **Day Number** and **Subject**.
  - Rich text title and comprehensive note content area.
- **Hardware-Integrated Media Capture**:
  - **In-Browser Voice Recorder**: Record live audio lectures or voice memos directly with audio waveforms and auto-attach to notes.
  - **In-Browser Camera & Video Capture**: Take snapshots of whiteboards or record video explanations with webcam switching.
  - **File Attachment Support**: Upload and attach PDFs, presentations (PPT/PPTX), spreadsheets (XLS/XLSX), Word documents (DOC/DOCX), code snippets, and images.
- **Note Inspector & Full-Screen Media Viewer**:
  - Preview images, stream audio, play videos, and download attached documents directly from the UI.

### 3. Analytics & Quick Review Panel
- **Real-Time Study Analytics (`QuickReviewPanel`)**:
  - Embedded directly within the dashboard for glanceable progress without disruptive popups.
  - Dynamic **Recharts Donut Chart** visualizing completed vs. active course proportions.
  - Quick summary metric cards: Total enrolled courses, completed ratio, and total active subjects.
- **Responsive Layout Stability**:
  - Smart flex wrapping and auto-calculated container widths (`xl:w-[280px]` / `2xl:w-[320px]`) prevent horizontal overflowing when the sidebar is pinned or unpinned.
  - Synchronized window resize dispatches ensure charts recalculate SVG dimensions accurately during transitions.

### 4. Community & Peer Social Feed
- **Academic Public Feed (`PostsSubTab`)**:
  - Publish questions, study tips, project announcements, and lecture summaries.
  - Multi-file attachments per post (documents, images, audio, video).
  - Interactive social engagements: instant **Like** toggles and nested **Comments**.
  - Search posts by keyword, author, or subject.
  - Delete or edit user's own publications.

### 5. Real-Time 1-on-1 Peer Messaging
- **Direct Connections & Chat (`ConnectionsSubTab`)**:
  - Browse peer directory with search, avatars, and current enrolled courses.
  - Real-time conversation thread with instant delivery powered by Supabase Realtime Channels.
  - In-chat voice recording with duration timer and instant preview.
  - In-chat webcam photo snapshot capture.
  - Multi-format file attachments with download and full-screen view.
  - Read receipts (`is_read` status) and unread message counters.

### 6. Instant Notification System
- **Notification Dropdown Bell (`NotificationBell`)**:
  - Unread message badge with real-time counter updates.
  - Dropdown listing recent incoming peer messages with sender avatar, timestamp, and message excerpt.
  - **Deep-Linking**: Clicking a notification immediately switches to the Community tab and opens the exact conversation thread with that peer.
  - Global event listeners (`studypro:refresh_notifications`) for cross-component synchronicity.

### 7. Account, Profile & Security
- **Authentication Lifecycle**:
  - Secure email & password registration with email verification notice (`verification-sent` view).
  - Login authentication with persistent session restore.
  - Forgot password request with reset link dispatch.
  - Password recovery handling with automatic redirect to account security.
- **Profile Customization (`AccountSettings`)**:
  - Update Full Name, Bio / Introduction, and enrolled course headline.
  - Avatar image upload with instant preview and storage in Supabase Storage.
  - Password change form with old password verification and strength matching.
- **Legal Compliance**:
  - Integrated modals for **Privacy Policy** and **Terms of Service** (`PolicyModal`).

---

## 🏗️ System Architecture

### Frontend Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                           App.tsx                           │
│  (Auth routing, session listener, recovery handler, modals)  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
       ┌───────┴────────┐             ┌───────┴────────┐
       │   Auth Views   │             │   Dashboard    │
       │ (Login, Signup,│             │ (Main Portal)  │
       │  Forgot, etc.) │             └───────┬────────┘
       └────────────────┘                     │
            ┌─────────────────────────────────┼───────────────────────────────┐
            │                                 │                               │
   ┌────────┴─────────┐              ┌────────┴─────────┐            ┌────────┴─────────┐
   │  Courses / Home  │              │  Community Tab   │            │ Account Settings │
   │ ──────────────── │              │ ──────────────── │            │ ──────────────── │
   │ • Course Grid    │              │ • Posts Feed     │            │ • Profile Edit   │
   │ • Course Detail  │              │ • 1-on-1 Chat    │            │ • Avatar Upload  │
   │ • Quick Review   │              │ • Realtime Peer  │            │ • Password Reset │
   │ • Modals (Notes, │              │   Directory      │            │ • Account Info   │
   │   Add/Edit)      │              └──────────────────┘            └──────────────────┘
   └──────────────────┘
```

- **Framework**: React 18 SPA (Single Page Application)
- **Bundler & Tooling**: Vite 6 + TypeScript 5
- **Styling**: Tailwind CSS 3.4 with custom scrollbars, animations, and responsive utilities
- **Icons**: Lucide React
- **Data Visualization**: Recharts (ResponsiveContainer, PieChart, Pie, Cell, Tooltip)
- **State Management**: React state hooks (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`) with `localStorage` persistence for active tabs and UI preferences.
- **Portals**: React `createPortal` for clean modal rendering attached to `document.body` outside the DOM layout tree.

### Backend & Data Layer (Supabase)
StudyPro leverages **Supabase** (PostgreSQL + Auth + Storage + Realtime):
- **Supabase Auth**: JWT-based session management, secure sign-up, sign-in, email confirmation, and password recovery.
- **PostgreSQL Database**: Relational schemas enforcing integrity between profiles, courses, subjects, notes, posts, and messages.
- **Supabase Realtime**: WebSocket-based Postgres replication listening for changes on `messages` and `notifications` tables.
- **Supabase Storage**: Object storage buckets for avatars, note attachments, post media, and chat uploads.

### Real-Time Communication Flow
```
User A (Browser) ────────▶ Supabase DB (INSERT messages)
                                 │
                                 ▼
                     PostgreSQL Replication
                                 │
                                 ▼
                   Supabase Realtime WebSockets
                                 │
                                 ▼
User B (Browser) ◀─────── Receives payload
                           ├── Appends message to chat thread
                           ├── Updates unread counter badge
                           └── Dispatches notification event
```




---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute according to the terms of the license.
