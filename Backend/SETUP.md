# Local Setup Guide

Follow these steps to run "The Senses" locally on your machine.

## Prerequisites

1.  **Node.js**: Install from [nodejs.org](https://nodejs.org/). (Version 16+ recommended)
2.  **MongoDB**: You must have MongoDB installed and running locally.
    *   **Windows**: Download and install [MongoDB Community Server](   ).
    *   **Important**: During installation, ensure you select "Run service as Network Service user" (default) or set it up manually.
    *   **Start the Service**: Open Task Manager > Services, find `MongoDB`, right-click and "Start".

## 1. Backend Setup

The backend handles the API and database connections.

1.  Open a terminal in the project root (`d:\The Senses`).
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Check `.env` file (already exists):
    Ensure `MONGO_URI` is set to `mongodb://127.0.0.1:27017/senses` (or your local config).
4.  Start the backend server:
    ```bash
    npm run dev
    ```
    *   You should see: `🚀 The Senses backend running on http://localhost:5000`
    *   *If it fails to connect to DB, make sure MongoDB service is running.*

## 2. Frontend Setup

The frontend is a static web application in the `senses-frontend` folder.

1.  **Option A (Simplest)**:
    *   Open the folder `d:\The Senses\senses-frontend`.
    *   Double-click `index.html` to open it in your browser.
    *   *Note: Some features might require a local server due to CORS policies.*

2.  **Option B (Recommended - Live Server)**:
    *   If you use VS Code, install the "Live Server" extension.
    *   Right-click `index.html` and select "Open with Live Server".

## 3. Testing

1.  With the backend running and frontend open, try to submit a score or view the leaderboard.
2.  Check the backend terminal for logs (e.g., "✅ MongoDB connected").
