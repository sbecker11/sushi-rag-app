# Environment Configuration

## Overview

The PostgreSQL container name and all database settings are now configurable through environment variables in the `.env` file.

## What Changed

### Before (Hardcoded)
- Container name: `sushi-rag-app-postgres` (hardcoded everywhere)
- Database credentials: hardcoded defaults
- Required manual editing of multiple files to change

### After (Configurable)
- All settings in one `.env` file
- Docker Compose reads from environment
- Scripts read from environment
- Easy to customize per developer/environment

## Configuration File

### Location
`.env` file in the **root directory** (same level as `docker-compose.yml`)

### Template
Copy the example file:
```bash
cp env.example .env
```

### Available Variables

```env
# Backend Configuration
PORT=3001                                    # Backend server port

# PostgreSQL Docker Container Configuration
POSTGRES_CONTAINER=sushi-rag-app-postgres  # Container name (customizable!)
POSTGRES_USER=sushi_rag_user               # Database user
POSTGRES_PASSWORD=sushi_rag_password       # Database password
POSTGRES_DB=sushi_rag_orders               # Database name
POSTGRES_HOST=localhost                     # Database host
POSTGRES_PORT=5432                          # PostgreSQL port

# OpenAI Configuration (optional)
OPENAI_API_KEY=your_openai_api_key_here    # For AI features

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173          # Frontend origin
```

## How It Works

### 1. Docker Compose (`docker-compose.yml`)

Uses environment variable substitution with defaults:
```yaml
container_name: ${POSTGRES_CONTAINER:-sushi-rag-app-postgres}
```

**Syntax:** `${VARIABLE:-default_value}`
- If `POSTGRES_CONTAINER` is set in `.env`, use that
- Otherwise, use `sushi-rag-app-postgres`

### 2. Health Check Script (`scripts/check-docker.js`)

Reads from `.env` file:
```javascript
import dotenv from 'dotenv';
dotenv.config();

const REQUIRED_SERVICES = [process.env.POSTGRES_CONTAINER || 'sushi-rag-app-postgres'];
```

### 3. Cleanup Script (`scripts/cleanup-docker-containers.sh`)

Loads from `.env`:
```bash
if [ -f .env ]; then
  export $(cat .env | grep POSTGRES_CONTAINER | xargs)
fi
CONTAINER_NAME="${POSTGRES_CONTAINER:-sushi-rag-app-postgres}"
```

### 4. Backend Database Config (`backend/config/database.js`)

Uses environment variables with fallbacks:
```javascript
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'sushi_rag_user',
  database: process.env.POSTGRES_DB || 'sushi_rag_orders',
  password: process.env.POSTGRES_PASSWORD || 'sushi_rag_password',
  // ...
});
```

## Usage Examples

### Default Configuration (No .env file)

If you don't create a `.env` file, everything uses sensible defaults:
- Container: `sushi-rag-app-postgres`
- User: `sushi_rag_user`
- Database: `sushi_rag_orders`
- Port: `5432`

Just run:
```bash
npm run dev
```

### Custom Container Name

Want a different container name? Create `.env`:
```env
POSTGRES_CONTAINER=my-custom-postgres
POSTGRES_USER=sushi_rag_user
POSTGRES_PASSWORD=sushi_rag_password
POSTGRES_DB=sushi_rag_orders
```

The scripts will automatically use `my-custom-postgres`.

### Multiple Developers

Each developer can have different settings:

**Developer A's `.env`:**
```env
POSTGRES_CONTAINER=sushi-rag-app-postgres-alice
POSTGRES_PORT=5433
```

**Developer B's `.env`:**
```env
POSTGRES_CONTAINER=sushi-rag-app-postgres-bob
POSTGRES_PORT=5434
```

No conflicts!

### Multiple Environments

**Development (`.env`):**
```env
POSTGRES_CONTAINER=sushi-rag-app-postgres-dev
POSTGRES_DB=sushi_rag_orders_dev
```

**Testing (`.env.test`):**
```env
POSTGRES_CONTAINER=sushi-rag-app-postgres-test
POSTGRES_DB=sushi_rag_orders_test
```

