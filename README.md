# Note Saver

A full-stack MERN application for creating and managing notes, plus a
Google-Drive-style **My Drive** area for uploading and storing real files
(PDF, Word, Excel, PowerPoint, images, text/CSV).

The project is split into exactly two top-level folders:

```
note-saver/
├── frontend/   → React + TypeScript + Vite client
└── backend/    → Node.js + Express + MongoDB API
```

---

## Features

- **User authentication** — email/password (JWT) and Google OAuth login
- **Notes** — create, edit, search, sort, copy, share, delete
- **My Drive (new)** — drag-and-drop upload of PDFs, DOCX/DOC, XLS/XLSX,
  PPT/PPTX, TXT/CSV, and images (PNG/JPG/GIF/WEBP/SVG), with:
  - Upload progress bar
  - File type icon + color coding, image thumbnails
  - View (opens in a new tab) and Download actions
  - Delete with confirmation
  - 25MB per-file limit, enforced on both client and server
- **Trash (new)** — deleting a note or a drive file no longer removes it
  right away. It moves to Trash, where you can restore it or delete it
  forever. Items left in Trash are automatically and permanently purged
  after 30 days (configurable). A "Empty trash" action is also available
  for immediate cleanup.
- Dark/light theme toggle, responsive UI (Tailwind CSS)

---

## Tech Stack

### Frontend (`/frontend`)
- React 18 + TypeScript, Vite
- Redux Toolkit for state management
- React Router
- Tailwind CSS, Lucide React icons
- Axios

### Backend (`/backend`)
- Node.js + Express.js
- MongoDB + Mongoose
- JWT authentication, bcrypt password hashing
- **Multer** for handling file uploads (new)
- CORS

### Database
- MongoDB (notes + user data + uploaded-file **metadata**)
- Uploaded files themselves are stored on the server's local disk under
  `backend/uploads/` — only their metadata (name, size, type, owner) lives
  in MongoDB

---

## Project Structure

```
note-saver/
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, FileCard, DriveFileCard, TrashNoteCard,
│   │   │                     # TrashDriveCard, etc.
│   │   ├── pages/             # Home, AllFiles, MyDrive, Trash, Login, Signup...
│   │   ├── store/
│   │   │   └── slices/        # authSlice, fileSlice, driveSlice, themeSlice
│   │   ├── utils/              # fileHelpers.js (size formatting, icons)
│   │   └── App.tsx
│   ├── .env.example
│   └── package.json
│
└── backend/
    ├── config/
    │   └── db.js               # MongoDB connection
    ├── controllers/
    │   ├── authController.js
    │   ├── fileController.js   # notes CRUD + trash (soft delete/restore/purge)
    │   └── uploadController.js # drive file upload/list/download/delete + trash
    ├── middleware/
    │   ├── auth.js             # JWT "protect" middleware
    │   └── upload.js           # Multer config, allowed types, size limit
    ├── models/
    │   ├── User.js
    │   ├── File.js              # a note (title + content, + isDeleted/deletedAt)
    │   └── Upload.js            # uploaded file metadata (+ isDeleted/deletedAt)
    ├── routes/
    │   ├── auth.js
    │   ├── files.js
    │   └── uploads.js
    ├── utils/
    │   └── trashCleanup.js      # auto-purges trash older than 30 days (new)
    ├── uploads/                 # uploaded files are stored here (gitignored)
    ├── .env.example
    └── server.js
```

---

## Getting Started

### Prerequisites
- Node.js v18+ and npm
- A MongoDB connection string (MongoDB Atlas or a local MongoDB instance)

### 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `backend/.env`:

```
NODE_ENV=development
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=a-long-random-secret
CLIENT_URLS=http://localhost:5173
```

Start the API:

```bash
npm run dev      # nodemon, auto-restarts on changes
# or
npm start
```

The API runs at `http://localhost:5000`. Uploaded files are written to
`backend/uploads/` (this folder is created automatically and is gitignored).

