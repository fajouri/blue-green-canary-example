# URL Shortener Learning Lab

This repository is a step-by-step learning project. We build and verify the
URL-shortener MVP in v1 first. A later, separate v2 change will introduce an
intentional product improvement and exercise canary rollout and rollback.
Changes are committed and pushed to the selected branch; this lab does not use
pull requests.

The MVP is an API-only Node.js service using Express and SQLite. Docker Compose
runs the app, its explicit database migration step, and an Nginx reverse proxy.

## Development setup

- Windows prerequisites: [docs/development-environment.md](docs/development-environment.md)
- Step-by-step development workflow: [docs/contributing.md](docs/contributing.md)
- Product requirements: [docs/product-requirements.md](docs/product-requirements.md)
- Architecture decisions: [docs/decisions/](docs/decisions/)

The v1 app and tests require Node.js 24 or newer. Run the test suite with:

```powershell
npm ci --prefix app/v1
npm test --prefix app/v1
```

## Run the MVP

From the repository root, start the stack:

```powershell
docker compose up --build
```

Compose runs the one-shot SQLite migration service, then starts v1 and Nginx.
Already-applied migrations are skipped. The named `links-data` volume stores
the database so application container restarts do not erase links or click
counts.

The public API is available at `http://localhost:8080`:

| Request | Behavior |
| --- | --- |
| `POST /api/links` | Create a short link from a JSON `url` |
| `GET /api/links` | List short links and click counts |
| `GET /:code` | Redirect to the saved destination with HTTP 302 |
| `GET /health` | Check v1 health |

Create a link in PowerShell:

```powershell
$link = Invoke-RestMethod `
  -Uri http://localhost:8080/api/links `
  -Method Post `
  -ContentType 'application/json' `
  -Body (@{ url = 'https://example.com' } | ConvertTo-Json)
$link
```

List links:

```powershell
Invoke-RestMethod http://localhost:8080/api/links
```

Inspect a redirect response without following it:

```powershell
curl.exe -i "http://localhost:8080/$($link.code)"
```

Check service and migration status:

```powershell
docker compose ps
docker compose logs migrate
docker compose logs v1
```

Each completed v1 HTTP request is written to the v1 container log as a JSON
record with a process-local request number, method, path, status, and duration.
Follow the logs while making API requests:

```powershell
docker compose logs --follow v1
```

The request number resets when v1 restarts. It is separate from `clickCount`,
which counts only successful short-link redirects and is stored in SQLite.

Stop the services:

```powershell
docker compose down
```

`docker compose down` preserves the named data volume. To intentionally erase
the local database and all saved links, run `docker compose down --volumes`.

## Release sequence

- **v1 MVP:** Nginx sends all traffic to v1. v1 logs each request with a
  per-process count, response status, and duration. Docker Compose probes
  `/health` and waits for v1 health before starting Nginx.
- **v2 rollout exercise:** v2 is not yet part of the running Compose stack.
  After v1 is complete, add a deliberate improvement, verify compatibility
  with the shared SQLite schema, then exercise weighted routing and rollback.

The open-source Nginx configuration does not actively poll the app's
`/health` endpoint. Compose uses that endpoint for container health and
startup ordering. The current Nginx upstream has only v1, so there is no
alternate backend to fail over to. Active Nginx health checks require a
different approach, such as NGINX Plus.

This is a learning lab, not a production-ready public URL-shortening service.