Switch environments:
```bash
# Development
cp .env.dev .env
npm run dev

# Testing
cp .env.test .env
npm run dev
```

## Benefits

### 1. **No Container Name Conflicts**
Each project/developer can have unique container names without editing code.

### 2. **Easy Customization**
Change any setting in one place (`.env`) instead of multiple files.

### 3. **Environment Separation**
Different settings for dev/test/staging without code changes.

### 4. **Team Flexibility**
Each developer can customize without affecting others.

### 5. **Security**
`.env` file is gitignored - sensitive data stays local.

## Files Changed

### Created
- **`env.example`** - Template with all available variables

### Modified
- **`docker-compose.yml`** - Uses `${VAR:-default}` syntax
- **`scripts/check-docker.js`** - Loads from `.env` using dotenv
- **`scripts/cleanup-docker-containers.sh`** - Reads `POSTGRES_CONTAINER`
- **`backend/config/database.js`** - Already used env vars (no change needed)
- **`package.json`** - Added `dotenv` dependency
- **`README.md`** - Updated environment setup documentation

## Troubleshooting

### Container name still shows as old name

**Problem:** Changed `POSTGRES_CONTAINER` in `.env` but seeing old container name

**Solution:**
```bash
# Stop and remove old container
docker rm -f sushi-rag-app-postgres

# Start with new name
npm run docker:up
```

### .env file not being read

**Problem:** Environment variables not loaded

**Solution:**
1. Make sure `.env` is in the root directory (not `backend/`)
2. Check file name is exactly `.env` (not `.env.txt` or similar)
3. Restart docker-compose:
   ```bash
   npm run docker:down
   npm run docker:up
   ```

### Which .env file is used?

Docker Compose reads from:
1. `.env` in the same directory as `docker-compose.yml`
2. Shell environment variables (if set)

Priority: Shell env > `.env` file > default values in `docker-compose.yml`

## Advanced Usage

### Override from Command Line

You can override without editing `.env`:
```bash
POSTGRES_CONTAINER=my-temp-db docker-compose up -d
```

### Check Current Configuration

See what values are being used:
```bash
# See all environment variables Docker Compose will use
docker-compose config

# See specific container name
docker ps --format '{{.Names}}' | grep postgres
```

### Validate Environment Variables

Check if `.env` is properly formatted:
```bash
# Load and print environment variables
set -a
source .env
set +a
echo "Container: $POSTGRES_CONTAINER"
echo "Database: $POSTGRES_DB"
```

## Best Practices

### 1. **Always Use env.example**
Keep `env.example` updated with all required variables and good defaults.

### 2. **Don't Commit .env**
`.env` should be in `.gitignore` - it contains sensitive data and local preferences.

### 3. **Document Required Variables**
If you add new environment variables, update:
- `env.example`
- This documentation
- README.md

### 4. **Use Defaults**
Always provide sensible defaults so the app works without `.env`:
```yaml
${POSTGRES_CONTAINER:-sushi-rag-app-postgres}
```

### 5. **Validate on Startup**
Scripts check and use defaults if variables are missing.

## Migration from Hardcoded Names

If you have existing containers with old names:

### Option 1: Rename Container
```bash
# Stop old container
docker stop sushi-postgres

# Rename it
docker rename sushi-postgres sushi-rag-app-postgres

# Start it
docker start sushi-rag-app-postgres
```

### Option 2: Recreate
```bash
# Remove old container
docker rm -f sushi-postgres

# Create new with proper name
npm run docker:up
```

### Option 3: Use Old Name
Set in `.env`:
```env
POSTGRES_CONTAINER=sushi-postgres
```

## Summary

✅ **Container name is now in `.env` file**  
✅ **All database settings configurable**  
✅ **Defaults work without `.env`**  
✅ **Scripts automatically use environment variables**  
✅ **No code changes needed to customize**  

### Quick Setup

```bash
# 1. Copy example
cp env.example .env

# 2. (Optional) Edit .env to customize

# 3. Start the app
npm run dev
```

That's it! The app will use your custom settings or sensible defaults.