### 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in `frontend/.env`:

```
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

Start the client:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

> Note: `fileSlice.js` and `authSlice.js` currently point at a hardcoded
> production API URL rather than reading `VITE_BACKEND_URL`. For local
> development, either edit the `API_URL` constant at the top of those two
> files to `http://localhost:5000/api/...`, or point `VITE_BACKEND_URL`
> at your deployed backend. The new `driveSlice.js` already reads
> `VITE_BACKEND_URL` correctly.

---

## API Reference

### Auth — `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Log in with email/password |
| POST | `/google-login-api` | Log in with Google OAuth |
| GET | `/me` | Get the current user (requires auth) |

### Notes — `/api/files`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List the current user's (non-trashed) notes |
| POST | `/` | Create a note (`title`, `content`) |
| GET | `/:id` | Get a single note |
| PUT | `/:id` | Update a note |
| DELETE | `/:id` | Move a note to trash (soft delete) |
| GET | `/trash` | List the current user's trashed notes |
| PUT | `/:id/restore` | Restore a note out of trash |
| DELETE | `/:id/permanent` | Permanently delete a single trashed note |
| DELETE | `/trash` | Empty the notes trash (permanently deletes everything in it) |

### My Drive — `/api/uploads`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List the current user's (non-trashed) uploaded files |
| POST | `/` | Upload a file — `multipart/form-data`, field name `file` |
| GET | `/:id/download` | Stream/download a file (also used to view it) |
| DELETE | `/:id` | Move a file to trash (soft delete; the file stays on disk) |
| GET | `/trash` | List the current user's trashed files |
| PUT | `/:id/restore` | Restore a file out of trash |
| DELETE | `/:id/permanent` | Permanently delete a single trashed file (DB + disk) |
| DELETE | `/trash` | Empty the drive trash (permanently deletes everything in it) |

All routes above require `Authorization: Bearer <token>` except register/login.

Allowed upload types: PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, PNG, JPG,
JPEG, GIF, WEBP, SVG. Max size: 25MB per file (change `MAX_FILE_SIZE` in
`backend/middleware/upload.js` and the matching constant in
`frontend/src/pages/MyDrive.jsx` if you need a different limit).

### Trash & retention

Deleting a note or a drive file is a **soft delete**: it's flagged
`isDeleted: true` with a `deletedAt` timestamp and simply disappears from
the normal list, while still being visible on the `/trash` page with
Restore / Delete forever actions.

A background job (`backend/utils/trashCleanup.js`) runs once when the
server starts and then once every 24 hours, permanently deleting anything
that's been in trash longer than the retention window. Configure it via
`backend/.env`:

```
TRASH_RETENTION_DAYS=30
```

---

## Important security note

The original project's `.env` file contained a live MongoDB Atlas
connection string (with username and password) and was included in the
uploaded project archive. Treat that password as compromised:
**rotate/change the MongoDB user's password in Atlas** and update
`MONGODB_URI` before deploying this anywhere public, and make sure `.env`
files are never committed to git (they're already covered by
`.gitignore` in both folders).

---

## Deployment notes

- The backend's CORS is controlled by `CLIENT_URLS` in `backend/.env` — a
  comma-separated list of allowed frontend origins (e.g. your local dev
  URL and your deployed Vercel URL).
- Uploaded files are stored on local disk (`backend/uploads/`). This works
  for a single server instance, but **is not durable on most serverless /
  ephemeral hosts** (e.g. Render's free tier, Vercel functions) — the
  files can be wiped on redeploy or restart. For production use on such
  platforms, swap the storage layer in `backend/middleware/upload.js` and
  `backend/controllers/uploadController.js` for a persistent object store
  (e.g. AWS S3, Cloudinary, or a mounted disk).
- Make sure the deployed backend has write access to its filesystem if you
  keep local disk storage.

---

## License

MIT
