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
5. [Component & Functional Directory](#-component--functional-directory)
6. [Database Schema & Data Models](#-database-schema--data-models)
7. [Installation & Setup](#-installation--setup)
   - [Prerequisites](#prerequisites)
   - [Environment Variables](#environment-variables)
   - [Available Scripts](#available-scripts)
8. [Responsive Design & UX Engineering](#-responsive-design--ux-engineering)
9. [License](#-license)

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

## 📁 Component & Functional Directory

| Component | Path | Responsibility & Key Functions |
|:---|:---|:---|
| `App.tsx` | `/App.tsx` | Top-level routing, Supabase auth session initialization, password recovery detection, view switcher (`login`, `signup`, `forgot-password`, `verification-sent`, `dashboard`). |
| `Dashboard.tsx` | `/components/Dashboard.tsx` | Main application shell. Manages sidebar navigation, course lists, search/filter queries, Quick Review placement, active tab persistence, and modal triggers. |
| `CourseDetail.tsx` | `/components/CourseDetail.tsx` | Deep view of a single course. Displays enrolled subjects, day-wise notes, full-screen media lightbox, and triggers note creation. |
| `QuickReviewPanel.tsx` | `/components/QuickReviewPanel.tsx` | Compact, responsive dashboard widget. Features Recharts donut chart for course completion status, subject counts, and workload health. |
| `AddCourseModal.tsx` | `/components/AddCourseModal.tsx` | Modal form for creating a new course, selecting degree, setting academic duration, and adding initial subjects. |
| `EditCourseModal.tsx` | `/components/EditCourseModal.tsx` | Modal for updating course metadata. Features **Clear End Date** button and unlocked dynamic subject editor (add, rename, remove). |
| `NoteModal.tsx` | `/components/NoteModal.tsx` | Comprehensive note editor with camera photo capture, video recording, microphone voice recording, and multi-file attachments. |
| `CommunityTab.tsx` | `/components/CommunityTab.tsx` | Top-level community shell with tab switching between public posts feed and direct peer connections. |
| `PostsSubTab.tsx` | `/components/PostsSubTab.tsx` | Public social feed. Handles post creation, image/file attachments, likes counter, and comments. |
| `ConnectionsSubTab.tsx` | `/components/ConnectionsSubTab.tsx` | Peer directory and 1-on-1 chat interface with real-time Supabase messaging, audio recording, and webcam media sharing. |
| `NotificationBell.tsx` | `/components/NotificationBell.tsx` | Header bell icon with real-time unread messages badge and dropdown with direct conversation jump links. |
| `AccountSettings.tsx` | `/components/AccountSettings.tsx` | User profile editor, avatar image uploader, account metadata viewer, and password change utility. |
| `LoginForm.tsx` | `/components/LoginForm.tsx` | User login form with credentials validation and switchers for signup/password reset. |
| `SignupForm.tsx` | `/components/SignupForm.tsx` | Registration form with email verification dispatch and validation. |
| `ForgotPasswordForm.tsx` | `/components/ForgotPasswordForm.tsx` | Password reset request form triggering Supabase recovery email. |
| `PolicyModal.tsx` | `/components/PolicyModal.tsx` | Modal displaying application Terms of Service and Privacy Policy. |
| `supabaseClient.ts` | `/services/supabaseClient.ts` | Configured Supabase JS client instance using environment variables. |

---

## 🗄️ Database Schema & Data Models

StudyPro uses the following relational tables in Supabase PostgreSQL:

### 1. `profiles`
Stores student profile metadata linked to `auth.users.id`.
- `id` (UUID, Primary Key, references `auth.users(id)`)
- `full_name` (Text)
- `avatar_url` (Text)
- `coursename` (Text)
- `introduction` (Text)
- `updated_at` (Timestamp)

### 2. `courses`
Tracks individual academic programs enrolled by the user.
- `id` (UUID, Primary Key)
- `user_id` (UUID, references `profiles(id)`)
- `name` (Text)
- `degree` (Text)
- `academic_structure` (Text: `'SEMESTER'` | `'YEAR'`)
- `current_value` (Text: e.g., `'Semester 1'`, `'Year 2'`)
- `join_date` (Date)
- `end_date` (Date, Nullable)
- `created_at` (Timestamp)

### 3. `subjects`
Belongs to a course and groups notes.
- `id` (UUID, Primary Key)
- `course_id` (UUID, references `courses(id)` on delete cascade)
- `name` (Text)
- `created_at` (Timestamp)

### 4. `notes`
Day-by-day notes tied to a subject.
- `id` (UUID, Primary Key)
- `subject_id` (UUID, references `subjects(id)` on delete cascade)
- `day_number` (Integer)
- `title` (Text)
- `content` (Text)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### 5. `note_media`
Media files and recordings attached to a note.
- `id` (UUID, Primary Key)
- `note_id` (UUID, references `notes(id)` on delete cascade)
- `url` (Text)
- `type` (Text: `'image'` | `'video'` | `'audio'` | `'pdf'` | `'word'` | `'excel'` | `'ppt'` | `'file'`)
- `name` (Text)
- `created_at` (Timestamp)

### 6. `posts`
Community wall publications.
- `id` (UUID, Primary Key)
- `user_id` (UUID, references `profiles(id)`)
- `title` (Text)
- `content` (Text)
- `media` (JSONB Array)
- `likes` (Text[] / UUID[])
- `comments` (JSONB Array)
- `created_at` (Timestamp)

### 7. `messages`
1-on-1 private messages between peers.
- `id` (UUID, Primary Key)
- `sender_id` (UUID, references `profiles(id)`)
- `receiver_id` (UUID, references `profiles(id)`)
- `content` (Text)
- `media_url` (Text, Nullable)
- `media_type` (Text, Nullable)
- `name` (Text, Nullable)
- `is_read` (Boolean, default `false`)
- `created_at` (Timestamp)

---

## 🛠️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- A [Supabase](https://supabase.com/) project with Auth, Storage, and Realtime enabled

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/studypro-web-app.git
   cd studypro-web-app
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

### Environment Variables
Create a `.env` file in the root directory (refer to `.env.example` if available):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Available Scripts

| Command | Action |
|:---|:---|
| `npm run dev` | Starts the Vite development server on `http://localhost:3000` with local network access. |
| `npm run build` | Runs TypeScript compilation (`tsc`) and bundles optimized static assets with Vite into `/dist`. |
| `npm run lint` | Type-checks the entire TypeScript codebase without emitting JS files. |
| `npm run preview` | Serves the production build locally for verification. |
| `npm run deploy` | Builds and deploys the application to GitHub Pages via `gh-pages`. |

---

## 🎨 Responsive Design & UX Engineering

- **Mobile, Tablet & Desktop Support**:
  - Breakpoints tuned across `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), and `2xl` (1536px).
  - Collapsible drawer sidebar on mobile and tablet devices with backdrop blur.
  - Pin-able sidebar on desktop with spacer reflow so content dynamically redistributes without overflow or chart distortion.
- **Anti-Overflow Guarantees**:
  - Course search headers wrap flexibly (`flex-wrap`) when sidebar is pinned.
  - Quick Review panel width adapts dynamically (`isSidebarPinned ? 'xl:w-[280px] 2xl:w-[320px]' : 'xl:w-[300px] 2xl:w-[330px]'`).
  - Staged window resize events (100ms and 320ms) ensure Recharts SVG containers adjust their bounds seamlessly during sidebar animation.
- **Accessible UI States**:
  - Loading indicators with spinners for all asynchronous database queries.
  - Modal portals mounted cleanly to `document.body` to avoid stacking context and overflow clipping issues.
  - Clean confirmation modals for destructive operations (course deletion, subject removal).

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute according to the terms of the license.
