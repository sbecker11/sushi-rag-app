# Sushi RAG App 🍣

A modern food ordering web application with AI-powered menu assistance, featuring React frontend, Node.js backend, and PostgreSQL database.

## Features

- 🍱 Browse sushi menu with beautiful UI
- 🛒 Add items to cart
- 📦 Place orders
- 🤖 AI-powered menu recommendations (coming soon)
- 🐳 Docker-based development environment
- ✅ Automatic Docker health checks
- ⏱️ Performance monitoring (OpenAI & PostgreSQL query timing)

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express
- PostgreSQL
- OpenAI API

### Infrastructure
- Docker & Docker Compose
- Concurrently for dev workflow

## Quick Start

### Prerequisites

- Node.js 16+ installed
- Docker Desktop installed and running (the app will check automatically)
- OpenAI API key (optional, for AI features)

### Installation

```bash
# Clone the repository
cd /Users/sbecker11/workspace-sushi/sushi-rag-app

# Install all dependencies (root, backend, frontend)
npm run install-all

# Create .env file from template
cp env.example .env

# Set up database (one-time setup)
npm run db:setup

# Start the application - this does everything!
# (kills old processes, starts Docker, checks health, starts servers)
npm run dev
```

The app will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000

### Environment Setup

Create a `.env` file in the **root directory** (not in backend):

```env
# Backend Configuration
PORT=3001

# PostgreSQL Docker Container Configuration
POSTGRES_CONTAINER=sushi-rag-app-postgres
POSTGRES_USER=sushi_rag_user
POSTGRES_PASSWORD=sushi_rag_password
POSTGRES_DB=sushi_rag_orders
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# OpenAI Configuration (optional)
OPENAI_API_KEY=your_openai_api_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Performance Monitoring (optional)
# Set to 'true' to enable performance timing logs, 'false' to disable
ENABLE_PERFORMANCE_LOGGING=true
```

You can copy from the example:
```bash
cp env.example .env
```

## npm Scripts

### Development

```bash
npm run dev          # 🚀 Start everything (kills ports, starts Docker, checks health, runs servers)
npm run server       # Start backend only (also runs prestart checks)
npm run client       # Start frontend only (also runs prestart checks)
npm run prestart     # Run all pre-flight checks (ports, Docker, health)
```

### Docker Management

```bash
npm run docker:up     # Start Docker services
npm run docker:down   # Stop Docker services
npm run docker:reset  # Reset Docker services (removes data)
```

### Database

```bash
npm run db:setup     # Initialize database schema
```

### Utilities

```bash
npm run check:docker        # Full Docker and services health check
npm run check:docker-daemon # Quick check if Docker Desktop is running
npm run cleanup:docker      # Remove old Docker containers
npm run kill:ports          # Kill processes on ports 3001 and 5173
npm run install-all         # Install all dependencies
```

## Automatic Docker Checks

The app includes automatic health checks that run before starting. This prevents confusing errors if Docker isn't running.

### What It Checks

- ✅ Docker Desktop is running
- ✅ Required services (PostgreSQL) are running
- ✅ Services are healthy and ready

### Example Output

**When everything is ready:**
```
========================================
     Docker & Services Check
========================================

🔍 Checking if Docker Desktop is running...
✅ Docker Desktop is running

🔍 Checking required services...
✅ Service "sushi-rag-app-postgres" is running and healthy

✅ All checks passed! Starting application...
```

**When Docker is not running:**
```
❌ Docker Desktop is NOT running!

Please start Docker Desktop and try again.
You can start it by:
  - Opening Docker Desktop from Applications
  - Or running: open -a Docker
```

For more details, see [docs/DOCKER_CHECK.md](docs/DOCKER_CHECK.md)

## Performance Monitoring

The app includes built-in performance monitoring for OpenAI API calls and PostgreSQL queries.

### Configuration

Control performance logging via the `.env` file:

```env
# Enable performance timing logs
ENABLE_PERFORMANCE_LOGGING=true

# Disable performance timing logs (for production)
ENABLE_PERFORMANCE_LOGGING=false
```

### Example Output

**When enabled, you'll see timing metrics in the backend console:**

