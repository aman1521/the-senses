# 🗺️ The Senses - Project Roadmap & Missing Features

**Last Updated:** February 18, 2026
**Current Status:** Phase 5 (Optimization & Polish)

## 🚨 Critical Missing Features (UI/UX)

These features have partial backend support but lack complete frontend implementation or integration.

### 1. 💬 Comment System (High Priority)

- **Status:** Backend Ready (Models/Controllers) ✅ | Frontend Ready ✅
- **Missing:**
  - `CommentSection` component in `SocialFeed`.
  - Reply UI (threaded or flat).
  - Real-time updates for new comments.
  - Integration with `BubbleNode` (for tree-based discussions).

### 2. 🔍 Global Search (High Priority)

- **Status:** Backend Ready ✅ | Frontend Ready ✅
- **Missing:**
  - `Search.jsx` page.
  - Backend search endpoints (users, posts, bubbles).
  - Search bar functionality in Navbar.

### 3. 🖼️ Media Upload (Completed)

- **Status:** Cloudinary Upload Ready ✅
- **Missing:**
  - Nothing. Client-side file picker, Cloudinary integration, and `uploadRoutes.js` are fully implemented.

### 4. 🔔 Notifications (Completed)

- **Status:** Fully Implemented ✅
- **Missing:**
  - Nothing. Replaced polling with Real-time WebSockets (`socket.io`), incorporated DB notification creation for likes/comments, and wired up the 'Mark all read' functionality in the dropdown.

---

## 📅 Roadmap: Next Steps

### Phase 5.1: Social Polish (Completed)

- [x] **Implement Comment UI:** Create `CommentSection.jsx` and integrate into Post cards.
- [x] **Fix Media Upload:** Implement basic file upload or improve URL input UX.
- [x] **Search:** Create basic search page for Users and Posts.

### Phase 5.2: Mobile App Refinement (In Progress)

- [ ] Ensure `ReflexTest` works smoothly on touch devices.
- [ ] Fix responsive layout issues in `SocialFeed`.

### Phase 6: Enterprise Features (Future)

- [ ] **Advanced Analytics:** Company dashboard reporting tools.
- [ ] **Team Management:** Invite flows and role assignment.
- [ ] **API Access:** Developer tokens for external integration.

---

## ✅ Completed Modules

- [x] **Core Assessment:** 4-Phase flow (Video, Skill, Reflex, Memory).
- [x] **Profile System:** User/Company profiles, Auth.
- [x] **Social Feed:** Posts, Bubbles, Sharing, Likes.
- [x] **Dashboards:** User (Growth) & Company (Evaluation).
- [x] **Anti-Cheat:** Tab switching, Device detection.
