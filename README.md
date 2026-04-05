# Finance Dashboard Backend

A robust, modular, and type-safe backend API for a Finance Dashboard. Built using Node.js, Express, TypeScript, Prisma, and PostgreSQL. It features a complete Role-Based Access Control (RBAC) system, soft deletes, rate limiting, and structured query validations.

---

## 🛠️ Tech Stack
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (hosted via Supabase)
- **ORM:** Prisma
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
Copy `.env.example` to `.env` and fill in your Supabase connection strings:
```bash
cp .env.example .env
```
Ensure you provide a 16+ character `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`!

### 3. Database Migrations & Seeding
Push the schema to your database and generate the Prisma client:
```bash
npx prisma migrate dev --name init
```
Seed the database with sample users and financial records:
```bash
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

## 🧪 Testing the API (Postman)

A complete **Postman Collection** is included in the root directory: `financer-api.postman_collection.json`.

1. Import the file into Postman.
2. Run the **Auth → Login** request with any of the seeded credentials.
3. The JWT token is automatically captured into the Postman `{{token}}` variable.
4. You can now execute any other request without manually pasting tokens.

**Seed Credentials:**
- `admin@financer.com` / `admin123`
- `analyst@financer.com` / `analyst123`
- `viewer@financer.com` / `viewer123`

---

## 🏗️ Design Decisions & Trade-offs

1. **Architecture:** A module-based folder structure was chosen (`auth/`, `users/`, `records/`, `dashboard/`) over a layered approach to ensure the app scales easily as domains grow.
2. **Error Handling:** Avoided scattered `try/catch` and `res.status().json()` blocks in controllers. Controllers forward errors via `next(err)` to a global `errorHandler` middleware, keeping logic DRY and HTTP responses uniform.
3. **Soft Deletes:** Records are never fully dropped from the database. A `deletedAt` DateTime field is set instead. Every query across the app enforces a `whereActive()` helper to filter out deleted data automatically.
4. **Zod Coercion:** Used `z.coerce.date()` and `z.coerce.number()` heavily in list schemas to smoothly parse Express query strings without cluttering the controller logic with `parseInt()` or `new Date()`.
5. **No Independent Dashboard Table:** Dashboard stats are computed on the fly via `aggregate`, `groupBy`, and `$queryRaw` rather than maintaining redundant snapshot tables. This prevents data de-syncs, though it trades off compute time on read.
6. **Floating Point Arithmetic:** Database `FLOAT` aggregates result in JS precision artifacts (e.g. `34.000000001`). All dashboard currency calculations explicitly round to `.toFixed(2)` before returning ensuring perfect UI display.

---

## 🔮 Future Improvements

- **Authentication Enhancements:** Implement refresh tokens and OAuth (Google/GitHub) support. Currently relies on long-lived (7d) access tokens.
- **Caching:** Wrap dashboard endpoints in Redis. Since historic financial records rarely change, computing aggregations entirely from scratch on every page load could become a bottleneck at a massive scale.
- **Audit Logs:** Track *who* modified or soft-deleted a record, not just *when*.
- **Pagination enhancements:** Use cursor-based pagination for the `GET /records` endpoint instead of offset-based, which performs better on massive datasets.