```
🤖 Calling OpenAI API to generate menu...
⏱️  OpenAI LLM Response Time: 3247ms
✅ Generated menu from OpenAI LLM

⏱️  PostgreSQL: Fetch all orders - 12ms
⏱️  PostgreSQL: Fetch items for 3 orders - 8ms

⏱️  PostgreSQL: BEGIN transaction - 2ms
⏱️  PostgreSQL: INSERT order - 15ms
⏱️  PostgreSQL: INSERT 3 order items - 7ms
⏱️  PostgreSQL: COMMIT transaction - 3ms
⏱️  PostgreSQL: Total transaction time - 27ms
```

### Use Cases

- **Development:** Enable to monitor performance and identify bottlenecks
- **Production:** Disable to reduce log noise
- **Debugging:** Enable temporarily to diagnose slow queries

## Project Structure

```
sushi-rag-app/
├── backend/
│   ├── config/          # Database configuration
│   ├── database/        # Database setup scripts
│   ├── routes/          # API routes (menu, orders)
│   ├── services/        # Business logic
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   └── index.html
├── docs/                # Documentation
│   ├── DOCKER_CHECK.md  # Docker check guide
│   ├── QUICK_START.md   # Quick start guide
│   └── ...
├── scripts/
│   └── check-docker.js  # Docker health check script
└── docker-compose.yml   # Docker services configuration
```

## API Endpoints

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get specific menu item

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details

## Troubleshooting

### Docker Issues

**Docker Desktop not running:**
```bash
# Start Docker Desktop
open -a Docker

# Wait for it to be ready, then try again
npm run dev
```

**Services not starting:**
```bash
# Check service logs
docker-compose logs

# Reset services
npm run docker:reset
```

**Container name conflict:**
```bash
# This app uses unique container name "sushi-rag-app-postgres"
# so conflicts should not occur. If they do:
docker rm -f sushi-rag-app-postgres
npm run docker:up
```

**Port conflicts:**
```bash
# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
```

### Database Issues

**Connection errors:**
```bash
# Verify PostgreSQL is running
docker ps | grep sushi-rag-app-postgres

# Check logs
docker logs sushi-rag-app-postgres

# Reinitialize database
npm run docker:reset
npm run db:setup
```

### Application Issues

**Module not found or module type warnings:**
```bash
# Reinstall dependencies
npm run install-all

# Note: The project uses ES modules ("type": "module" in package.json)
# This eliminates warnings about module syntax
```

**Port already in use:**
```bash
# Automatic cleanup of all app ports (recommended)
npm run kill:ports

# Or manually kill specific port
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

## Development Workflow

1. **Install dependencies (first time only):**
   ```bash
   npm install
   ```

2. **Start everything with one command:**
   ```bash
   npm run dev
   ```
   
   This automatically:
   - 🧹 Cleans up any processes on ports 3001 and 5173
   - 🔍 Checks if Docker Desktop is running
   - 🐳 Starts Docker services (unique PostgreSQL container)
   - ✅ Verifies services are healthy
   - 🚀 Starts both frontend and backend

3. **Make changes:**
   - Frontend: Changes hot-reload automatically
   - Backend: Nodemon restarts server on file changes

4. **Stop everything:**
   ```bash
   # Stop app: Ctrl+C
   # Stop Docker: npm run docker:down
   ```

## Testing

```bash
# Backend tests (when available)
cd backend && npm test

# Frontend tests (when available)
cd frontend && npm test
```

## Deployment

(Coming soon)

## Documentation

- [Quick Start Guide](docs/QUICK_START.md) - Fast setup guide
- [Docker Check Guide](docs/DOCKER_CHECK.md) - Docker health check details
- [AI Stack Enhancement](docs/AI_STACK_ENHANCEMENT.md) - AI features roadmap
- [Environment Setup](docs/ENV_SETUP.md) - Detailed environment configuration
- [OpenAI Setup](docs/OPENAI_SETUP.md) - OpenAI integration guide

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review the [documentation](docs/)
3. Check Docker and service status: `npm run check:docker`

---

Made with ❤️ and 🍣

