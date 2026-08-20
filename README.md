# Store Review Hub

Build a production-quality React frontend (Vite + React + TypeScript + React Router + Tailwind CSS) for a Store Rating Platform. Do NOT build a real backend, database, or Auth provider. Use a clean API service layer with mock data that I can later replace with real REST API calls.

APP OVERVIEW

A web app where users rate stores (1–5). One login system for three roles:

1) System Administrator

2) Normal User

3) Store Owner

After login, show different dashboards/pages based on role.

DESIGN

- Clean, modern SaaS admin style (neutral colors, clear tables, readable forms)

- Responsive (desktop + mobile)

- Consistent layout: top navbar with app name “Store Ratings”, logged-in user info, Logout

- Role-based navigation

- Reusable components: DataTable (sortable columns), Search/Filter bar, Modal forms, Rating stars (1–5), Toast notifications, ProtectedRoute

- Loading and empty states for all lists

AUTH & ROUTING

Public routes:

- /login

- /signup (Normal User only)

Protected routes by role:

Admin:

- /admin/dashboard

- /admin/users

- /admin/stores

- /admin/users/:id (user detail)

- /admin/add-user

- /admin/add-store

Normal User:

- /user/stores

- /user/update-password

Store Owner:

- /owner/dashboard

- /owner/update-password

Rules:

- Unauthenticated users redirected to /login

- Wrong-role access redirected to that role’s home page

- Persist mock auth session in localStorage for demo

LOGIN

- Email + Password

- On success, redirect by role:

  - admin → /admin/dashboard

  - user → /user/stores

  - owner → /owner/dashboard

SIGNUP (Normal User only)

Fields: Name, Email, Address, Password, Confirm Password

Client-side validation (strict):

- Name: min 20, max 60 characters

- Address: max 400 characters

- Password: 8–16 chars, at least 1 uppercase letter, at least 1 special character

- Email: standard email format

- Confirm Password must match Password

Show inline field errors.

UPDATE PASSWORD (User + Store Owner)

Same password validation rules as signup.

========================

ADMIN FEATURES

========================

1) Dashboard (/admin/dashboard)

Cards:

- Total Users

- Total Stores

- Total Ratings

2) Manage Users (/admin/users)

- Table columns: Name, Email, Address, Role

- Filters: Name, Email, Address, Role (ADMIN / USER / OWNER)

- Sorting ASC/DESC on Name, Email, Address, Role

- Actions: View details, Add User button

3) Add User (/admin/add-user)

Form fields: Name, Email, Password, Address, Role (ADMIN / USER / OWNER)

Apply same validations as signup.

Role selector required.

4) User Detail (/admin/users/:id)

Show: Name, Email, Address, Role

If role is Store Owner, also show their store’s average Rating.

5) Manage Stores (/admin/stores)

- Table columns: Name, Email, Address, Rating (average)

- Filters: Name, Email, Address

- Sorting ASC/DESC on Name, Email, Address, Rating

- Add Store button

6) Add Store (/admin/add-store)

Fields: Store Name, Email, Address, Store Owner (select from existing owners)

Validations:

- Store Name: min 20, max 60

- Address: max 400

- Email: valid email

========================

NORMAL USER FEATURES

========================

Stores list (/user/stores)

- Search by Name and Address

- Sort by Name, Address, Overall Rating

- Each row/card shows:

  - Store Name

  - Address

  - Overall Rating (average)

  - My Submitted Rating (or “Not rated”)

  - Submit Rating (if not rated)

  - Modify Rating (if already rated)

- Rating input: integer 1 to 5 (star UI preferred)

- After submit/update, refresh that store’s “My Rating” and overall rating in UI

========================

STORE OWNER FEATURES

========================

Dashboard (/owner/dashboard)

- Average rating of MY store (large metric)

- Table of users who rated my store:

  Columns: User Name, User Email, Rating, Submitted At (optional)

- Sorting on Name, Email, Rating

========================

SHARED REQUIREMENTS

========================

- All major tables support ascending/descending sort on key fields (Name, Email, Address, Role, Rating)

- Filters/search update the list instantly (client-side for mock)

- Logout clears session and goes to /login

- Forms disable submit while “saving”

- Friendly error messages

API SERVICE LAYER (IMPORTANT)

Create services like:

- authService.login / signup / logout / updatePassword

- adminService.getDashboardStats / getUsers / getUserById / createUser / getStores / createStore

- userService.getStores / submitRating / updateRating

- ownerService.getDashboard

Use typed TypeScript interfaces:

User { id, name, email, address, role }

Store { id, name, email, address, averageRating, ownerId }

Rating { id, userId, storeId, value (1-5), createdAt }

Seed mock data with:

- 1 admin

- 2 normal users

- 2 store owners

- 3 stores

- several ratings

Keep API base URL in one config file:

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

Structure mock calls so I can later replace them with fetch/axios to real endpoints without rewriting pages.

PROJECT STRUCTURE

Use clean folders:

src/components, src/pages, src/layouts, src/services, src/types, src/context (AuthContext), src/utils/validation

Deliver a complete runnable React app with all pages wired and working with mock data.



The UI should be very attractive and advanced ....

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://store-star-gazer.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/470bbe36-1d86-428d-87c6-94af60d8b5f2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
