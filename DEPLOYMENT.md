# Deployment Guide

This document explains how to manually deploy the **Emotion-Aware Learning Companion** later, both backend and frontend.

## Overview

The project has two parts:

- **Frontend**: Static site (HTML/CSS/JS) in the project root.
- **Backend**: Node/Express API in the `server/` folder, which proxies requests to Groq.

You will typically:

1. Deploy the **backend** first and get a public URL.
2. Configure the frontend to use that backend URL.
3. Deploy the **frontend** as a static site.

---

## 1. Deploying the Backend (Node/Express)

### 1.1. Backend location and entry point

- Code lives in: `server/`
- Entry file: `server/server.js`
- `package.json` inside `server/` defines:
  - `"start": "node server.js"`

The server listens on:

```js
const PORT = process.env.PORT || 3000;
```

Most hosting platforms (Render, Railway, Fly.io, etc.) will set `PORT` for you.

### 1.2. Steps to deploy (generic Node host)

1. **Create a new service/app** on your Node host.
2. Set the **root directory** to the `server/` folder of this repo (or configure the host to run `server/server.js`).
3. Set the **start command** to:

   ```bash
   npm start
   ```

4. Ensure the **Node version** is **18.x** or compatible (matches the project config).

### 1.3. Environment variables (Groq API key)

The backend expects `GROQ_API_KEY` in the environment.

1. Open the hosting provider's **Environment Variables** / **Secrets** section.
2. Add:

   - `GROQ_API_KEY=your_groq_api_key_here`

3. Do **not** commit `server/.env` to your repo; `.gitignore` already excludes it.

### 1.4. Test the deployed backend

After deployment you should get a URL like:

```text
https://your-backend-host.com
```

Test it using a tool like curl or Postman:

- URL: `https://your-backend-host.com/api/answer`
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body example:

```json
{
  "question": "Test question",
  "topChunks": [],
  "emotion": "neutral",
  "max_tokens": 100
}
```

You should receive a JSON response with a structure like:

```json
{
  "choices": [
    { "message": { "content": "..." } }
  ]
}
```

If you see CORS errors from the browser later, note that the server already has `app.use(cors())`, so cross-origin requests from your frontend domain should be allowed by default.

---

## 2. Configure the Frontend to Use the Deployed Backend

The frontend calls the backend using `CONFIG.API.baseUrl` in `js/config.js`:

```js
export const CONFIG = {
  // ...
  API: {
    baseUrl: (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost')
      ? 'http://localhost:3000'
      : 'https://your-backend-url.example.com',
    endpoint: '/api/answer',
    maxTokens: 600
  },
  // ...
};
```

- When running **locally** (hostname is `localhost`), it uses `http://localhost:3000`.
- When **deployed**, it uses the URL in the `else` branch.

### 2.1. Update the production API URL

After the backend is deployed and you have its URL:

1. Open `js/config.js`.
2. Replace the placeholder URL with your real backend URL. For example:

```js
baseUrl: (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost')
  ? 'http://localhost:3000'
  : 'https://your-backend-host.com',
```

3. Save and commit the change so the deployed frontend uses the correct API.

---

## 3. Deploying the Frontend (Static Site)

The frontend is a static site served from the project root. Key files:

- `index.html` (redirects to `home.html`)
- `home.html` (landing page)
- `chat.html` (main app/dashboard)
- `analytics.html` (analytics view)
- `styles.css` (global styles)
- `js/` (all frontend modules)

A `netlify.toml` is already present for Netlify-style static hosting.

### 3.1. Netlify deployment (example)

1. Push your code to a Git repo (GitHub, GitLab, etc.).
2. In Netlify, create a **New site from Git**.
3. Choose your repo and set:
   - **Base directory**: root of the project (where `index.html` is).
   - **Build command**: leave empty (`""`) since this is a static site.
   - **Publish directory**: `.`

Netlify will also read `netlify.toml`:

```toml
[build]
  command = ""
  publish = "."

[build.environment]
  NODE_VERSION = "18"
```

4. Deploy the site. You’ll get a URL like:

```text
https://your-frontend-site.netlify.app
```

5. Open these pages to verify:
   - `https://your-frontend-site.netlify.app/home.html`
   - `https://your-frontend-site.netlify.app/chat.html`

The chat page should successfully call your deployed backend (from step 1), as long as `CONFIG.API.baseUrl` points to the backend URL.

### 3.2. Other static hosts

Any static host (Vercel static, GitHub Pages + custom domain, etc.) will work as long as it:

- Serves the project root as a static site.
- Leaves the JS files under `js/` accessible.

You do **not** need Node on the frontend host; only the backend requires Node.

---

## 4. Local Development vs. Deployed Environment

- **Local development**
  - Backend: run from project root:

    ```bash
    npm start
    ```

    This runs `start.js`, which starts:
    - Backend on `http://localhost:3000`
    - Static server on `http://localhost:8080`

  - Frontend: open in browser:
    - `http://localhost:8080/home.html`
    - `http://localhost:8080/chat.html`

- **Deployed environment**
  - Backend: hosted Node service with HTTPS URL.
  - Frontend: static host (e.g. Netlify) serving the HTML/JS.
  - `CONFIG.API.baseUrl` will automatically use the deployed backend URL (non-`localhost`) as long as you updated the placeholder.

---

## 5. Quick Checklist

1. **Backend**
   - [ ] Deploy `server/` to a Node host.
   - [ ] Set `GROQ_API_KEY` as an environment variable.
   - [ ] Confirm `POST /api/answer` works at your backend URL.

2. **Frontend config**
   - [ ] Update `CONFIG.API.baseUrl` production URL to the backend URL.

3. **Frontend**
   - [ ] Deploy the static site (e.g. Netlify) from the project root.
   - [ ] Open `home.html` and `chat.html` on the deployed URL.
   - [ ] Verify chat, document upload/indexing, and emotion detection all work.
