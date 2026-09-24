# Zero-Downtime Deployment Example

Student example for Blue/Green and Canary deployment strategies using Node.js, Docker, Nginx, Docker Compose, and GitHub Actions.

## Architecture

```text
Client
  |
  v
Nginx reverse proxy
  |------------------|
  v                  v
v1 (Blue)        v2 (Green/Canary)
```

The default Nginx configuration routes approximately 95% of traffic to `v1` and 5% to `v2`.

## Run locally

```bash
docker compose up --build
```

Open:

- Application: http://localhost:8080
- v1 directly: http://localhost:3001
- v2 directly: http://localhost:3002
- v1 health: http://localhost:3001/health
- v2 health: http://localhost:3002/health

## Exercise 1 — Canary rollout

Edit `nginx/nginx.conf` and change the weights.

### 95 / 5

```nginx
upstream app_backend {
  server v1:3001 weight=95;
  server v2:3002 weight=5;
}
```

### 80 / 20

```nginx
upstream app_backend {
  server v1:3001 weight=80;
  server v2:3002 weight=20;
}
```

### 50 / 50

```nginx
upstream app_backend {
  server v1:3001 weight=50;
  server v2:3002 weight=50;
}
```

### 100% v2

```nginx
upstream app_backend {
  server v2:3002;
}
```

After changing Nginx configuration, rebuild or restart the nginx service:

```bash
docker compose up -d --build nginx
```

Test several requests:

```bash
for i in {1..20}; do curl -s http://localhost:8080; echo; done
```

On Windows PowerShell:

```powershell
1..20 | ForEach-Object { Invoke-WebRequest http://localhost:8080 -UseBasicParsing | Select-Object -ExpandProperty Content }
```

## Exercise 2 — Blue/Green rollback

To simulate a broken v2, temporarily replace the root route in `app/v2/server.js` with:

```javascript
app.get('/', (req, res) => {
  res.status(500).send('ERROR: v2 is broken');
});
```

Rebuild:

```bash
docker compose up -d --build
```

Route all traffic to v2:

```nginx
upstream app_backend {
  server v2:3002;
}
```

If v2 fails, roll back by switching Nginx to v1:

```nginx
upstream app_backend {
  server v1:3001;
}
```

Then:

```bash
docker compose up -d --build nginx
```

## Exercise 3 — Logging

Both applications count requests in memory and print the current counter to stdout.

Inspect the logs:

```bash
docker compose logs v1
docker compose logs v2
```

With a 50/50 configuration, counts should become approximately equal over many requests, but not necessarily exactly equal.

## Exercise 4 — Health checks

Both applications expose a `/health` endpoint.

Example response:

```json
{
  "status": "healthy",
  "version": "v1"
}
```

Docker Compose also defines container health checks. Inspect status with:

```bash
docker compose ps
```

## Stop the environment

```bash
docker compose down
```

## Notes

- Request counters are intentionally stored in memory for teaching purposes and reset whenever a container restarts.
- Nginx weighted load balancing is approximate over a sequence of requests.
- This repository is designed as a classroom example, not as a production-ready deployment platform.
