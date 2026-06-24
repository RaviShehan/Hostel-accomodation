# Interview Presentation Guide

## Before the interview

Use this checklist one or two days beforehand:

1. Open the live cloud URL and allow up to one minute for a free service to wake.
2. Confirm both demo accounts can sign in.
3. Run `RESET-HAVENLY-DEMO.cmd` locally to restore clean sample data.
4. Double-click `START-HAVENLY-DEMO.cmd` and verify `http://localhost:4173`.
5. Keep the repository downloaded on the presentation laptop.
6. Keep the GitHub repository and architecture documentation open in separate tabs.

## Five-minute presentation

### 1. Problem and users — 30 seconds

“Hostels commonly use paper registers and messaging groups. Havenly centralizes accommodation operations for two user groups: wardens and student residents.”

### 2. Architecture — 30 seconds

Show `docs/ARCHITECTURE.md`.

“The solution has an administrator web application, an installable student PWA, a REST API, authentication and role checks, persistent records, and notification workflows.”

### 3. Student workflow — 90 seconds

Sign in using:

- `student@havenly.lk`
- `student123`

Demonstrate:

1. Assigned room and amenities.
2. Submit a maintenance request.
3. Submit a visitor request.
4. Review fee status and notices.

### 4. Administrator workflow — 90 seconds

Sign out and use:

- `admin@havenly.lk`
- `admin123`

Demonstrate:

1. Occupancy and overdue summaries.
2. Find the new maintenance request and move it to `In progress`.
3. Approve the visitor request.
4. Publish a notice or add a room.

### 5. End-to-end proof — 30 seconds

Sign back in as the student and show the updated request, visitor approval, and notifications.

### 6. Engineering discussion — 30 seconds

Mention:

- Password hashing with `scrypt`.
- Random expiring session tokens.
- Role-based and resident-scoped API access.
- Atomic local persistence for the demonstrator.
- Automated API workflow tests.
- Production migration path to PostgreSQL, object storage, and push notifications.

## Questions you may be asked

### Why a PWA instead of separate Android and iOS applications?

It provides installable mobile behavior from one codebase and is appropriate for a lightweight student project. Native applications can later reuse the same REST API.

### How would you deploy this in production?

Use HTTPS behind a reverse proxy, PostgreSQL, Redis-backed sessions, object storage for images, centralized logs, backups, rate limiting, and managed push notifications.

### How do you prevent one student seeing another student’s data?

The API derives the resident from the authenticated user and filters complaints, visitors, payments, notices, and notifications server-side.

### What happens if a room is full?

The room-allocation API rejects the request with a conflict response and does not modify either room.

### What is deliberately out of scope?

Biometric access, smart locks, CCTV, full accounting reconciliation, and public accommodation listings.

## Emergency offline presentation

If the internet is unavailable:

1. Double-click `START-HAVENLY-DEMO.cmd`.
2. Keep the server window open.
3. Present from `http://localhost:4173`.

The local demonstration does not require package installation or internet access after Node.js is installed.

