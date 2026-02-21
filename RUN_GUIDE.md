# 🚀 THE SENSES - RUN GUIDE

**Date:** February 12, 2026  
**Updated with:** Profile System, Post Bubble System, Social Feed

---

## 📋 Prerequisites

Before running, ensure you have:

✅ **Node.js** installed (v16+)  
✅ **MongoDB** running (local or Atlas)  
✅ **.env** file configured in Backend folder

---

## ⚙️ Environment Setup

### Backend `.env` File

Create `Backend/.env` with:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=mongodb://localhost:27017/the-senses
# OR for MongoDB Atlas:
# DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/the-senses

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30d

# Rate Limiting
RATE_LIMIT_ENABLED=false

# AI Services (Optional for question generation)
OPENAI_API_KEY=your-openai-api-key-if-available
GEMINI_API_KEY=your-gemini-api-key-if-available

# Cloudinary (Optional for media uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe (Optional for payments)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

### Frontend `.env` File

Create `frontend/.env` with:

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000
```

---

## 🚀 Running the Project

### Option 1: Using Two Terminals (Recommended)

**Terminal 1 - Backend:**

```bash
cd "d:\The Senses (BE+FE)\Backend"
npm install  # First time only
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd "d:\The Senses (BE+FE)\frontend"
npm install  # First time only
npm run dev
```

### Option 2: Using PowerShell Script

Create `start-dev.ps1` in project root:

```powershell
# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\The Senses (BE+FE)\Backend'; npm run dev"

# Wait 3 seconds
Start-Sleep -Seconds 3

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\The Senses (BE+FE)\frontend'; npm run dev"

Write-Host "✅ Both servers starting..."
Write-Host "Backend: http://localhost:5000"
Write-Host "Frontend: http://localhost:5173"
```

Then run:

```bash
.\start-dev.ps1
```

### Option 3: Using npm concurrently

Install concurrently in root:

```bash
npm install -g concurrently
```

Create `package.json` in root:

```json
{
  "name": "the-senses",
  "scripts": {
    "dev": "concurrently \"cd Backend && npm run dev\" \"cd frontend && npm run dev\""
  }
}
```

Then run:

```bash
npm run dev
```

---

## 🌐 Access Points

Once both servers are running:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | <http://localhost:5173> | Main application |
| **Backend API** | <http://localhost:5000> | API server |
| **API Docs** | <http://localhost:5000/api/v1> | API routes |

---

## 🧪 Testing New Features

### 1. **Test Profile System**

**Steps:**

1. Open <http://localhost:5173>
2. Login or create account
3. Complete a test
4. Navigate to `/profile/me` or `/profile/@username`

**What to test:**

- ✅ Profile header with score & rank
- ✅ Thinking metrics radar chart
- ✅ Score progression chart
- ✅ Achievements & badges
- ✅ Test history

### 2. **Test Social Feed**

**Steps:**

1. Navigate to `/feed` (you need to add route first)
2. Click "Create Post"
3. Write content, select category, add tags
4. Click "Post"

**What to test:**

- ✅ Create post
- ✅ Like/unlike posts
- ✅ Share posts
- ✅ View engagement stats
- ✅ Filter by category/tags

### 3. **Test Thinking Bubbles**

**Steps:**

1. On `/feed`, click "Start Bubble"
2. Enter topic label
3. Write opening argument
4. Click "Launch Bubble"

**What to test:**

- ✅ Create bubble
- ✅ View trending bubbles
- ✅ Bubble stats (participants, posts, trending score)
- ✅ Join discussion

### 4. **Test Score Sharing**

**Steps:**

1. Complete a test
2. On results page, click "Share on X"
3. Check if Twitter intent opens
4. View share card preview
5. Download share card

**What to test:**

- ✅ Twitter share button
- ✅ Pre-filled tweet text
- ✅ Share URL generation
- ✅ Share card display
- ✅ Download functionality

### 5. **Test Company Profiles** (Backend only)

**API Tests:**

```bash
# Create company (requires auth token)
POST http://localhost:5000/api/v1/company-profiles
Headers: Authorization: Bearer {token}
Body: {
  "name": "Tech Corp",
  "industry": "Technology",
  "description": "A tech company"
}

