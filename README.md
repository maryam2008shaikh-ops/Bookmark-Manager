# BookMark Manager 🔖

A clean, minimal, functional full-stack web application designed for a 45-minute college workshop. It allows users to register and log in via their phone number and WhatsApp OTP powered by **MiniMoth**, manage their personal bookmarks in an **SQLite** database, and browse links securely.

---

## 1. Project Overview & Features

- **WhatsApp OTP Authentication**: Passwordless phone number authentication with WhatsApp-first OTP delivery and automatic SMS fallback powered by MiniMoth.
- **Combined Register & Login**: If the verified phone number exists, the user is logged in; if not, an account is created automatically.
- **Bookmark Management**:
  - Add bookmarks with validation (title and HTTP/HTTPS URL).
  - View personal bookmarks with extracted domain pills and formatted creation dates.
  - Delete confirmation modal dialog to prevent accidental deletion.
  - Foreign key and ownership enforcement ensuring users can only access and delete their own bookmarks.
- **Security & Abuse Protection**:
  - In-memory rate limiting (max 3 OTP requests and 5 verification attempts per phone per 10-minute window).
  - Parameterized SQLite queries to prevent SQL injection.
  - Stateless signed JWT Bearer session tokens.
  - Zero leakage of API keys or OTPs to frontend bundles or browser logs.
- **Zero-CORS Development Proxy**: Vite development server proxies `/api` directly to Express on port 4000 for seamless same-origin communication.

---

## 2. Technologies Used

- **Frontend**:
  - React 18
  - Vite 6
  - JavaScript (ES Modules)
  - Plain CSS (clean light slate palette, teal accents, Google Font *Plus Jakarta Sans*)
  - Native Fetch API
- **Backend**:
  - Node.js (v18+)
  - Express.js (v4)
  - JavaScript ES Modules (`"type": "module"`)
  - `better-sqlite3` for synchronous, zero-latency SQLite persistence
  - `jsonwebtoken` for secure session token issuance
- **Database**:
  - SQLite (persisted to `backend/bookmarks.db`)
  - 2 Tables: `users` and `bookmarks` (with cascading foreign keys and WAL mode)
- **OTP Provider**:
  - MiniMoth REST API (`https://api.minimoth.dev/v1/otp/send` and `/v1/otp/verify`)

---

## 3. Prerequisites

- **Node.js**: v18.0.0 or higher (tested with Node v24).
- **npm**: v9.0.0 or higher.
- **Windows PowerShell** or Command Prompt.

---

## 4. Project Structure

```text
bookmark-manager/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthView.jsx          # Phone & OTP input views, MiniMoth badge
│   │   │   ├── BookmarksView.jsx     # Add bookmark form & bookmark card list
│   │   │   └── DeleteModal.jsx       # Confirmation dialog for bookmark deletion
│   │   ├── App.jsx                   # Session state, view switching, navbar & logout
│   │   ├── main.jsx                  # React DOM mount point
│   │   ├── index.css                 # Plain CSS styling & design system
│   │   └── api.js                    # Fetch client for all 5 backend routes
│   ├── .env                          # Local frontend config
│   ├── .env.example                  # Documented frontend config template
│   ├── .gitignore
│   ├── index.html                    # SEO tags, favicon & Google Fonts
│   ├── package.json
│   └── vite.config.js                # Vite config with /api development proxy
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── minimoth.js           # Official MiniMoth API client (send/verify)
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification & token signing
│   │   │   └── rateLimit.js          # In-memory OTP abuse throttling
│   │   ├── routes/
│   │   │   ├── auth.js               # POST /api/auth/send-otp & verify-otp
│   │   │   └── bookmarks.js          # GET, POST, DELETE /api/bookmarks
│   │   ├── db.js                     # SQLite auto-initialization & query helpers
│   │   └── index.js                  # Main Express server (5 routes only)
│   ├── .env                          # Local backend secrets
│   ├── .env.example                  # Documented backend template
│   ├── .gitignore
│   └── package.json
├── .gitignore
└── README.md
```

