# Havenly — Smart Hostel and Boarding Management Platform

Havenly is a complete demonstration platform for student accommodation administration. It contains a warden/administrator web dashboard, an installable student mobile PWA, backend services, role-based authentication, persistent records, notifications, and technical documentation.

## Run the complete system

Requirements: Node.js 20 or newer. No package installation is required.

```powershell
cd outputs
node server.js
```

Open [http://localhost:4173](http://localhost:4173).

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@havenly.lk` | `admin123` |
| Warden | `warden@havenly.lk` | `warden123` |
| Student | `student@havenly.lk` | `student123` |

## Delivered functionality

### Administrator web application

- Secure administrator and warden login
- Dashboard with occupancy, complaints, visitor, and payment summaries
- Hostel block, floor, room, bed capacity, and room status management
- Resident registration and room allocation
- Searchable resident and occupancy records
- Maintenance request review and status workflow
- Visitor approval and decline workflow
- Fee creation, payment status, and overdue tracking
- Notice publishing by resident audience or block
- In-app status notifications
- Responsive tablet and mobile layouts

### Student mobile PWA

- Secure student login and profile
- Assigned room, occupancy, amenities, and emergency contacts
- Maintenance requests with optional image attachment
- Request status and history
- Fee status and payment records
- Notices targeted to all residents or the student’s block
- Visitor pre-entry requests and approval tracking
- Notification inbox
- Installable home-screen application and offline app shell

### Backend

- Node.js REST API with no external dependencies
- Token sessions and role-based access control
- Atomic JSON file persistence
- Password hashing with Node.js `scrypt`
- Input validation and consistent HTTP errors
- Resident-scoped data access
- Notification generation for workflow changes
- Seed data and repeatable reset command

## Data reset

```powershell
node scripts/reset-data.js
node server.js
```

The first start recreates `data/db.json` from `data/seed.json`.

## Tests

```powershell
node tests/api.test.js
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Entity relationship model](docs/ERD.md)
- [REST API reference](docs/API.md)
- [Workflow definitions](docs/WORKFLOWS.md)
- [Demonstration guide](docs/DEMO.md)

## Production considerations

This submission is fully runnable for local demonstration. A production deployment should replace the JSON store with PostgreSQL or MySQL, use an external session store, enforce HTTPS, add rate limiting and audit retention, store images in object storage, connect email/push services, and deploy the administrator and student clients behind a reverse proxy.
