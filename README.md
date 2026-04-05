# Finance Dashboard Backend

A robust, modular, and type-safe backend API for a Finance Dashboard. Built using Node.js, Express, TypeScript, Prisma, and PostgreSQL. It features a complete Role-Based Access Control (RBAC) system, soft deletes, rate limiting, structured query validations, short-lived JWT authentication with refresh token rotation, and Redis caching for dashboard endpoints.

---

## 🛠️ Tech Stack
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (hosted via Supabase)
- **ORM:** Prisma
- **Cache:** Redis (via Upstash)
- **Validation:** Zod
- **Auth:** `jsonwebtoken` + `bcryptjs`
- **Security:** `express-rate-limit`, CORS

---

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Required:
- `DATABASE_URL` and `DIRECT_URL` — from Supabase dashboard
- `JWT_ACCESS_SECRET` — at least 16 characters
- `JWT_REFRESH_SECRET` — at least 16 characters, different from access secret

Optional:
- `REDIS_URL` — Upstash `rediss://` URL. If not set, dashboard endpoints fall back to direct database queries silently.

### 3. Database Migrations & Seeding
```bash
npx prisma migrate dev --name init
npx prisma db seed
```
*The seed script creates 3 users (Admin, Analyst, Viewer) and 30 sample financial records.*

### 4. Start the Server
```bash
# Development mode with hot-reloading
npm run dev

# Production build and start
npm run build
npm start
```

---

## 🔐 Role-Based Access Control (RBAC)

The system enforces strict role-based access to the endpoints.

| Feature/Endpoint | `VIEWER` | `ANALYST` | `ADMIN` |
|---|:---:|:---:|:---:|
| **Records** | | | |
| `GET /records` (List & Filter) | ✅ | ✅ | ✅ |
| `GET /records/:id` (Get One) | ✅ | ✅ | ✅ |
| `POST /records` (Create) | ❌ | ❌ | ✅ |
| `PATCH /records/:id` (Update) | ❌ | ❌ | ✅ |
| `DELETE /records/:id` (Drop) | ❌ | ❌ | ✅ |
| **Dashboard** | | | |
| `GET /dashboard/summary` | ✅ | ✅ | ✅ |
| `GET /dashboard/recent` | ✅ | ✅ | ✅ |
| `GET /dashboard/categories` | ❌ | ✅ | ✅ |
| `GET /dashboard/trends` | ❌ | ✅ | ✅ |
| `GET /dashboard/trends/weekly` | ❌ | ✅ | ✅ |
| **Users** | | | |
| `GET /users` (List) | ❌ | ❌ | ✅ |
| `PATCH /users/:id/role` | ❌ | ❌ | ✅ |
| `PATCH /users/:id/status` | ❌ | ❌ | ✅ |

---

## 🔑 Authentication Flow

The system uses short-lived access tokens paired with long-lived refresh tokens:

- **Access Token** — 15-minute JWT, sent as `Authorization: Bearer <token>` on every request
- **Refresh Token** — 7-day JWT, stored exclusively in an `httpOnly`, `secure`, `sameSite: lax` cookie, inaccessible to JavaScript

| Endpoint | Description |
|---|---|
| `POST /auth/register` | Creates account, returns `accessToken` + sets refresh cookie |
| `POST /auth/login` | Returns `accessToken` + sets refresh cookie |
| `POST /auth/refresh` | Reads refresh cookie, issues new token pair |
| `POST /auth/logout` | Clears the refresh cookie |
| `GET /auth/me` | Returns current user profile |

---

## 🧪 Testing the API (Postman)

A complete **Postman Collection** is included in the root directory: `financer-api.postman_collection.json`.

1. Import the file into Postman.
2. Run the **Auth → Login** request with any of the seeded credentials.
3. The `accessToken` is automatically captured into the Postman `{{token}}` variable. The `refreshToken` is stored in the Postman cookie jar automatically.
4. You can now execute any other request without manually pasting tokens.
5. When the access token expires, run **Auth → Refresh Token** to get a new one.

> **Note:** Postman handles `Set-Cookie` automatically when using its built-in cookie jar. This works out of the box for localhost but ensure the domain is not blocked in Postman's cookie settings.

**Seed Credentials:**
- `admin@financer.com` / `admin123`
- `analyst@financer.com` / `analyst123`
- `viewer@financer.com` / `viewer123`

---

## 📐 Assumptions

