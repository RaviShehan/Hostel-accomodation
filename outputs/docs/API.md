# REST API Reference

All request and response bodies use JSON. Protected routes require:

```http
Authorization: Bearer <token>
```

## Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Authenticate and create a 12-hour session |
| POST | `/api/auth/logout` | Authenticated | Revoke current session |
| GET | `/api/me` | Authenticated | Current user, resident profile, and room |

Login body:

```json
{"email":"student@havenly.lk","password":"student123"}
```

## Dashboard and accommodation

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/dashboard` | Admin/Warden | Operational summary |
| GET | `/api/rooms` | Admin/Warden | List rooms and occupancy |
| POST | `/api/rooms` | Admin/Warden | Create room |
| PATCH | `/api/rooms/:id` | Admin/Warden | Update room |
| GET | `/api/residents` | Admin/Warden | List enriched resident records |
| POST | `/api/residents` | Admin/Warden | Register resident and allocate a bed |
| PATCH | `/api/residents/:id/allocate` | Admin/Warden | Move resident to another room |

## Maintenance

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/complaints` | Authenticated | Admin: all; Student: own |
| POST | `/api/complaints` | Authenticated | Submit maintenance request |
| PATCH | `/api/complaints/:id` | Admin/Warden | Change priority or status |

Complaint body:

```json
{
  "title": "Ceiling fan making noise",
  "description": "The fan rattles at high speed.",
  "category": "Electrical",
  "priority": "Medium",
  "image": "data:image/jpeg;base64,..."
}
```

## Visitors

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/visitors` | Authenticated | Admin: all; Student: own |
| POST | `/api/visitors` | Authenticated | Create visitor request/log |
| PATCH | `/api/visitors/:id` | Admin/Warden | Approve, decline, check in, or check out |

Supported statuses: `Pending`, `Approved`, `Declined`, `Checked in`, `Checked out`.

## Payments

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/payments` | Authenticated | Admin: all; Student: own |
| POST | `/api/payments` | Admin/Warden | Create fee record |
| PATCH | `/api/payments/:id` | Admin/Warden | Update payment status/reference |

Supported statuses: `Pending`, `Paid`, `Overdue`.

## Notices and notifications

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/notices` | Authenticated | Audience-scoped notices |
| POST | `/api/notices` | Admin/Warden | Publish notice |
| GET | `/api/notifications` | Authenticated | Current user’s notification inbox |
| PATCH | `/api/notifications/:id/read` | Authenticated | Mark one notification read |

## Errors

Errors have a stable shape:

```json
{"error":"Human-readable explanation"}
```

Common status codes: `400` invalid input, `401` unauthenticated, `403` forbidden, `404` missing resource, `409` conflicting state, `413` oversized request, and `500` server error.
