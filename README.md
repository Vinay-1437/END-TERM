# Smart Campus Management Platform

A full-stack MERN application for managing academic activities, facilities, and campus information. Built for students, faculty, and administrators.

---

## Features

| Module | Description |
|---|---|
| **Authentication** | Register, login, logout with JWT + HTTP-only cookies |
| **Role-Based Access** | Student, Faculty, Admin — enforced on the backend |
| **Assignments** | Faculty creates; students track their own status independently |
| **Room Booking** | Book classrooms/labs; conflict checks prevent double-booking |
| **Announcements** | Faculty/Admin post; students search and filter |
| **Lost & Found** | Students post items; image upload via Cloudinary |
| **Clubs & Events** | Join clubs, register for events with capacity control |
| **Notifications** | Persistent notifications + real-time delivery via Socket.IO |
| **Campus Chat** | Real-time direct messaging using Socket.IO |
| **Admin Panel** | User management, room management, booking approvals |

---

## Technology Stack

**Frontend:** React 18 · Vite · Tailwind CSS · React Router DOM · Axios · Socket.IO Client · Lucide React · date-fns  
**Backend:** Node.js · Express.js · MongoDB · Mongoose · Socket.IO · JWT · bcryptjs · Multer · Cloudinary

---

## Project Structure

```
P:\END TERM\
├── backend/
│   ├── config/         ← DB connection, Cloudinary setup
│   ├── controllers/    ← Route handler logic
│   ├── middleware/     ← Auth, authorization, error handling
│   ├── models/         ← Mongoose schemas
│   ├── routes/         ← Express route definitions
│   ├── socket/         ← Socket.IO event handlers
│   ├── utils/          ← JWT helper, notification sender
│   ├── .env            ← Your local environment variables (not committed)
│   ├── .env.example    ← Template for environment variables
│   └── server.js       ← Entry point
│
└── frontend/
    ├── src/
    │   ├── components/ ← Reusable UI (Button, Card, Modal, etc.)
    │   ├── context/    ← AuthContext, NotificationContext
    │   ├── layouts/    ← MainLayout with Navbar
    │   ├── pages/
    │   │   ├── admin/  ← Admin dashboard, users, rooms, clubs
    │   │   ├── faculty/
    │   │   └── student/← Dashboard, assignments, bookings, etc.
    │   ├── routes/     ← AppRoutes with protected route wrapper
    │   ├── services/   ← Axios API calls
    │   └── utils/      ← Date formatting, error helpers
    └── vite.config.js
```

---

## Prerequisites

- Node.js 18 or later
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI
- npm

---

## Installation

### 1. Clone / navigate to the project

```bash
cd "P:\END TERM"
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_campus
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Optional — needed only for Lost & Found image uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note:** Cloudinary credentials are optional. If they are missing, the rest of the application works normally — images just won't be stored.

### 4. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Running Locally

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd "P:\END TERM\backend"
npm run dev
```
The server starts at `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd "P:\END TERM\frontend"
npm run dev
```
The app opens at `http://localhost:5173`

---

## Database Setup

MongoDB runs automatically when you start the backend — it connects to the URI in `.env`. No manual schema setup is needed; Mongoose creates collections on first use.

To create an admin user, register a normal account first, then update the role directly in MongoDB:

```javascript
// In mongosh
use smart_campus
db.users.updateOne({ email: "admin@college.edu" }, { $set: { role: "admin" } })
```

---

## User Roles

| Role | Access |
|---|---|
| **Student** | Dashboard, assignments, room booking, announcements, lost & found, clubs, events, chat |
| **Faculty** | All student features + create assignments, post announcements, create events |
| **Admin** | Full access + user management, room management, booking approvals, club management |

> Public registration always creates a **student** account. Role promotion is done by an admin.

---

## API Overview

| Prefix | Purpose |
|---|---|
| `POST /api/auth/register` | Register new student |
| `POST /api/auth/login` | Login |
| `GET /api/auth/me` | Get current session |
| `GET /api/assignments` | List assignments |
| `POST /api/assignments` | Create assignment (faculty) |
| `PUT /api/assignments/:id/status` | Mark own assignment status (student) |
| `GET /api/rooms` | List rooms |
| `POST /api/bookings` | Create booking request |
| `PUT /api/bookings/:id/status` | Approve/reject (admin) |
| `GET /api/announcements` | List announcements |
| `POST /api/lost-found` | Create lost/found post |
| `GET /api/clubs` | List clubs |
| `POST /api/clubs/:id/join` | Join club (student) |
| `GET /api/events` | List events |
| `POST /api/events/:id/register` | Register for event |
| `GET /api/notifications` | Get notifications |
| `GET /api/conversations` | List chat conversations |
| `GET /api/dashboard/student` | Student dashboard data |
| `GET /api/dashboard/admin` | Admin stats |
| `GET /api/users` | All users (admin only) |
| `GET /api/users/directory?search=name` | Search active campus users for chat (authenticated; limited fields) |

All protected endpoints require a valid session cookie. All role-restricted endpoints enforce authorization on the backend.

---

## Testing

Use **Postman** to test backend endpoints:

1. `POST /api/auth/register` with `{ name, email, password }`
2. `POST /api/auth/login` — the response sets an HTTP-only cookie
3. All subsequent requests send that cookie automatically (enable "Send cookies" in Postman)

Recommended test order:
1. Register + login as student → verify dashboard loads
2. Promote to admin in MongoDB → test admin endpoints
3. Register a faculty account → create assignment → login as student → mark status
4. Create a room as admin → book as student → approve as admin → verify no double-booking

---

## Quality checks before submission

- Test the primary workflows using separate student, faculty, and admin accounts.
- Verify room booking conflicts and event capacity with boundary cases.
- Test failed requests and expired sessions, not only successful paths.
- Keep `.env` local; share `.env.example` with placeholder values only.
- Use the campus directory endpoint for chat discovery; the administrative user-management endpoint remains admin-only.

## Known Limitations

- Socket.IO token authentication uses `sessionStorage` as a workaround in development; a production setup would use a short-lived socket token endpoint
- The faculty dashboard reuses the student dashboard; faculty-specific analytics can be added in a later phase
- Cloudinary image upload for Lost & Found requires valid credentials in `.env`
- Chat message search and read receipts are not implemented in this version
