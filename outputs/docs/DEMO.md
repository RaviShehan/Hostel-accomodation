# Final Demonstration Guide

## 1. Start the platform

```powershell
node server.js
```

Open `http://localhost:4173`.

## 2. Student scenario

1. Select the Student demo account and sign in.
2. Review room A-101 and its amenities.
3. Submit a maintenance request with an optional image.
4. Submit a visitor request.
5. Review the June accommodation fee.
6. Open notices and notifications.

## 3. Administrator scenario

1. Sign out and use the Administrator demo account.
2. Review live occupancy and open-request summaries.
3. Open Maintenance and advance the student’s new request.
4. Open Visitors and approve the student’s visitor.
5. Add a room or resident.
6. Create a fee record.
7. Publish a notice to all residents or one block.

## 4. Confirm end-to-end behavior

Sign back in as the student. The maintenance status, visitor approval, new fee, notice, and corresponding notifications will now be visible.

## 5. Reset after demonstration

```powershell
node scripts/reset-data.js
```
