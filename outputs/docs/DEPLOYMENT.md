# Deployment and Long-Term Demo

## Recommended interview setup

Keep both:

1. A public Render deployment for convenient access.
2. The local one-click launcher as an offline fallback.

The free Render service can take about one minute to wake after it has been idle. Its filesystem is ephemeral, so demonstration changes can reset after sleep or redeployment. This is useful for a clean repeatable demo, but it is not production persistence.

## Deploy to Render

The repository contains `render.yaml` at its root.

1. Sign in to [Render](https://dashboard.render.com/).
2. Choose **New → Blueprint**.
3. Connect the GitHub repository `RaviShehan/Hostel-accomodation`.
4. Confirm the `havenly-hostel-management` free web service.
5. Deploy and save the generated `onrender.com` URL.
6. Open `/api/health` on that URL to verify the service.

Every new commit to `main` automatically triggers a deployment.

## Free-tier behavior

- The service sleeps after a period without traffic and wakes on the next request.
- The first request after sleep may take around one minute.
- Changes made during a demo can be lost after restart because the filesystem is ephemeral.
- The original seed data is recreated automatically, so demo accounts remain available.

## Reliable paid deployment

For a persistent public installation:

1. Upgrade the web service from the free instance.
2. Add a persistent disk or migrate records to PostgreSQL.
3. If using a disk, mount it and set `DATA_DIR` to the mount path.
4. Replace demo passwords and add environment-managed secrets.
5. Configure monitoring, backups, and a custom domain.

## Local fallback

Double-click `START-HAVENLY-DEMO.cmd` in the repository root. The launcher:

1. Confirms Node.js is installed.
2. Starts the backend in a separate terminal.
3. Opens `http://localhost:4173`.

Use `RESET-HAVENLY-DEMO.cmd` to restore clean sample data before rehearsing.

