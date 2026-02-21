# The Senses — Comprehensive Documentation

This document serves as the central repository for all project documentation, merging various change logs, progress reports, and feature specifications into a unified structure.

---

## 📚 Table of Contents

1. [Project Roadmap & Status](#1-project-roadmap--status)
2. [Feature Specification](#2-feature-specification)
3. [Technical Architecture](#3-technical-architecture)
4. [Workflows](#4-workflows)
5. [System Logic & Mind Map](#5-system-logic--mind-map)
6. [Detailed Technical Specifications](#6-detailed-technical-specifications)
7. [Social System Philosophy](#7-social-system-philosophy)
8. [Development Principles](#8-development-principles)

---

## 1. Project Roadmap & Status

**Last Updated:** February 18, 2026  
**Current Progress:** 105/115 (Phase 5: Refinement & Missing Features)

### 🟢 Completed Phases

* **Core Infrastructure:** API, Database, Auth, Landing Page (100% Done).
* **User Flow:** Tests, Results, Ranking (100% Done).
* **Social & Legitimacy:** Share Cards, Flex Tiers, Anti-Cheat System (100% Done).
* **AI Intelligence:** Question Generation, Professional Profiles (100% Done).
* **Dashboards:** User Dashboard, Company Dashboard, Public Profiles (100% Done).

### ⚠️ Pending Features (Critical Path)

* **Comments System:**
  * Backend API endpoints check (To Verify)
  * Frontend UI for threaded comments (Pending)
* **Global Search:**
  * User search by handle/name (Pending)
  * Post search by content (Pending)
* **Media Management:**
  * Direct image/video upload (Pending - currently using URL inputs)
* **Notifications:**
  * Real-time alerts for social interactions (Partial/Pending)

### 🚀 Active Phase: Mobile & Expansion (Phase 5)

* **Mobile App (iOS/Android):**
  * Expo Environment Setup ✅
  * Authentication & Navigation ✅
  * Responsive Test Interface (In Progress)
  * Push Notifications (To Do)
* **B2B Analytics:**
  * Cohort Analysis ✅
  * Export Reports ✅

---

## 2. Feature Specification

### 🌍 Global Features (All Roles)

1. **Authentication:** Login, Register, Role-based Access (User/Company/Admin).
2. **Notifications:** Bell icon for social interactions and rank updates.
3. **Search:** Global search for profiles, bubbles, and posts.
4. **Profile Settings:** Bio, Skills, Privacy Controls, Security.

### 🧑‍💻 User Dashboard (Growth Focus)

* **Home:** Rank, Confidence, "Start Assessment" CTA.
* **Performance:** Skill charts, Attention stability, Improvement velocity.
* **Timeline:** Cognitive journal of sessions and reflections.
* **Bubbles:** Public thinking history and discussion branches.

### 🏢 Company Dashboard (Evaluation Focus)

* **Home:** Candidate stats, Recent activity.
* **Candidate Profile:** Deep dive into stats (no social metrics), Risk Analysis.
* **Comparison Tool:** Side-by-side candidate evaluation.
* **Pipeline:** Track shortlisted candidates.

### 🫧 Social & Discussion (Bubbles)

* **Posts:** Create thoughts with "Start Bubble" option.
* **Bubbles:** Tree-structured discussions.
* **Engagement:** Likes/Comments (Social only, no impact on Rank).

---

## 3. Technical Architecture

### Core Principles

1. **Separation of Concerns:** Node.js Gateway handles logic; Python AI handles computation.
2. **Social vs. Performance:** Social metrics never influence Integrity or Skill scores.
3. **Trust First:** Company views exclude social popularity, focusing on verified data.

### System Layering

* **Client:** React (Web), React Native (Mobile).
* **Gateway:** Node.js (Express), Rate Limiting, Auth.
* **Services:**
  * `Assessment Engine` (Node.js)
  * `Social Service` (Node.js)
  * `AI Service` (Python/FastAPI)
* **Data:** MongoDB (Users, Posts, Scores, Bubbles).

### Key Data Flows

* **Assessment:** Start Session → Submit Answers → AI Scoring → Update Rank.
* **Social:** Post → Bubble → Reply → Notification.
* **Integrity:** Telemetry (Tab switching, Focus) → Python AI Analysis → Integrity Score.

---

## 4. Workflows

### 🛠️ Development Workflow

1. **Frontend:** `npm run dev` (Vite)
2. **Backend:** `npm run dev` (Express)
3. **Mobile:** `npx expo start`
4. **Testing:** Jest for unit tests, Cypress for E2E (Future).

### 🚀 Deployment

* **Frontend:** Vercel / Netlify
* **Backend:** Railway / AWS / Heroku
* **Database:** MongoDB Atlas

### 🔄 Data Sync

* **Real-time:** WebSockets for Notifications and Live Duels.
* **Async:** AI scoring and background jobs.

---

## 5. System Logic & Mind Map

### Unified System Logic

* **User Entry:** Auth → Context Load → Session Init.
* **Assessment Loop:** Question Request → AI Select/Generate → User Response → Evaluation.
* **Calculations:**
  * Accuracy + Reasoning + Speed = Raw Score.
  * Raw Score × Integrity Multiplier × Consistency = **Global Rank**.
* **Feedback:** Dashboards update immediately. Reflection prompts generated.

### Visual Map Updates

* **Unified Dashboard:** Bridge between User (Growth) and Company (Trust) views.
* **Adaptive Coaching:** Logic for detecting micro-gaps and suggesting drills.
* **Motivational Loop:** Streak mechanics + Status unlocks to drive retention.

*(Refer to `Mind Map/The Senses — System Logic.html` and `Mind Map/markmap.html` for interactive visualizations.)*

---

## 6. Detailed Technical Specifications

### OpenAPI v3 Specification (Core)

```yaml
openapi: 3.0.3
paths:
  /posts/quote:
    post:
      summary: Quote post into bubble
      requestBody:
        content:
          application/json:
            schema:
              properties:
                parent_post_id: { type: string }
                bubble_id: { type: string }
                content: { type: string }
      responses:
        '201': { description: Quoted post created }

  /feed:
    get:
      summary: Get feed
      parameters:
        - in: query 
          name: type
          schema: { type: string, enum: [public, following] }

  /assessments/start:
    post:
      summary: Start assessment session

  /company/candidates:
    get:
      summary: List candidates by profile
```

### Database Schema (Key Tables)

**users**

* id UUID PRIMARY KEY
* email TEXT UNIQUE
* role ENUM(user, company, admin)

**posts**

* id UUID
* author_id UUID
* bubble_id UUID NULL
* quoted_post_id UUID NULL

**bubble_nodes**

* id UUID
* bubble_id UUID
* parent_node_id UUID NULL
* depth INT

**performance_snapshots**

* assessment_id UUID
* skill_score FLOAT
* attention_score FLOAT
* confidence_score FLOAT

### Architectural Rules

* **Clients never call Python directly.**

* **Social layer never mutates scores.**
* **Company dashboard never sees engagement metrics.**

---

## 7. Social System Philosophy

### The "Anti-Social" Media

**The Senses** replaces hashtags with contextual, tree-based discussions.

* **No free tagging:** Users must reference existing posts.
* **Quote-based participation:** Enforces contextual thinking.
* **Tree structure:** Discussions branch, not flat comment chains.

### Company View: Performance Only

A strict separation is enforced:
✅ **Company Sees:** Cognitive scores, Consistency, Integrity multipliers, Thinking content (as context).
❌ **Company Does NOT See:** Likes, Comments, Follower counts, Popularity metrics.

### Anti-Spam Design

1. **Bubble Creation:** Max 1 new bubble per day per user.
2. **Posting Constraints:** Minimum content length (10 chars).
3. **Structure:** Must quote or reference to join a bubble.

---

## 8. Development Principles

### 🔑 Golden Rule

**Never refactor UI + backend + AI at the same time.** One layer per phase. Always keep prod stable.

### Continuous Rules

1. **Backend:** One API → many clients (Web/Mobile). Version everything.
2. **Frontend:** UI only. No scoring logic. No cheating logic.
3. **AI:** Stateless, Explainable, Replaceable.

### Daily Focus Rule

**If today is backend day, do NOT touch frontend.**

---
