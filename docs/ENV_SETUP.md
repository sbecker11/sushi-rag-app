# Environment Setup Instructions

Since `.env` files cannot be created automatically, please create them manually:

## Create Root .env File

Create a file named `.env` in the root directory (`/Users/sbecker11/workspace-sushi/sushi-agent/.env`) with the following content:

```env
# Database Configuration
POSTGRES_USER=sushi_user
POSTGRES_PASSWORD=sushi_password
POSTGRES_DB=sushi_orders
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration (for LLM menu generation)
# Replace 'your_openai_api_key_here' with your actual OpenAI API key
# If you don't have one, the app will use a static menu
OPENAI_API_KEY=your_openai_api_key_here

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Getting an OpenAI API Key (Optional)

If you want to use LLM-generated menus:

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and replace `your_openai_api_key_here` in the `.env` file

**Note**: The app works perfectly fine without an OpenAI key - it will use a pre-configured static menu with 8 delicious sushi items!

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

