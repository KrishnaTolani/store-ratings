# Store Ratings

A full-stack web application where users discover stores and submit star ratings with comments. Three roles — Administrator, Normal User, and Store Owner — each get a tailored experience behind one shared login system.

---

## Screenshots

### Login
![Login page](docs/screenshots/login.png)

### Admin Dashboard
![Admin dashboard](docs/screenshots/admin-dashboard.png)

### Admin — Manage Users
![Admin users list](docs/screenshots/admin-users.png)

### Admin — Add Store (with new owner creation)
![Add store form](docs/screenshots/admin-add-store.png)

### Normal User — Store Listing with Filters
![Store listing](docs/screenshots/user-stores.png)

### Normal User — Store Detail & Review Form
![Store detail](docs/screenshots/user-store-detail.png)

### Store Owner — Dashboard with Ratings & Comments
![Owner dashboard](docs/screenshots/owner-dashboard.png)

### My Profile — Update Password
![Profile page](docs/screenshots/profile.png)

> **To add screenshots:** take a screenshot of each page, save it as a `.png` in `docs/screenshots/` using the filenames above, then commit and push.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Gmail SMTP Setup](#gmail-smtp-setup)
- [Demo Accounts](#demo-accounts)
- [API Reference](#api-reference)
- [Validation Rules](#validation-rules)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [User Guide](#user-guide)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + TypeScript |
| Build tool | Vite 8 |
| Routing | TanStack Router (file-based) |
| Data fetching | TanStack Query (React Query v5) |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui (Radix UI primitives) |
| Icons | Lucide React |
| Toasts | Sonner |
| Backend framework | Express 4 (Node.js ESM) |
| Database | MySQL 8+ |
| Query layer | mysql2 with named parameters |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Email | Nodemailer (Gmail SMTP) |

---

## Project Structure

```
store-star-gazer/
│
├── backend/                        Express API server
│   ├── sql/
│   │   └── schema.sql              CREATE TABLE statements
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js               MySQL connection pool
│   │   │   └── env.js              Loads .env, exports typed config
│   │   ├── controllers/
│   │   │   ├── adminController.js  All /admin/* handlers
│   │   │   ├── authController.js   Login, signup, update-password
│   │   │   ├── ownerController.js  Owner dashboard
│   │   │   └── userController.js   Store listing + ratings
│   │   ├── middleware/
│   │   │   ├── auth.js             JWT verify, requireAuth, requireRole
│   │   │   └── errorHandler.js     Global error formatter
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── ownerRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── scripts/
│   │   │   └── initDb.js           Creates schema + seeds demo data
│   │   ├── utils/
│   │   │   ├── email.js            Nodemailer helper (sendOwnerCredentials)
│   │   │   ├── helpers.js          publicUser, mapStore, HttpError
│   │   │   └── validation.js       All field validators
│   │   └── index.js                App entry — starts server, verifies DB + SMTP
│   ├── .env.example                Template for environment variables
│   └── package.json
│
├── src/                            React frontend
│   ├── components/
│   │   ├── ui/                     shadcn/ui primitives (button, input, etc.)
│   │   ├── DataTable.tsx           Generic sortable table component
│   │   ├── FormField.tsx           Label + input + inline error wrapper
│   │   ├── PageHeader.tsx          Page title / description / actions slot
│   │   ├── ProtectedRoute.tsx      Auth guard + role redirect + AppLayout
│   │   ├── RatingStars.tsx         1–5 star widget (display + interactive)
│   │   └── UpdatePasswordForm.tsx  Password change form (USER + OWNER only)
│   ├── context/
│   │   └── AuthContext.tsx         Global auth state (login/signup/logout)
│   ├── layouts/
│   │   └── AppLayout.tsx           Sticky nav + role links + account menu
│   ├── routes/                     One file = one URL (TanStack file-based routing)
│   │   ├── __root.tsx              App shell with QueryClientProvider
│   │   ├── index.tsx               / → redirects to role home
│   │   ├── login.tsx               /login
│   │   ├── signup.tsx              /signup  (Normal User self-registration)
│   │   ├── profile.tsx             /profile (account info + update password)
│   │   ├── admin.dashboard.tsx     /admin/dashboard
│   │   ├── admin.users.tsx         /admin/users
│   │   ├── admin.users.$id.tsx     /admin/users/:id
│   │   ├── admin.add-user.tsx      /admin/add-user
│   │   ├── admin.stores.tsx        /admin/stores
│   │   ├── admin.add-store.tsx     /admin/add-store
│   │   ├── user.stores.tsx         /user/stores  (store listing + quick-rate)
│   │   ├── user.stores_.$storeId   /user/stores/:id  (store detail + review)
│   │   └── owner.dashboard.tsx     /owner/dashboard
│   ├── services/
│   │   ├── adminService.ts         Admin API calls
│   │   ├── authService.ts          Login / signup / logout / updatePassword
│   │   ├── config.ts               API base URL + typed fetch wrapper
│   │   ├── mockDb.ts               roleHome map (used by ProtectedRoute)
│   │   ├── ownerService.ts         Owner dashboard API call
│   │   └── userService.ts          Store listing + rating API calls
│   ├── types/
│   │   └── index.ts                All shared TypeScript interfaces
│   └── utils/
│       └── validation.ts           Frontend validators (mirrors backend)
│
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── package.json                    Frontend dependencies + build scripts
├── vite.config.ts                  Vite + TanStack Start config
├── tsconfig.json
└── components.json                 shadcn/ui config
```

---

## Database Schema

MySQL 8+ with InnoDB, `utf8mb4` encoding, and foreign key constraints throughout.

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | `INT UNSIGNED` PK | Auto-increment |
| `name` | `VARCHAR(60)` | Min 20, max 60 chars |
| `email` | `VARCHAR(255)` UNIQUE | Login identifier |
| `password_hash` | `VARCHAR(255)` | bcrypt, never returned to clients |
| `address` | `VARCHAR(400)` | Max 400 chars |
| `role` | `ENUM('ADMIN','USER','OWNER')` | Default `USER` |
| `created_at` | `TIMESTAMP` | Set on insert |

Indexes: unique on `email`, `idx_users_role`, `idx_users_name`

### `stores`

| Column | Type | Notes |
|---|---|---|
| `id` | `INT UNSIGNED` PK | Auto-increment |
| `name` | `VARCHAR(60)` | Min 20, max 60 chars |
| `email` | `VARCHAR(255)` UNIQUE | Store contact email |
| `address` | `VARCHAR(400)` | Max 400 chars |
| `owner_id` | `INT UNSIGNED` NULL | FK → `users.id` ON DELETE SET NULL |
| `created_at` | `TIMESTAMP` | Set on insert |

### `store_photos`

| Column | Type | Notes |
|---|---|---|
| `id` | `INT UNSIGNED` PK | Auto-increment |
| `store_id` | `INT UNSIGNED` | FK → `stores.id` ON DELETE CASCADE |
| `url` | `VARCHAR(500)` | Absolute URL |
| `sort_order` | `TINYINT UNSIGNED` | Lower = shown first |

### `ratings`

| Column | Type | Notes |
|---|---|---|
| `id` | `INT UNSIGNED` PK | Auto-increment |
| `user_id` | `INT UNSIGNED` | FK → `users.id` ON DELETE CASCADE |
| `store_id` | `INT UNSIGNED` | FK → `stores.id` ON DELETE CASCADE |
| `value` | `TINYINT UNSIGNED` | 1–5, enforced by `CHECK` constraint |
| `comment` | `VARCHAR(400)` NULL | Optional review text |
| `emoji` | `VARCHAR(16)` NULL | One of 8 allowed emoji values |
| `created_at` | `TIMESTAMP` | Set on insert |
| `updated_at` | `TIMESTAMP` | Auto-updated on every change |

Unique key: `(user_id, store_id)` — one rating per user per store.

Average rating is always computed at query time with `AVG(value)` — never stored — so it stays accurate without triggers.

### Relationships

```
users  ──<  stores        one owner → one store (nullable)
users  ──<  ratings       one user → many ratings
stores ──<  ratings       one store → many ratings
stores ──<  store_photos  one store → many photos
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+  *(or Docker — see below)*

**Optional — run MySQL with Docker:**
```bash
docker run --name store-ratings-db \
  -e MYSQL_ROOT_PASSWORD=yourpassword \
  -e MYSQL_DATABASE=store_ratings \
  -p 3306:3306 -d mysql:8
```

---

### 1 — Clone

```bash
git clone https://github.com/your-username/store-star-gazer.git
cd store-star-gazer
```

### 2 — Backend setup

```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
```

Edit `backend/.env` — at minimum set `MYSQL_PASSWORD` and `JWT_SECRET` (see below).

```bash
npm install
npm run db:init             # Creates tables + seeds demo data
npm run dev                 # Starts API on http://localhost:5000
```

On a successful start you will see:
```
─────────────────────────────────────────
  ✔  API     — http://localhost:5000
  ✔  MySQL   — connected (store_ratings)
  ✔  Email   — SMTP ready (you@gmail.com)
─────────────────────────────────────────
```

### 3 — Frontend setup

Open a second terminal:

```bash
cd store-star-gazer        # project root
npm install
npm run dev                # Starts frontend on http://localhost:3000
```

### 4 — Open the app

Go to `http://localhost:3000` and log in with one of the demo accounts below.

---

## Environment Variables

### `backend/.env`

| Variable | Default | Required |
|---|---|---|
| `PORT` | `5000` | No |
| `MYSQL_HOST` | `localhost` | No |
| `MYSQL_PORT` | `3306` | No |
| `MYSQL_USER` | `root` | No |
| `MYSQL_PASSWORD` | *(empty)* | **Yes** |
| `MYSQL_DATABASE` | `store_ratings` | No |
| `JWT_SECRET` | `dev-secret-change-me` | **Yes — change in production** |
| `JWT_EXPIRES_IN` | `7d` | No |
| `SMTP_HOST` | `smtp.gmail.com` | No |
| `SMTP_PORT` | `587` | No |
| `SMTP_USER` | *(empty)* | For email delivery |
| `SMTP_PASS` | *(empty)* | For email delivery |
| `SMTP_FROM` | *(SMTP_USER)* | No |

**Generate a strong JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend (`.env.local` in project root)

| Variable | Default |
|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` |

---

## Gmail SMTP Setup

Owner credentials are emailed automatically when admin creates a new store+owner. Without SMTP configured the credentials are printed to the backend console instead.

**Step 1** — Enable 2-Step Verification on your Google account:
`myaccount.google.com` → Security → 2-Step Verification

**Step 2** — Create an App Password:
`myaccount.google.com/apppasswords` → App name: `Store Ratings` → Create

**Step 3** — Copy the 16-character password Google shows (e.g. `abcd efgh ijkl mnop`) and add to `backend/.env` **without spaces**:

```env
SMTP_USER=you@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=Store Ratings <you@gmail.com>
```

**Step 4** — Restart the backend. You'll see `✔  Email — SMTP ready` on startup.

> If you see `✖  Email — SMTP connection failed: Invalid login` — the App Password is wrong. Re-generate it.

---

## Demo Accounts

Seeded by `npm run db:init`:

| Role | Email | Password |
|---|---|---|
| Administrator | admin@storeratings.app | Admin@1234 |
| Normal User | jonathan@example.com | User@1234 |
| Normal User | priyanka@example.com | User@1234 |
| Store Owner | gregory@northsidegoods.com | Owner@1234 |
| Store Owner | isabella@fontainemarket.com | Owner@1234 |

---

## API Reference

All protected endpoints require `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/login` | Public | `{ email, password }` → `{ token, user }` |
| POST | `/signup` | Public | `{ name, email, address, password }` → creates USER |
| POST | `/update-password` | USER, OWNER | `{ currentPassword, newPassword }` |
| GET | `/me` | Any | Returns current user from token |

### Admin — `/api/admin` *(ADMIN only)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | `{ totalUsers, totalStores, totalRatings }` |
| GET | `/users` | All users sorted by name |
| GET | `/users/:id` | User detail; includes `storeRating` + `storeName` if OWNER |
| POST | `/users` | Create Normal User. Body: `{ name, email, address, password }` |
| GET | `/stores` | All stores with average rating |
| GET | `/owners` | All OWNER accounts (for owner selector) |
| POST | `/stores` | Create store — see two modes below |

**POST `/api/admin/stores` — Mode A (existing owner):**
```json
{ "name": "...", "email": "...", "address": "...", "ownerId": "42" }
```

**POST `/api/admin/stores` — Mode B (create new owner + email credentials):**
```json
{
  "name": "...", "email": "...", "address": "...",
  "ownerName": "...", "ownerEmail": "...",
  "ownerAddress": "...", "ownerPassword": "..."
}
```

### User — `/api/user` *(USER only)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stores` | All stores with `averageRating`, `ratingCount`, `coverUrl`, `myRating` |
| GET | `/stores/:storeId` | Store detail with `photos`, `reviews`, `myReview` |
| POST | `/stores/:storeId/ratings` | Submit rating `{ value, comment?, emoji? }` |
| PUT | `/stores/:storeId/ratings` | Update existing rating |

### Owner — `/api/owner` *(OWNER only)*

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | `{ store, averageRating, raters[] }` — raters include `comment` and `emoji` |

---

## Validation Rules

Enforced identically on frontend (TypeScript) and backend (JavaScript).

| Field | Rule |
|---|---|
| Name | Required. Min 20 chars, max 60 chars |
| Email | Required. Standard email format |
| Address | Required. Max 400 chars |
| Password | Required. 8–16 chars, at least 1 uppercase, at least 1 special character |
| Confirm Password | Must match password exactly |
| Rating value | Integer 1–5 (also enforced with a MySQL CHECK constraint) |
| Comment | Optional. Max 400 chars |
| Emoji | Optional. Must be one of 8 allowed values |

---

## Frontend Architecture

### Auth flow

1. `POST /auth/login` returns `{ token, user }`
2. `authService` saves both to `localStorage` under `store-ratings.session.v1`
3. `AuthContext` reads it on app boot — no extra API call
4. Every `request()` in `services/config.ts` attaches `Authorization: Bearer <token>` automatically
5. `ProtectedRoute` wraps all private pages — redirects to `/login` if no session, or to the role's home if wrong role
6. Changing `JWT_SECRET` invalidates all existing tokens — users need to log in again (clear `store-ratings.session.v1` from localStorage if stuck)

### Routing

File name → URL (TanStack file-based routing):

| File | URL |
|---|---|
| `index.tsx` | `/` — redirects by role |
| `login.tsx` | `/login` |
| `signup.tsx` | `/signup` |
| `profile.tsx` | `/profile` |
| `admin.dashboard.tsx` | `/admin/dashboard` |
| `admin.users.tsx` | `/admin/users` |
| `admin.users.$id.tsx` | `/admin/users/:id` |
| `admin.add-user.tsx` | `/admin/add-user` |
| `admin.stores.tsx` | `/admin/stores` |
| `admin.add-store.tsx` | `/admin/add-store` |
| `user.stores.tsx` | `/user/stores` |
| `user.stores_.$storeId.tsx` | `/user/stores/:storeId` |
| `owner.dashboard.tsx` | `/owner/dashboard` |

`routeTree.gen.ts` is auto-generated by TanStack Router — never edit it manually.

### Data fetching

All server state uses TanStack Query:
- `useQuery` for reads — cached, refetched on window focus
- `useMutation` for writes — on success calls `queryClient.invalidateQueries` to refresh affected lists instantly
- No manual loading state management needed

### Key components

| Component | What it does |
|---|---|
| `RatingStars` | Pass `onChange` → interactive. Without it → display only |
| `DataTable<T>` | Generic sortable table. Column `sortValue` extractor drives client-side sort |
| `ProtectedRoute` | Auth check + role guard + renders `AppLayout` |
| `FormField` | Label + input slot + inline error message |
| `UpdatePasswordForm` | Shown on `/profile` for USER and OWNER only — hidden for ADMIN |
| `QuickRatePopover` | Star popover on each store card — submit or modify rating without navigating |

---

## Backend Architecture

### Request lifecycle

```
HTTP Request
  → Express router
  → asyncHandler (catches promise rejections → passes to errorHandler)
  → requireAuth  (verifies JWT, loads user from DB, attaches req.user)
  → requireRole  (checks req.user.role)
  → Controller   (validates input, queries DB, returns JSON)
  → errorHandler (formats HttpError or unexpected errors as JSON)
```

### Auth middleware

- `requireAuth` — verifies the JWT from `Authorization: Bearer`. Loads the full user row from DB on every request (ensures deleted accounts are rejected immediately). Attaches `req.user`.
- `requireRole(...roles)` — checks `req.user.role` is in the allowed list. Returns 403 otherwise.
- `signToken(user)` — signs `{ sub: user.id, role: user.role }` with `JWT_SECRET`.

### Email (Nodemailer)

`sendOwnerCredentials()` in `src/utils/email.js`:
- Called after a new owner+store is created via `POST /admin/stores` Mode B
- Sends an HTML email with login email, password, and a prompt to change it
- If `SMTP_USER`/`SMTP_PASS` are not set, prints credentials to console instead (dev fallback)
- Called with `.catch()` so a slow/failing SMTP never blocks the API response
- On startup, `transporter.verify()` confirms SMTP connectivity and logs `✔` or `✖`

### Error handling

Controllers throw `new HttpError(message, statusCode)` for expected errors (400 validation, 404 not found, 409 conflict, 401 auth, 403 forbidden). The global `errorHandler` catches these and returns `{ message }` JSON with the right status. Unexpected errors return 500.

### Password security

Passwords hashed with bcrypt at cost 10. The `password_hash` column is never selected in queries that return data to the client. `publicUser()` helper explicitly maps only safe fields.

### `node --watch` caveat

The backend runs with `node --watch` (auto-restart on file changes). If you edit `.env` while the server is running, the watch process **does not reload environment variables** — you must stop (`Ctrl+C`) and run `npm run dev` again for `.env` changes to take effect.

---

## User Guide

### Logging in

Go to `http://localhost:3000`. Enter your email and password. You are redirected to your role's home page automatically.

If you get **"Invalid or expired token"** after changing `JWT_SECRET`:
1. Open DevTools → Application → Local Storage → `http://localhost:3000`
2. Delete `store-ratings.session.v1`
3. Refresh → log in again

---

### Administrator

**Dashboard** (`/admin/dashboard`)
Shows total users, total stores, and total ratings platform-wide. Quick links to manage users and stores.

**Users** (`/admin/users`)
Full list of all accounts. Filter by name, email, address, or role using the inputs at the top. Click any column header to sort ascending/descending. Click **View details** on any row to see that user's full profile.

**User detail** (`/admin/users/:id`)
Shows name, email, address, role. If the user is a Store Owner, their store name and average rating are shown in a separate card.

**Add user** (`/admin/add-user`)
Creates a Normal User account. Fields: name, email, address, password, confirm password. Role is always set to Normal User — no selector needed.

**Stores** (`/admin/stores`)
Full list of all stores with average rating. Filter by name, email, address. Sort any column.

**Add store** (`/admin/add-store`)
Three owner modes:
- **No owner yet** — store created unassigned
- **Assign existing owner** — pick from existing OWNER accounts
- **Create new owner** — fill in owner name, email, address, password. On submit: the owner account is created, the store is linked, and login credentials are emailed to the owner's address automatically.

**Logout** — click your name in the top-right → Logout.

> Admins do **not** have a password update screen.

---

### Normal User

**Stores** (`/user/stores`)
Browse all registered stores. Use the search bar to filter by name or address. Use the dropdowns to filter by "Rated by me / Not rated yet" or by minimum average rating. A result count updates as you type.

Each store card shows:
- Cover photo
- Store name and address
- Overall average rating (stars + number + count)
- Your submitted rating (if any)
- A **Rate this store** button (or **Your rating: N★ ✏** if already rated)

**Quick-rating** — click the rate button on any card to open a star popover. Pick 1–5 stars and click Submit/Update. The card updates instantly.

**Store detail** (`/user/stores/:id`) — click anywhere on a store card. Shows:
- All store photos
- Full review form (stars + emoji picker + comment up to 400 chars)
- All reviews from other visitors

**My Profile** (`/profile`) — update your password. Requires current password + new password (8–16 chars, 1 uppercase, 1 special character).

**Logout** — account dropdown → Logout.

---

### Store Owner

**Dashboard** (`/owner/dashboard`)
Shows your store's average rating as a large number with star display, plus how many ratings have been received.

Below that, a table of every user who rated your store: name, email, star rating, and submission date. All columns are sortable.

**Reading comments** — if a user left a comment, the row has a ▼ chevron. Click the row to expand it and read their comment and emoji. Click again to collapse.

**My Profile** (`/profile`) — update your password.

**Logout** — account dropdown → Logout.

---

### Signup (new Normal Users)

Go to `/signup`. Fill in name (min 20 chars), email, address, password, confirm password. This creates a Normal User account only — store owners are created by the admin.
