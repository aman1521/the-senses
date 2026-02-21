# 🚀 Deployment Guide

## Problem: "Network Error" on Login at the-senses.vercel.app

The frontend is deployed on Vercel, but the **backend is not publicly accessible**.
Vercel serves the frontend — but logins, registrations, and API calls go to `localhost:5000`
which only exists on your local machine. People on the internet can't reach it.

## Fix: Deploy Backend to Railway (Free)

### Step 1 — Deploy Backend to Railway

1. Go to **[railway.app](https://railway.app)** → Login with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `aman1521/the-senses` → Choose the **`Backend/`** subfolder as root
4. Railway will auto-detect Node.js and use `node server.js`

### Step 2 — Add Environment Variables on Railway

In Railway → Your backend service → **Variables** tab, add:

```
MONGODB_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<your JWT secret>
GEMINI_API_KEY=<your Gemini API key>
CLOUDINARY_CLOUD_NAME=<your cloudinary name>
CLOUDINARY_API_KEY=<your cloudinary key>
CLOUDINARY_API_SECRET=<your cloudinary secret>
NODE_ENV=production
PORT=5000
```

### Step 3 — Get your Railway Backend URL

After deploying, Railway gives you a URL like:

```
https://the-senses-backend-production.up.railway.app
```

### Step 4 — Add Environment Variable on Vercel

1. Go to **[vercel.com](https://vercel.com)** → Your `the-senses` project
2. **Settings** → **Environment Variables**
3. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://the-senses-backend-production.up.railway.app`
   - **Environment:** Production, Preview, Development (check all)
4. Click **Save**

### Step 5 — Redeploy Vercel

Go to **Deployments** → Click **Redeploy** on the latest deployment.

---

## Test Users (for local dev with mock DB)

When running locally without MongoDB (mock mode):

| Name | Email | Password | Role |
|------|-------|----------|------|
| Rishita Trivedi | <rishitatrivedi@gmail.com> | Aman@1915 | user |
| Inderjit Singh | <geminipre073@gmail.com> | Inderjit@123 | user |
| Aman Gupta | <aman@thesenses.dev> | Aman@1915 | admin |
| Mansi Sharma | <mansi@thesenses.dev> | Mansi@123 | user |

---

## Local Development (No Deployment Needed)

```bash
# Backend (port 5000)
cd Backend && npm run dev

# Frontend (port 5173)  
cd frontend && npm run dev
```

Frontend auto-connects to `http://localhost:5000` when `VITE_API_URL` is not set.