---

## 5. Backend API Endpoints (Strict 5-Route Limit)

The backend implements exactly **five** REST endpoints:

1. `POST /api/auth/send-otp`  
   Validates phone number, applies throttling, and requests a WhatsApp OTP via MiniMoth.
2. `POST /api/auth/verify-otp`  
   Verifies 6-digit code via MiniMoth, creates or finds user in SQLite, and returns a signed session token.
3. `GET /api/bookmarks`  
   Returns all bookmarks owned by the authenticated user.
4. `POST /api/bookmarks`  
   Validates title (1–200 chars) and URL (HTTP/HTTPS), then saves bookmark for the authenticated user.
5. `DELETE /api/bookmarks/:id`  
   Deletes the bookmark only if it belongs to the authenticated user (returns 403/404 otherwise).

> **Logout Note**: Handled purely on the frontend by clearing the session token from client storage. No redundant server routes are added, preserving the strict 5-route requirement.

---

## 6. How to Obtain & Configure Real MiniMoth Credentials

MiniMoth is designed specifically for WhatsApp-first OTP authentication without telecom bureaucracy:

1. **Sign Up**: Go to [https://minimoth.dev](https://minimoth.dev) and register for a developer account at [https://app.minimoth.dev](https://app.minimoth.dev).
2. **Create Project**: Click **New Project** and enter a project name (e.g., `Bookmark Workshop`).
3. **Copy API Key**: In **Project Settings**, copy your API key:
   - Live key format: `mm_live_xxxxxxxxxxxxxxxx`
   - Test sandbox key: `mm_test_xxxxxxxxxxxxxxxx` *(in sandbox mode, no WhatsApp message is dispatched and the verification code is always `000000`)*.
4. **WhatsApp Setup & Templates**:
   - **Domestic Indian Numbers (+91)**: **Zero setup required.** MiniMoth uses its own verified WhatsApp Business Account and TRAI DLT-registered sender. You do **not** need to create a Meta WhatsApp Business Account, obtain template approval, or register DLT headers.
   - **International Numbers (US/EU)**: Go to **Project Settings** → **International WhatsApp OTP** and toggle the desired region.

---

## 7. Windows Installation & Environment Setup

Open PowerShell and navigate to the project directory:

```powershell
cd "c:\Users\Shruti\Desktop\BookMark Manager\bookmark-manager"
```

### Step 1: Configure Backend Environment

Copy `.env.example` to `.env`:

```powershell
cd backend
Copy-Item .env.example .env
```

Open `backend\.env` and configure your settings:

```env
PORT=4000
FRONTEND_URL=http://localhost:5173
MINIMOTH_API_KEY=mm_live_your_actual_key_here
MINIMOTH_BASE_URL=https://api.minimoth.dev
JWT_SECRET=super_secret_session_jwt_key_replace_in_production
```

> **Placeholders vs. Real Values**:
> - `PORT=4000` *(Ready as is)*
> - `FRONTEND_URL=http://localhost:5173` *(Ready as is)*
> - `MINIMOTH_BASE_URL=https://api.minimoth.dev` *(Ready as is)*
> - `JWT_SECRET` *(Change to any random secret string)*
> - `MINIMOTH_API_KEY` *(**Placeholder**: Must be replaced with your actual `mm_live_...` or `mm_test_...` key from MiniMoth dashboard)*

### Step 2: Install Backend Dependencies

```powershell
npm install
```

### Step 3: Configure Frontend Environment

```powershell
cd ..\frontend
Copy-Item .env.example .env
```

The frontend `.env` contains:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

### Step 4: Install Frontend Dependencies

```powershell
npm install
```

---

## 8. Database Initialization

The SQLite database does **not** require manual migration commands. When the backend starts for the first time, `backend/src/db.js` automatically creates `backend/bookmarks.db` and runs the table schema:

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 9. Running the Application

Open **two separate PowerShell terminals**:

### Terminal 1: Backend Server

```powershell
cd "c:\Users\Shruti\Desktop\BookMark Manager\bookmark-manager\backend"
npm start
```
*Output:*
```text
=========================================
 BookMark Manager Backend running on:
 http://localhost:4000
 Database: SQLite (bookmarks.db)
 WhatsApp OTP Provider: MiniMoth
 Allowed Frontend: http://localhost:5173
=========================================
```

### Terminal 2: Frontend Development Server

```powershell
cd "c:\Users\Shruti\Desktop\BookMark Manager\bookmark-manager\frontend"
npm run dev
```
*Output:*
```text
  VITE v6.4.4  ready in 259 ms

  ➜  Local:   http://localhost:5173/
```

Open your browser at **`http://localhost:5173`**.

---

## 10. End-to-End Testing Guide

1. **Authentication (Register/Login)**:
   - On the homepage, enter your 10-digit mobile number (e.g. `9876543210` or `+919876543210`).
   - Click **Send WhatsApp OTP**.
   - Check WhatsApp for the 6-digit verification message from MiniMoth's verified account.
   - *(If using a test sandbox key `mm_test_...`, enter code `000000`).*
   - Enter the 6-digit code and click **Verify & Log In**.
   - You will be automatically redirected to the Bookmarks dashboard.
2. **Adding a Bookmark**:
   - In the "Add New Bookmark" card, enter:
     - Title: `MiniMoth Official Docs`
     - URL: `https://minimoth.dev/docs`
   - Click **Save Bookmark**.
   - The card appears immediately in your saved list with domain pill `minimoth.dev` and creation date.
3. **Opening a Bookmark**:
   - Click the title or the **Open ↗** button to open the link in a new tab.
4. **Deleting a Bookmark**:
   - Click the **Delete** button next to a bookmark.
   - A confirmation modal appears showing the bookmark title.
   - Click **Cancel** to dismiss, or **Delete** to confirm permanent deletion from SQLite.
5. **Logging Out**:
   - Click **Log Out** in the top navigation bar.
   - Your session token is removed and you return to the login screen.
   - Refreshing the page keeps you logged out.

---

## 11. Common Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **401 INVALID_API_KEY** | Missing or incorrect MiniMoth API key in backend `.env` | Ensure `MINIMOTH_API_KEY` in `backend/.env` is set to your actual key from `app.minimoth.dev` and restart the backend. |
| **429 TOO_MANY_REQUESTS** | Rate limit hit (max 3 sends per 10 mins) | Wait a few minutes or switch to another test phone number. |
| **CORS error in browser** | Accessing backend port directly from different origin | Use `http://localhost:5173` so Vite proxies requests to `/api` on same origin. |
| **SQLite database locked** | Multiple processes writing simultaneously | The backend activates `WAL` mode (`PRAGMA journal_mode = WAL`) by default to prevent locking. Ensure only one backend instance is running. |
| **400 INVALID_URL** | Missing protocol in URL | Enter URLs with `https://` or `http://` (the frontend also automatically attaches `https://` if omitted). |

---

## 12. Distinctions: Tested Locally vs. Live Provider Access

- **Fully Tested & Verified Locally**:
  - SQLite database auto-initialization and persistence (`backend/bookmarks.db`).
  - Table schemas, cascading foreign keys, and indexes.
  - All 5 REST API routes (`/api/auth/send-otp`, `/api/auth/verify-otp`, `GET /api/bookmarks`, `POST /api/bookmarks`, `DELETE /api/bookmarks/:id`).
  - Strict ownership security: User B cannot delete or access User A's bookmarks.
  - JWT creation, validation, expiry handling, and stateless logout.
  - In-memory rate limiting and throttling protection.
  - React frontend build, styling, form validation, error states, and responsive design.
  - Live HTTP interaction with MiniMoth's production endpoints (`https://api.minimoth.dev`), confirming correct endpoint URLs and structured error response handling.
- **Requires Real MiniMoth Credentials**:
  - Live WhatsApp message delivery to a physical mobile phone requires a live project key (`mm_live_...`) with credits in the MiniMoth wallet, or sandbox key (`mm_test_...` with default OTP `000000`).