# Get company
GET http://localhost:5000/api/v1/company-profiles/tech-corp

# Search users (recruiter)
GET http://localhost:5000/api/v1/user-profiles/search?profession=engineer&minScore=700
```

---

## 🔧 Troubleshooting

### Backend won't start

**Error: `Cannot find module`**

```bash
cd Backend
npm install
```

**Error: `Port 5000 already in use`**

```bash
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID {PID} /F

# Or change PORT in .env
```

**Error: `Failed to connect to MongoDB`**

```bash
# Make sure MongoDB is running
# Check DATABASE_URL in .env
# For local MongoDB:
mongod
```

### Frontend won't start

**Error: `Cannot find module`**

```bash
cd frontend
npm install
```

**Error: `Port 5173 already in use`**

```bash
# Vite will auto-increment to 5174
# Or kill the process
netstat -ano | findstr :5173
taskkill /PID {PID} /F
```

### CORS Errors

Make sure `CLIENT_URL` in Backend `.env` matches frontend URL:

```env
CLIENT_URL=http://localhost:5173
```

### API Requests Failing

Check `VITE_BACKEND_URL` in `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 📱 Add Routes for New Pages

To access new pages, add routes to `frontend/src/App.jsx`:

```javascript
import UserProfile from './pages/UserProfile';
import SocialFeed from './pages/SocialFeed';

// Inside Routes component:
<Route path="/profile/me" element={<UserProfile />} />
<Route path="/profile/:username" element={<UserProfile />} />
<Route path="/feed" element={<SocialFeed />} />
```

---

## 🗄️ Database Seeding (Optional)

If you want test data:

```bash
cd Backend
node scripts/seed.js  # If seed script exists
```

Or manually create a user:

1. Go to <http://localhost:5173/login>
2. Click "Sign Up"
3. Create account
4. Take a test

---

## 📊 API Testing Tools

### Using Bruno/Postman/Insomnia

Import this collection:

**Base URL:** `http://localhost:5000/api/v1`

**Endpoints to test:**

```
# Auth
POST /auth/register
POST /auth/login

# Profiles
GET /user-profiles/me
PUT /user-profiles/me
GET /user-profiles/public/:username
GET /user-profiles/ranking

# Social Feed
GET /bubbles/feed
POST /bubbles/posts
POST /bubbles/posts/:postId/like
POST /bubbles/posts/:postId/share

# Bubbles
GET /bubbles/trending
POST /bubbles
GET /bubbles/:bubbleId

# Companies
POST /company-profiles
GET /company-profiles/:slug
```

---

## ✅ Success Indicators

You'll know everything is working when you see:

**Backend:**

```
🟢 Database Connected Successfully
✅ Server running on port 5000
📡 API routes loaded
```

**Frontend:**

```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Browser:**

- Homepage loads
- Can create account
- Can take test
- Can view profiles
- Can create posts
- Can start bubbles

---

## 🎯 Quick Test Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access <http://localhost:5173>
- [ ] Can register/login
- [ ] Can take a test
- [ ] Results page shows score
- [ ] Share button works
- [ ] Can view profile at `/profile/me`
- [ ] Can access social feed at `/feed` (after adding route)
- [ ] Can create posts
- [ ] Can start bubbles
- [ ] API endpoints respond

---

## 📞 Need Help?

Check these files for detailed docs:

- `COMPLETE_PROFILE_SYSTEM.md` - Profile system docs
- `POST_BUBBLE_SHARING_SYSTEM.md` - Social features docs
- `SCORE_SHARING_STATUS.md` - Sharing documentation
- `Mind Map/THE_SENSES_COMPLETE_SYSTEM_LOGIC.md` - System logic

---

**Happy Testing! 🚀**