1. **Shared organizational ledger.** Financial records belong to the organization, not to individual users. All authenticated users see the same pool of records — roles govern what actions they can perform, not which records they can see. This mirrors how real finance tools work: a Viewer and an Analyst both see company-wide data, but only an Admin can create or modify entries.

2. **`userId` as audit trail, not ownership.** The `userId` field on each `FinancialRecord` records which Admin created it. This is an audit concern, not a data-ownership constraint. It answers "who entered this record?" rather than "who does this record belong to?"

3. **Single-tenant system.** The system serves one organization. Multi-tenancy is outside the scope of this implementation.

4. **Soft delete is permanent demotion.** Once a record is soft-deleted, it is excluded from all queries and cannot be restored through the API. Hard deletes are intentionally not exposed.

5. **Roles are mutually exclusive and flat.** A user holds exactly one role at a time with no inheritance — each role's access is explicitly defined in the route middleware.

---

## 🏗️ Design Decisions & Trade-offs

1. **Module-based architecture.** Domain-driven folder structure (`auth/`, `users/`, `records/`, `dashboard/`) so each module owns its routes, controller, service, and schemas independently.

2. **Centralized error handling.** Controllers forward errors via `next(err)` to a single global `errorHandler` that maps `AppError` and Prisma error codes to consistent HTTP responses. No scattered `res.status().json()` blocks.

3. **Soft deletes with `whereActive()`.** A shared `whereActive()` helper enforces `deletedAt: null` on every query automatically, so deleted records can never leak through any code path.

4. **Atomic mutations.** `updateRecord` and `softDeleteRecord` use `updateMany` with `whereActive()` in the `where` clause directly, eliminating the TOCTOU race condition. A single `result.count === 0` check covers both "not found" and "already deleted."

5. **Short-lived access tokens with httpOnly refresh cookies.** Access tokens expire in 15 minutes. Refresh tokens live in an `httpOnly` cookie inaccessible to JavaScript, preventing XSS theft. `COOKIE_OPTIONS` is a shared constant so `set` and `clearCookie` can never drift out of sync. The `secure` flag is conditionally set based on `NODE_ENV` so local development works over plain HTTP. Trade-off: refresh tokens are stateless — there is no server-side revocation path. A stolen refresh token remains valid until expiry.

6. **No email verification on signup.** Registration accepts any valid email format without OTP or confirmation. This keeps the auth flow simple for an internal tool where user creation is admin-controlled, but means anyone with API access can register an unverified account. Email verification would be the next step before any public-facing deployment.

7. **Stateless refresh tokens.** The refresh token contains only `userId`, not `role`, so any role change by an Admin is reflected on the next refresh — role is always re-fetched from the database. Trade-off: no force-logout capability without a `hashedRefreshToken` column on the `User` model.

8. **On-the-fly dashboard aggregations.** Stats are computed live via Prisma `aggregate`, `groupBy`, and `$queryRaw` rather than a snapshot table, preventing data de-syncs. The Redis caching layer offsets the per-request compute cost. `$queryRaw` is used specifically for `date_trunc` bucketing which Prisma does not support natively — these queries are PostgreSQL-specific and isolated to their own functions.

9. **Redis caching with event-driven invalidation.** Dashboard endpoints check Redis before hitting the database via a `withCache` utility. On a cache miss the result is stored with a 1-hour TTL. Every record mutation calls `invalidateDashboardCache()` to wipe all `dash:*` keys immediately. The TTL is a safety net only — invalidation is the primary mechanism. Redis is optional: without `REDIS_URL` the app falls through to the database silently.

10. **Zod coercion for query strings.** `z.coerce.number()` and `z.coerce.date()` parse Express query strings transparently in the schema layer, keeping controllers free of manual casting.

11. **Rate limiting at two tiers.** Global limiter (100 req / 15 min) on all routes. Stricter auth limiter (10 req / 15 min) on `/login`, `/register`, and `/refresh` to slow brute-force attacks.

---

## 🔮 Future Improvements

- **Email verification.** Add OTP or magic-link confirmation on registration before granting access, particularly important for any public-facing deployment.
- **Stateful refresh token revocation.** Add a `hashedRefreshToken` column to the `User` model so Admins can force-logout any user. Currently a leaked refresh token remains valid until its 7-day expiry.
- **OAuth support.** Add Google/GitHub login as an alternative to email/password.
- **Audit logs.** Track who modified or soft-deleted a record via a separate `AuditLog` table. The `userId` on `FinancialRecord` already captures the creator.
