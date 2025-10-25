import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (two levels up: services -> backend -> root)
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

// Only instantiate OpenAI client when needed and if key is available
let openai = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
  }
  
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  return openai;
}

/**
 * Get menu items using OpenAI LLM
 * Requires OPENAI_API_KEY to be configured
 */
export async function getMenuFromLLM() {
  try {
    const client = getOpenAIClient();
    
    console.log('🤖 Calling OpenAI API to generate menu...');
    
    // Start timing
    const startTime = Date.now();
    
    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OpenAI request timeout')), 30000)
    );
    
    const apiPromise = client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant for a Japanese sushi restaurant. Generate a menu with exactly 8 items in valid JSON format with detailed information."
        },
        {
          role: "user",
          content: `Generate a restaurant menu with 8 Japanese/sushi items. Return ONLY valid JSON array with this exact structure:
[
  {
    "id": 1,
    "name": "Item Name",
    "description": "Brief description",
    "price": 9.99,
    "image": "https://images.unsplash.com/photo-relevant-food?w=400&h=300&fit=crop",
    "ingredients": "List main ingredients",
    "category": "Category name (e.g., Maki Rolls, Nigiri, Appetizers, Specialty Rolls)",
    "dietary": ["dietary options like vegetarian, vegan, gluten-free, pescatarian"],
    "spiceLevel": 0-3 (0=not spicy, 3=very spicy)
  }
]

Use real Unsplash image URLs for food photos. Make prices realistic ($3-$20). Include variety: rolls, nigiri, appetizers, and entrees. Be specific with ingredients and dietary information.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
    
    const response = await Promise.race([apiPromise, timeoutPromise]);
    
    // End timing and calculate duration
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log performance if enabled
    if (process.env.ENABLE_PERFORMANCE_LOGGING === 'true') {
      console.log(`⏱️  OpenAI LLM Response Time: ${duration}ms`);
    }

    const content = response.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || content.match(/(\[[\s\S]*?\])/);
    
    if (jsonMatch) {
      const menuItems = JSON.parse(jsonMatch[1]);
      console.log('✅ Generated menu from OpenAI LLM');
      return menuItems;
    }
    
    throw new Error('Could not parse JSON from LLM response');
  } catch (error) {
    console.error('❌ Error fetching menu from LLM:', error.message);
    if (error.status) console.error('   Status:', error.status);
    if (error.type) console.error('   Type:', error.type);
    throw error; // Re-throw error instead of falling back to static menu
  }
}

