# ContestPlatform (HAR Assignment)

![Result](docs/test-results.png)

TypeScript + Express + Prisma (PostgreSQL) API for a contest platform.

Testcase repo (external): https://github.com/rahul-MyGit/contest-test

## Prerequisites

- Node.js 18+ (recommended)
- Docker Desktop (for Postgres)

## Project structure

- `ContestPlatform/` – API server + Prisma schema/migrations

## Setup

From the API folder:

```bash
cd ContestPlatform
npm install
```

### 1) Start Postgres

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` with:

- user: `contest`
- password: `contest`
- database: `contestdb`

### 2) Configure env

Create `ContestPlatform/.env`:

```env
DATABASE_URL="postgresql://contest:contest@localhost:5432/contestdb?schema=public"
JWT_SECRET="dev_secret_change_me"
```

### 3) Generate Prisma client + run migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Run the API

```bash
npm run dev
```

Server runs on:

- `http://localhost:3000`

Health checks:

- `GET /`
- `GET /health/db`

## API response format

All endpoints return:

- Success:

```json
{ "success": true, "data": {}, "error": null }
```

- Error:

```json
{ "success": false, "data": null, "error": "ERROR_CODE" }
```

## Quick usage (Thunder Client / Postman)

### Auth

**Signup**

- `POST /api/auth/signup`
- Header: `Content-Type: application/json`
- Body:

```json
{
  "email": "creator1@example.com",
  "password": "Password123!",
  "name": "Creator One",
  "role": "creator"
}
```

**Login**

- `POST /api/auth/login`
- Header: `Content-Type: application/json`
- Body:

```json
{
  "email": "creator1@example.com",
  "password": "Password123!"
}
```

Copy the token from `data.token` and use it as:

- `Authorization: Bearer <token>`

### Contests

**Create contest (creator-only)**

- `POST /api/contests`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- Body:

```json
{
  "title": "Weekly Contest",
  "description": "MCQ + DSA",
  "startTime": "2026-01-20T10:00:00Z",
  "endTime": "2026-01-20T12:00:00Z"
}
```

**Get contest details (auth required)**

- `GET /api/contests/:contestId`
- Header: `Authorization: Bearer <token>`

### MCQ

**Add MCQ (creator-only)**

- `POST /api/contests/:contestId/mcq`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- Body:

```json
{
  "questionText": "Binary search complexity?",
  "options": ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
  "correctOptionIndex": 1,
  "points": 1
}
```

**Submit MCQ answer (auth required)**

- `POST /api/contests/:contestId/mcq/:questionId/submit`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- Body:

```json
{
  "selectedOptionIndex": 1
}
```

### DSA

**Add DSA problem (creator-only)**

- `POST /api/contests/:contestId/dsa`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- Body:

```json
{
  "title": "Two Sum",
  "description": "Return indices of the two numbers such that they add up to target.",
  "tags": ["arrays", "hashmap"],
  "points": 100,
  "timeLimit": 2000,
  "memoryLimit": 256,
  "testCases": [
    { "input": "2 7 11 15\n9", "expectedOutput": "0 1", "isHidden": false },
    { "input": "3 2 4\n6", "expectedOutput": "1 2", "isHidden": true }
  ]
}
```

### Problems

**Get problem details (auth required)**

- `GET /api/problems/:problemId`
- Header: `Authorization: Bearer <token>`

**Submit DSA solution (auth required)**

- `POST /api/problems/:problemId/submit`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
- Body:

```json
{
  "language": "javascript",
  "code": "function twoSum(nums, target) { return [0, 1]; }"
}
```

### Leaderboard

**Get contest leaderboard (auth required)**

- `GET /api/contests/:contestId/leaderboard`
- Header: `Authorization: Bearer <token>`

## Common issues

- **400 INVALID_REQUEST**: request JSON is invalid, or body/params fail Zod validation.
- **401 UNAUTHORIZED**: missing/invalid bearer token.
- **403 FORBIDDEN**: authenticated, but role is not allowed (e.g., not a creator).
- **404 CONTEST_NOT_FOUND**: contest id does not exist.

## Scripts

Run these inside `ContestPlatform/`:

- `npm run dev` – start in watch mode
- `npm run typecheck` – TypeScript typecheck
- `npm run prisma:generate` – generate Prisma client
- `npm run prisma:migrate` – apply migrations (dev)
- `npm run prisma:studio` – Prisma Studio UI

## Routes

Base URL: `http://localhost:3000`

Auth:

- `POST /api/auth/signup`
- `POST /api/auth/login`

Contests:

- `POST /api/contests` (auth required, creator-only)
- `GET /api/contests/:contestId` (auth required)
- `GET /api/contests/:contestId/leaderboard` (auth required)

MCQ:

- `POST /api/contests/:contestId/mcq` (auth required, creator-only)
- `POST /api/contests/:contestId/mcq/:questionId/submit` (auth required)

DSA:

- `POST /api/contests/:contestId/dsa` (auth required, creator-only)

Problems:

- `GET /api/problems/:problemId` (auth required)
- `POST /api/problems/:problemId/submit` (auth required)
