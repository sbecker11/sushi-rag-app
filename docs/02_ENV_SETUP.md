# Environment Setup Instructions

Since `.env` files cannot be created automatically, please create them manually:

## Create Root .env File

Create a file named `.env` in the root directory with the following content:

```env
# Backend Configuration
PORT=3001

# PostgreSQL Docker Container Configuration
POSTGRES_CONTAINER=sushi-rag-app-postgres
POSTGRES_USER=sushi_rag_app_user
POSTGRES_PASSWORD=sushi_rag_app_password
POSTGRES_DB=sushi_rag_app_orders
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

**Quick setup:**
```bash
cp env.example .env
# Then edit .env and add your OpenAI API key
```

## Getting an OpenAI API Key (Required)

The app requires an OpenAI API key for AI-powered features:

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and replace `your_openai_api_key_here` in the `.env` file

**Note**: Without an OpenAI key, the app cannot generate menus or provide AI assistance. See [docs/04_OPENAI_SETUP.md](04_OPENAI_SETUP.md) for detailed setup instructions.

## Verify Setup

After creating the `.env` file, verify it's working:

```bash
# Start the database
docker-compose up -d

# Check if environment variables are loaded
cd backend
node -e "require('dotenv').config(); console.log(process.env.POSTGRES_USER)"
```

If you see `sushi_user` printed, your environment is configured correctly!

