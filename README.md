# Sushi RAG App 🍣

A modern food ordering web application with AI-powered menu assistance, featuring React frontend, Node.js backend, and PostgreSQL database.

## Features

- 🍱 Browse sushi menu with beautiful UI
- 🛒 Add items to cart
- 📦 Place orders
- 🤖 **AI-powered chat assistant** with RAG and agentic framework
- 🔍 **Semantic search** - find items by description, ingredients, dietary preferences
- 🧠 **Multi-tool AI agent** - autonomous tool selection for complex queries
- 💬 **Conversational interface** - natural language menu recommendations
- 🗄️ **Vector database** - ChromaDB for sub-100ms semantic similarity search
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

### AI Stack
- **Vector Database**: ChromaDB for semantic search with cosine similarity
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **RAG Pipeline**: LangChain for context retrieval + generation
- **Agentic Framework**: LangChain OpenAI Functions Agent with custom tools
- **LLM**: GPT-4 for natural language understanding and generation

## Architecture

### RAG System Architecture

```mermaid
graph TB
    subgraph "Frontend"
        A[User Query] --> B[AI Chat Component]
        B --> C[HTTP Request]
    end
    
    subgraph "Backend API"
        C --> D[/api/assistant/chat]
        D --> E[Agent Service]
    end
    
    subgraph "Agentic Framework"
        E --> F{OpenAI Functions Agent}
        F --> G[Tool Selection]
        G --> H[Tool 1: search_menu]
        G --> I[Tool 2: get_item_details]
        G --> J[Tool 3: filter_by_price]
    end
    
    subgraph "RAG Pipeline"
        H --> K[Generate Query Embedding]
        K --> L[OpenAI Embeddings API]
        L --> M[Vector: 1536 dimensions]
        M --> N[ChromaDB Vector Search]
        N --> O[Semantic Similarity]
        O --> P[Top-K Results: ~100ms]
        P --> Q[Retrieved Context]
    end
    
    subgraph "LLM Generation"
        Q --> R[Prompt Template]
        F --> R
        R --> S[System Prompt + Context + Query]
        S --> T[GPT-4 API]
        T --> U[Generated Response]
    end
    
    subgraph "Response Flow"
        U --> V[Backend Response]
        V --> W[Frontend Display]
        W --> X[User sees answer]
    end
    
    style E fill:#e1f5ff
    style F fill:#fff4e1
    style N fill:#e8f5e9
    style T fill:#fce4ec
    style P fill:#f3e5f5
```

### Key Components

**1. Vector Store (ChromaDB)**
- Stores menu items as 1536-dimensional embeddings
- Enables semantic search: "spicy vegetarian options" matches relevant items
- Cosine similarity for relevance ranking
- Sub-100ms query latency

**2. RAG Pipeline**
- **Retrieval**: Query → Embedding → Vector Search → Top-K documents
- **Augmentation**: Inject retrieved context into LLM prompt
- **Generation**: GPT-4 generates response grounded in actual menu data

**3. Agentic Framework**
- **Autonomous Tool Selection**: Agent decides which tools to call
- **Function Calling**: GPT-4 generates structured tool invocations
- **Multi-step Reasoning**: Chains multiple tool calls for complex queries
- **Context Management**: Maintains conversation history

**4. Example Flow**

```
User: "Show me spicy vegetarian options under $15"

Step 1: Agent analyzes query
  → Needs: semantic search + price filter

Step 2: Tool Calls
  → search_menu("spicy vegetarian")
  → filter_by_price(15)

Step 3: Vector Search
  → Generate embedding for "spicy vegetarian"
  → ChromaDB returns top 5 matches (~80ms)
  → Filter results by price < $15

Step 4: LLM Response
  → Context: [Spicy Tofu Roll $12, Veggie Tempura $10...]
  → GPT-4 synthesizes natural language response
  → "I found 2 great options for you..."

Total Time: ~2 seconds (including LLM generation)
```

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

# OpenAI Configuration (required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# ChromaDB Configuration (Vector Database)
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Performance Monitoring
# Set to 'true' to enable performance timing logs, 'false' to disable
ENABLE_PERFORMANCE_LOGGING=true
```

You can copy from the example:
```bash
cp env.example .env
# Then edit .env and add your OpenAI API key
```

**Note:** AI features require an OpenAI API key. Get one at https://platform.openai.com/api-keys

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
│   ├── config/
│   │   └── database.js           # PostgreSQL configuration
│   ├── database/
│   │   └── setup.js              # Database initialization
│   ├── routes/
│   │   ├── menu.js               # Menu API endpoints
│   │   ├── orders.js             # Order API endpoints
│   │   └── assistant.js          # AI assistant API endpoints
│   ├── services/
│   │   ├── menuService.js        # Menu & OpenAI integration
│   │   ├── vectorStore.js        # ChromaDB & embeddings
│   │   ├── ragService.js         # RAG pipeline
│   │   └── agentService.js       # LangChain agent & tools
│   └── server.js                 # Express server + AI initialization
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx        # App header
│   │   │   ├── MenuCard.jsx      # Menu item display
│   │   │   ├── Cart.jsx          # Shopping cart
│   │   │   ├── OrderForm.jsx     # Checkout form
│   │   │   └── AIAssistant.jsx   # AI chat interface
│   │   ├── App.jsx               # Main app component
│   │   └── main.jsx              # Entry point
│   └── index.html
├── docs/                          # Documentation (numbered for order)
│   ├── 00_QUICK_START.md
│   ├── 10_AI_STACK_ENHANCEMENT.md
│   ├── 12_RAG_IMPLEMENTATION_COMPLETE.md
│   └── ...
├── scripts/
│   ├── check-docker.js            # Docker & services health check
│   ├── check-docker-daemon.sh     # Docker Desktop check
│   ├── kill-ports.sh              # Port cleanup
│   └── cleanup-docker-containers.sh
└── docker-compose.yml             # Docker services (PostgreSQL, ChromaDB)
```

## API Endpoints

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get specific menu item

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order details

### AI Assistant
- `POST /api/assistant/chat` - Chat with AI agent (multi-tool, agentic)
- `POST /api/assistant/ask` - Ask RAG-powered question
- `POST /api/assistant/search` - Semantic search for menu items
- `GET /api/assistant/status` - Check AI service initialization status

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

### Getting Started
- [Quick Start Guide](docs/00_QUICK_START.md) - Fast setup guide
- [Setup Guide](docs/01_SETUP.md) - Detailed installation
- [Environment Setup](docs/02_ENV_SETUP.md) - Environment variables
- [OpenAI Setup](docs/04_OPENAI_SETUP.md) - OpenAI API key configuration

### Docker & Infrastructure
- [Docker Check Guide](docs/05_DOCKER_CHECK.md) - Docker health check details
- [Automated Startup](docs/07_AUTOMATED_STARTUP.md) - How automated workflow works

### AI Features
- [AI Stack Enhancement](docs/10_AI_STACK_ENHANCEMENT.md) - AI architecture guide
- [Implementation Checklist](docs/11_IMPLEMENTATION_CHECKLIST.md) - Step-by-step implementation
- [RAG Implementation Complete](docs/12_RAG_IMPLEMENTATION_COMPLETE.md) - Full AI feature summary

### Career Development
- [Resume Updates](docs/14_RESUME_UPDATES.md) - How to leverage this project for your resume

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

