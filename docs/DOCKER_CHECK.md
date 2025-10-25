# Docker Check Script

## Overview

The sushi-rag-app includes an automatic Docker check that runs before starting the application. This ensures all required services are running and prevents cryptic errors during development.

## What It Does

The `check-docker.js` script automatically:

1. ✅ Verifies Docker Desktop is running
2. ✅ Checks that required services are started
3. ✅ Validates service health status
4. ✅ Provides clear error messages if something is wrong

## Required Services

- **sushi-postgres**: PostgreSQL database for storing orders

## How It Works

### Automatic Checks

The check runs automatically before these npm scripts:

```bash
npm run dev       # Starts both frontend and backend
npm run server    # Starts backend only
npm run client    # Starts frontend only
npm run db:setup  # Sets up the database
```

### Manual Check

You can also run the check manually:

```bash
npm run check:docker
```

## Example Output

### ✅ Success

```
========================================
     Docker & Services Check
========================================

🔍 Checking if Docker Desktop is running...
✅ Docker Desktop is running

🔍 Checking required services...
✅ Service "sushi-postgres" is running and healthy

✅ All checks passed! Starting application...
========================================
```

### ❌ Docker Not Running

```
========================================
     Docker & Services Check
========================================

🔍 Checking if Docker Desktop is running...
❌ Docker Desktop is NOT running!

Please start Docker Desktop and try again.
You can start it by:
  - Opening Docker Desktop from Applications
  - Or running: open -a Docker
```

### ❌ Services Not Running

```
========================================
     Docker & Services Check
========================================

🔍 Checking if Docker Desktop is running...
✅ Docker Desktop is running

🔍 Checking required services...
❌ Service "sushi-postgres" is NOT running

❌ Some required services are not running!

To start the services, run:
  npm run docker:up

Or:
  docker-compose up -d
```

## Troubleshooting

### Problem: Docker Desktop Not Running

**Solution:**
```bash
# Start Docker Desktop
open -a Docker

# Wait for it to be ready (green icon in menu bar)
# Then try again
npm run dev
```

### Problem: Services Not Running

**Solution:**
```bash
# Start all services
npm run docker:up

# Or manually
docker-compose up -d

# Verify services are running
docker ps
```

### Problem: Service Unhealthy

**Solution:**
```bash
# Check service logs
docker-compose logs sushi-postgres

# Restart the service
npm run docker:reset

# Or manually
docker-compose down -v
docker-compose up -d
```

### Problem: Port Already in Use

**Solution:**
```bash
# Find what's using the port
lsof -i :5432

# Stop the conflicting service or change the port in docker-compose.yml
```

## Technical Details

### Script Location

- **Script:** `/scripts/check-docker.js`
- **Language:** Node.js (ES modules)
- **Dependencies:** None (uses Node.js built-ins only)

### How It Checks Docker

```javascript
// Runs 'docker info' to check if daemon is accessible
execSync('docker info', { stdio: 'ignore', timeout: 5000 });
```

### How It Checks Services

```javascript
// Lists running containers
const containers = execSync('docker ps --format "{{.Names}}"');

// Checks health status
const health = execSync('docker inspect --format="{{.State.Health.Status}}" container-name');
```

### Exit Codes

- **0**: All checks passed
- **1**: Docker not running or services not ready

### Timeout

- Docker checks have a 5-second timeout
- Prevents hanging if Docker is unresponsive

## Customization

### Add More Services

Edit `/scripts/check-docker.js`:

```javascript
const REQUIRED_SERVICES = [
  'sushi-postgres',
  'sushi-redis',      // Add new service
  'sushi-chromadb'    // Add new service
];
```

### Remove Checks from Specific Scripts

Edit `package.json`:

```json
{
  "scripts": {
    // Without check (not recommended)
    "dev:nocheck": "concurrently \"npm run server\" \"npm run client\"",
    
    // With check (recommended)
    "dev": "npm run check:docker && concurrently \"npm run server\" \"npm run client\""
  }
}
```

### Adjust Colors

Edit color constants in `check-docker.js`:

```javascript
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';    // Add more colors
const RESET = '\x1b[0m';
```

## Benefits

### Developer Experience

- ❌ **Before:** Cryptic database connection errors
- ✅ **After:** Clear "Docker not running" message

### Time Savings

- No more debugging why the app won't start
- Instant feedback about what's wrong
- Clear instructions on how to fix it

### Prevents Issues

- Can't start app without required services
- Catches problems before they cause errors
- Validates service health, not just running status

## Related Commands

```bash
# Check all services manually
docker ps

# View service logs
docker-compose logs
docker-compose logs sushi-postgres

# Restart services
npm run docker:reset

# Stop all services
npm run docker:down

# Start services without checks
docker-compose up -d
```

## Integration with CI/CD

In CI/CD environments, you might want to skip the check:

```bash
# Skip Docker checks in CI
CI=true npm run dev

# Or create a separate script
npm run dev:ci
```

To implement this, modify the script:

```javascript
if (process.env.CI === 'true') {
  console.log('CI environment detected, skipping Docker checks');
  exit(0);
}
```

## Future Enhancements

Possible improvements:

- [ ] Add retry logic for services that are starting
- [ ] Check for port conflicts before starting
- [ ] Validate Docker Compose file syntax
- [ ] Check disk space for Docker volumes
- [ ] Verify required Docker images are pulled
- [ ] Add warnings for low memory/CPU
- [ ] Integration with Docker Desktop API

## FAQ

**Q: Can I disable the checks?**  
A: Yes, run commands directly: `cd backend && npm run dev`

**Q: Does this work on Windows/Linux?**  
A: Yes, the script uses cross-platform Node.js APIs and Docker commands that work everywhere.

**Q: How much overhead does the check add?**  
A: ~500ms-1s, negligible compared to app startup time.

**Q: What if I use Podman instead of Docker?**  
A: The script uses standard `docker` commands. With Podman, create an alias: `alias docker=podman`

**Q: Can I run this in production?**  
A: The script is designed for development. In production, use proper orchestration (Kubernetes, ECS, etc.) with health checks.

## Support

If you encounter issues:

1. Check Docker Desktop is running: `docker info`
2. Check services are running: `docker ps`
3. View service logs: `docker-compose logs`
4. Restart services: `npm run docker:reset`
5. Check this documentation: `/docs/DOCKER_CHECK.md`

Still stuck? Check the main project README or open an issue.

