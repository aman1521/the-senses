# 🧠 The Senses – Intelligent Assessment & Social Platform

**The Senses** is a next-generation platform that quantifies cognitive ability and turns thinking into verifiable social proof. It combines rigorous psychometric assessments with a unique "Thinking Bubble" social network.

## 🚀 Quick Start

### Documentation

- **[ROADMAP.md](./ROADMAP.md)** - 🚨 **Start Here.** Current status and missing features.
- **[THE_SENSES_DOCUMENTATION.md](./THE_SENSES_DOCUMENTATION.md)** - Full project documentation.
- **[Mind Map & Architecture](./Mind%20Map/README.md)** - Visual system maps and logic flows.

### Installation

1. **Frontend:**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Backend:**

   ```bash
   cd Backend
   npm install
   npm run dev
   ```

3. **Environment:**
   - Ensure `.env` is configured in `Backend/` (MongoDB URI, JWT Secret).

---

## 🏗️ Project Structure

- **`frontend/`**: React + Vite application (User Interface).
- **`Backend/`**: Node.js + Express API (Logic & Database).
- **`Mind Map/`**: System architecture diagrams and logic documentation.
- **`packages/core/`**: Shared logic between web and mobile (via fallback in `Backend/data/jobProfiles.js`).

## ⚠️ Current Status: Phase 5 (Optimization)

The core assessment flow is **100% complete**. We are currently polishing the **Social Layer** and implementing the **Mobile App**.

**Known Missing Features (See Roadmap):**

- 💬 **Comments UI:** Backend ready, Frontend pending.
- 🔍 **Search UI:** Global search pending.
- 🖼️ **Media Upload:** Direct file upload pending.

---

*Verified Thinking. Quantified Intelligence.*
