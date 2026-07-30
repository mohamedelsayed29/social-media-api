# Social Media API

A production-oriented REST + WebSocket backend for a social network, built with **Node.js**, **Express 5**, **TypeScript**, **MongoDB/Mongoose**, and **Socket.IO**.

It covers the full social feature set: authentication (local + Google), email verification and password recovery via OTP, user profiles, a friend-request graph, posts with attachments, nested comments and replies, real-time one-to-one and group chat, live notifications, and S3-backed media storage.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Authentication Model](#authentication-model)
- [API Reference](#api-reference)
- [Real-Time Events](#real-time-events)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [File Uploads](#file-uploads)
- [Security Notes](#security-notes)

---

## Features

| Domain | Capabilities |
| --- | --- |
| **Authentication** | Email/password signup, OTP email confirmation, login, Google Sign-In (signup + login), forgot/verify/reset password flow |
| **Sessions** | Dual JWT (access + refresh), role-scoped signatures, JTI revocation list, single-device or all-device logout |
| **Users** | Profile read/update, public profiles, user search, profile & cover image upload, soft freeze, admin restore, admin hard delete |
| **Social Graph** | Send / accept / reject / cancel friend requests, unfriend, incoming & outgoing request listing |
| **Posts** | Create & update with up to 3 attachments, visibility scopes (`PUBLIC` / `FRIENDS` / `ONLY_ME`), like/unlike, save/unsave, user tagging, comment toggle |
| **Comments** | Comments on posts, threaded replies, attachments, like/unlike |
| **Chat** | Persistent 1:1 conversations, group chats with roles (`admin` / `member`), group avatar, member management |
| **Notifications** | Persisted notifications for friend requests and post likes, unread counter, bulk mark-as-read, live push |
| **Storage** | AWS S3 upload (single & multipart), streamed downloads, presigned URLs, single & bulk deletion |
| **Hardening** | Helmet, CORS, IP rate limiting, Zod request validation, bcrypt hashing, paranoid (soft-delete-aware) queries |

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js (CommonJS output) |
| Language | TypeScript 5 (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| Framework | Express 5 |
| Database | MongoDB via Mongoose 9 |
| Real-time | Socket.IO 4 |
| Validation | Zod 4 |
| Auth | jsonwebtoken, bcrypt, google-auth-library |
| Storage | AWS SDK v3 (S3, lib-storage, s3-request-presigner) |
| Uploads | Multer 2 |
| Email | Nodemailer (Gmail SMTP) driven by a Node `EventEmitter` |
| Security | Helmet, CORS, express-rate-limit |

---

## Architecture

The codebase follows a **layered, module-per-domain** design:

```
Request
   │
   ├─ Rate limiter → Helmet → CORS → JSON parser        (app.controller.ts)
   │
   ├─ Router                                            (modules/<domain>/*.controller.ts)
   │     ├─ authenticationMiddleware   → verifies JWT, loads user
   │     ├─ authorizationMiddleware    → enforces role allow-list
   │     ├─ multer (cloudFileUpload)   → parses multipart uploads
   │     └─ validation(schema)         → Zod-validates body/params/query/headers
   │
   ├─ Service                                           (modules/<domain>/*.service.ts)
   │     └─ business rules, S3 orchestration, event emission
   │
   ├─ Repository                                        (db/repository/*.repository.ts)
   │     └─ generic DatabaseRepository<T> — CRUD, pagination, populate, lean
   │
   └─ Model                                             (db/models/*.model.ts)
         └─ Mongoose schemas, hooks, virtuals
```

**Key design decisions**

- **Generic repository** — `DatabaseRepository<TDocument>` centralises `create`, `find`, `findOne`, `updateOne`, `findOneAndUpdate`, `deleteOne`, and `paginate`, so services never touch Mongoose queries directly.
- **Per-module authorization tables** — each module exports an `endPoint` map (e.g. `endPoint.hardDeleteAccount: [RoleEnum.admin]`) making the role matrix explicit and reviewable in one file per domain.
- **Declarative validation** — `validation({ body, params, query })` accepts a Zod schema per request key and aggregates every failure into one `400` payload rather than short-circuiting on the first error.
- **Event-driven side effects** — transactional email is emitted through `emailEventEmitter`, keeping SMTP latency off the request path.
- **Realtime bridges** — `post.realtime.ts` and `notification.realtime.ts` receive the Socket.IO server via a setter at boot, letting plain HTTP services push events without importing the gateway (avoiding a circular dependency).
- **Paranoid queries** — `pre('find')` / `pre('findOne')` hooks exclude soft-deleted documents unless the query opts out with `paranoid: false`.

---

## Project Structure

```
src/
├── index.ts                     # Entry point → bootstrap()
├── app.controller.ts            # Express app, middleware, route mounting, S3 asset routes
│
├── common/
│   ├── enums/                   # Gender, Role, Provider, Availability, TokenType, Storage…
│   └── interface/               # IUser, IPost, IComment, IChat, INotification, IToken…
│
├── db/
│   ├── connection.db.ts         # Mongoose connection
│   ├── models/                  # user, post, comment, chat, notification, friendRequest, token
│   └── repository/              # DatabaseRepository<T> + one repository per model
│
├── middleware/
│   ├── authentication.middleware.ts   # authenticationMiddleware / authorizationMiddleware
│   └── validation.middleware.ts       # Zod validation + shared generalFields
│
├── modules/
│   ├── auth/                    # controller · service · dto · validation · entities
│   ├── user/                    # + authorization matrix
│   ├── post/                    # + realtime bridge
│   ├── comment/
│   ├── chat/                    # + gateway · events (Socket.IO)
│   ├── notification/            # + realtime bridge
│   ├── gateway/                 # Socket.IO server init, auth handshake, presence map
│   └── controller.index.ts      # Barrel export of all routers
│
├── templates/                   # HTML email templates
└── utils/
    ├── email/                   # Nodemailer transport
    ├── event/                   # emailEventEmitter listeners
    ├── multer/                  # cloud.multer, s3.config, s3.event
    ├── response/                # successResponse + typed exception classes + globalErrorHandler
    ├── security/                # hash.security, token.security
    ├── types/                   # Express Request augmentation
    └── otp.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local instance or MongoDB Atlas)
- An AWS S3 bucket with programmatic access
- A Gmail account with an app password (for OTP delivery)
- A Google Cloud OAuth **Web** client ID (for Google Sign-In)

### Installation

```bash
git clone https://github.com/mohamedelsayed29/social-media-api.git
cd "Social Media Backend"
npm install
```

### Configuration

Environment files live in `config/` (git-ignored) and are selected by `NODE_ENV`:

```bash
mkdir -p config
touch config/.env.development   # populate using the table below
```

`app.controller.ts` loads `config/.env.development` whenever `NODE_ENV !== "production"`. In production the process expects the variables to be injected by the host (systemd, Docker, PM2, ECS, …).

### Run

```bash
npm run dev     # compile + watch + auto-restart
```

```bash
npm run build   # tsc → dist/
npm start       # node dist/index.js
```

The server listens on `PORT` (default `3000`) and exposes a health check at `GET /`.

---

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | `development` \| `production` — also controls stack traces in error responses | `development` |
| `APPLICATION_NAME` | Display name used as the email sender | `Social Media App` |
| `DB_URI` | MongoDB connection string | `mongodb://localhost:27017/social_media_app` |
| `SALT_ROUNDS` | bcrypt cost factor | `10` |
| `EMAIL` | Gmail address used for outbound mail | `you@gmail.com` |
| `EMAIL_PASSWORD` | Gmail **app password** (not the account password) | `xxxx xxxx xxxx xxxx` |
| `ACCESS_USER_TOKEN_SIGNATURE` | HMAC secret — user access tokens | *(random 64+ chars)* |
| `REFRESH_USER_TOKEN_SIGNATURE` | HMAC secret — user refresh tokens | *(random 64+ chars)* |
| `ACCESS_SYSTEM_TOKEN_SIGNATURE` | HMAC secret — admin access tokens | *(random 64+ chars)* |
| `REFRESH_SYSTEM_TOKEN_SIGNATURE` | HMAC secret — admin refresh tokens | *(random 64+ chars)* |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token lifetime, seconds | `3600` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token lifetime, seconds | `31536000` |
| `WEB_CLIENT_IDS` | Comma-separated Google OAuth client IDs accepted as ID-token audiences | `xxx.apps.googleusercontent.com` |
| `AWS_BUCKET_NAME` | S3 bucket for media | `my-social-bucket` |
| `AWS_REGION` | S3 region | `us-east-1` |
| `AWS_S3_ACCESS_KEY_ID` | IAM access key | `AKIA…` |
| `AWS_S3_SECRET_ACCESS_KEY` | IAM secret key | — |
| `AWS_PRESIGNED_URL_EXPIRES_IN_SECONDS` | Presigned URL TTL | `120000` |

> Never commit real values. The whole `config/` directory is git-ignored; keep a redacted `.env.example` at the project root as the tracked template.

---

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Builds once, then runs `tsc -watch` and `node --watch dist/index.js` concurrently |
| `npm run build` | Type-checks and compiles `src/` → `dist/` |
| `npm start` | Runs the compiled server from `dist/index.js` |

---

## Authentication Model

**Token issuance.** On login the server derives a *signature level* from the user's role — `Bearer` for `user`, `System` for `admin` — and signs the access and refresh tokens with the matching secret pair. Both tokens share a single `jti` (UUID v4).

**Header format.** Requests carry a two-part authorization header:

```http
Authorization: <SignatureLevel> <token>
```

`Bearer` selects the user secrets, `System` selects the admin secrets, and any other prefix falls through to the user secrets — which is why the reference frontend sends `USER <token>` successfully.

**Verification pipeline** (`decodeToken`):

1. Split the header into signature level and token.
2. Verify the JWT against the access or refresh secret for that level.
3. Reject if the token's `jti` appears in the `Token` revocation collection.
4. Load the user; reject if not found or soft-frozen.
5. Reject if `user.changeCredentialTime` is newer than the token's `iat` — this invalidates every token issued before a password reset.

**Logout.** `POST /api/users/logout` accepts `flag: "only" | "all"`. `only` writes the current `jti` to the revocation list; `all` stamps `changeCredentialTime`, invalidating every outstanding token for that user.

**Refresh.** `POST /api/users/refresh-token` is called with the refresh token in the authorization header; it revokes the old `jti` and returns a fresh credential pair.

---

## API Reference

Base URL: `http://localhost:3000`

Successful responses follow a consistent envelope:

```json
{ "statusCode": 200, "message": "Success", "data": { } }
```

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/signup` | — | Register with email/password; emails a 6-digit OTP |
| `PATCH` | `/confirm-email` | — | Confirm the account with `{ email, otp }` |
| `POST` | `/login` | — | Authenticate; returns `{ credentials }` |
| `POST` | `/signup-gmail` | — | Register using a Google ID token |
| `POST` | `/login-gmail` | — | Sign in using a Google ID token |
| `PATCH` | `/forgot-password` | — | Email a password-reset OTP |
| `PATCH` | `/verfiy-forgot-password` | — | Validate the reset OTP *(spelling as implemented)* |
| `PATCH` | `/reset-forgot-password` | — | Set a new password using the verified OTP |

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/profile` | user, admin | Current user with friends and saved posts |
| `PATCH` | `/profile` | access | Update profile fields |
| `GET` | `/search?q=` | access | Search users by name, email, or slug (max 20), annotated with friendship status |
| `GET` | `/friend-requests?type=incoming\|outgoing` | access | List pending friend requests |
| `GET` | `/:userId` | access | Public profile plus that user's visible posts |
| `PATCH` | `/profile-image` | access | Upload avatar — field `image`, ≤ 5 MB, JPEG/PNG |
| `PATCH` | `/profile-cover-image` | access | Upload cover images — field `images`, up to 5 files |
| `POST` | `/:userId/friend-requests` | user | Send a friend request |
| `PATCH` | `/:requestId/accept` | user | Accept a request |
| `PATCH` | `/:requestId/reject` | user | Reject a request |
| `DELETE` | `/:requestId/friend-requests` | user | Cancel a sent request |
| `DELETE` | `/:userId/friend` | user | Remove a friend |
| `POST` | `/logout` | access | `{ flag: "only" \| "all" }` |
| `POST` | `/refresh-token` | refresh | Rotate credentials |
| `DELETE` | `/:userId?/freeze-account` | access | Soft-delete own (or, as admin, another) account |
| `PATCH` | `/:userId?/restore-account` | **admin** | Restore a frozen account |
| `DELETE` | `/:userId/hard-delete-account` | **admin** | Permanently delete an account |

### Posts — `/api/post`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | access | Feed filtered by post availability and friendship |
| `POST` | `/` | user, admin | Create a post — multipart field `attachments` (≤ 3 images) |
| `PATCH` | `/:postId` | user, admin | Update a post (author only) |
| `PATCH` | `/:postId/like?action=like\|unlike` | user, admin | Toggle like; notifies the author |
| `PATCH` | `/:postId/save?action=save\|unsave` | user, admin | Toggle bookmark |

### Comments — `/api/post/:postId/comment`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/` | user, admin | Comment on a post (≤ 3 attachments) |
| `POST` | `/:commentId/reply` | user, admin | Reply to a comment |
| `PATCH` | `/:commentId/like?action=like\|unlike` | user, admin | Toggle a comment like |

### Chat — `/api/chat` and `/api/users/:userId/chat`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/users/:userId/chat` | user, admin | Fetch (or lazily create) the 1:1 conversation with `:userId` |
| `POST` | `/api/chat/groups` | access | Create a group — multipart field `image`, ≤ 5 MB |
| `GET` | `/api/chat/groups` | access | List the caller's groups |
| `GET` | `/api/chat/groups/:groupId` | access | Group details and message history |
| `PATCH` | `/api/chat/groups/:groupId/members` | access | Add members (admin role within the group) |

### Notifications — `/api/notifications`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | access | Notifications plus `unreadCount` |
| `PATCH` | `/read` | access | Mark all as read |

### Assets & Storage

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Health check |
| `GET` | `/upload/*path` | Stream an S3 object; `?downloadName=` forces a download |
| `GET` | `/upload/presigned-url/*path` | Issue a presigned GET URL (`?downloadName=`, `?download=`) |
| `GET` | `/delete-s3?key=` | Delete one object |
| `GET` | `/delete-s3-multiple?urls=` | Delete many objects |
| `GET` | `/list-directory/*path` | Resolve a directory key |

> The storage routes are currently mounted without authentication middleware. Protect them before exposing the service publicly — see [Security Notes](#security-notes).

---

## Real-Time Events

Socket.IO is attached to the same HTTP server. Clients authenticate during the handshake:

```ts
io("http://localhost:3000", {
  auth: { authorization: `USER ${accessToken}` },
});
```

The handshake middleware runs the same `decodeToken` pipeline as HTTP requests and rejects with `Authentication failed` on error. A `Map<userId, socketId[]>` tracks presence, so a user connected from several tabs or devices receives every event on all of them; entries are pruned on `disconnect`.

### Client → Server

| Event | Payload | Description |
| --- | --- | --- |
| `sayHi` | `(message, callback)` | Connectivity/ack probe |
| `sendMessage` | `{ content, sendTo }` | Send a direct message |
| `sendGroupMessage` | `{ content, groupId }` | Send a group message |

### Server → Client

| Event | Payload | Description |
| --- | --- | --- |
| `newMessage` | `{ content, from, chatId }` | Incoming direct message |
| `successMessage` | `{ content, sendTo, chatId }` | Delivery ack for the sender |
| `newGroupMessage` | `{ content, from, groupId }` | Incoming group message |
| `successGroupMessage` | `{ … }` | Group delivery ack for the sender |
| `notification` | `{ notification }` | Friend request or post-like notification |
| `postCreated` | `{ post }` | New post, fanned out to the eligible audience |
| `custom_error` | `{ message }` | Socket-scope error |

---

## Data Models

| Model | Notable fields |
| --- | --- |
| **User** | `firstName`, `lastName`, `slug`, `email` (unique), `phoneNumber`, `gender`, `address`, `password` (bcrypt, optional for Google accounts), `profileImage`, `coverImage[]`, `confirmEmailOtp`, `confirmedAt`, `resetPasswordOtp`, `changeCredentialTime`, `role`, `provider`, `friends[]`, `savedPosts[]`, `freezeedAt`/`freezeedBy`, `restoredAt`/`restoredBy` — plus a `username` virtual that splits into `firstName`/`lastName` and derives `slug` |
| **Post** | `content` (required unless attachments exist), `attachments[]`, `assetPostFolderId`, `allowComments`, `availability`, `tags[]`, `likes[]`, `createdBy`, soft-delete stamps |
| **Comment** | `content`, `attachments[]`, `tags[]`, `likes[]`, `postId`, `commentId` (self-reference for replies), `createdBy` |
| **Chat** | `participants[]` (1:1), `members[]` with `role: admin \| member` (groups), `group`, `groupDescription`, `groupImage`, `roomId`, embedded `messages[]` |
| **Notification** | `recipient` (indexed), `actor`, `type: friend_request \| post_like`, `message` (≤ 180 chars), `post`, `friendRequest`, `readAt` |
| **FriendRequest** | `createdBy`, `sendTo`, `acceptedAt` |
| **Token** | `jti` (unique), `expiersIn`, `userId` — the JWT revocation list |

Passwords and OTPs are hashed by a `pre('save')` hook, so plaintext never reaches the database.

---

## Error Handling

Typed exceptions in `utils/response/error.responce.ts` extend `ApplicationException` and carry their own status code:

| Exception | Status |
| --- | --- |
| `BadRequestException` | 400 |
| `UnauthorizedException` / `TokenExpiredException` | 401 |
| `ForbiddenException` | 403 |
| `NotFoundException` | 404 |
| `ConflictException` | 409 |
| `TooManyRequestsException` | 429 |
| `InternalServerErrorException` | 500 |

`globalErrorHandler` normalises every failure:

```json
{
  "err_message": "Validation Failed",
  "cause": [
    { "key": "body", "issues": [{ "message": "Invalid email", "path": "email" }] }
  ],
  "stack": "… (development only)"
}
```

Validation failures aggregate **all** Zod issues across `body`, `params`, `query`, and `headers` into a single response.

---

## File Uploads

`cloudFileUpload({ validation, storageApproach, maxSize })` returns a configured Multer instance:

- **Storage** — `StorageEnum.memory` (buffer) or `StorageEnum.disk` (temporary file with a UUID-prefixed name).
- **MIME allow-list** — `fileValidation.images` (`image/jpeg`, `image/png`, `image/jpg`) and `fileValidation.pdf`.
- **Size cap** — `maxSize` in MB, default 2.

Accepted files are uploaded to S3 (`lib-storage` handles multipart for large objects) and the resulting key is stored on the document. Downloads are streamed through `GET /upload/*path` via `stream.pipeline`, or handed to the client as a presigned URL. Deleting a post or account triggers cascading S3 cleanup through `s3.event`.

---

## Security Notes

Implemented safeguards:

- Helmet security headers with a cross-origin resource policy for media
- IP rate limiting — 2000 requests per hour, `429` on breach
- bcrypt password and OTP hashing with a configurable cost factor
- Role-scoped JWT signatures, JTI revocation, and credential-change invalidation
- Zod schema validation on every mutating endpoint
- Google ID tokens verified against an explicit audience allow-list
- Soft deletion with paranoid query hooks

Recommended before a public deployment:

1. **Rotate the committed credentials.** Environment files under `config/` were tracked in git until commit `3b7fc08` and remain recoverable from the repository history. Rotate the MongoDB Atlas password, the AWS IAM key pair, the Gmail app password, and all four JWT signing secrets — then purge the history (`git filter-repo`) or recreate the repository.
2. **Protect the storage routes.** `/upload/*`, `/delete-s3`, `/delete-s3-multiple`, and `/list-directory/*` currently accept unauthenticated requests, and the delete routes mutate state over `GET`. Add `authenticationMiddleware`, restrict deletion to owners or admins, and switch them to `DELETE`.
3. **Restrict CORS.** Both the Express `cors()` middleware and the Socket.IO server default to `origin: "*"`. Pin them to your frontend origin.
4. **Fail fast on database errors.** `connectDB` logs and swallows connection failures, so the process stays up while every query fails. Exit with a non-zero code instead.
5. **Trim error payloads.** `globalErrorHandler` serialises the raw error object alongside the message; return only the message and cause in production.

---

## License

ISC
