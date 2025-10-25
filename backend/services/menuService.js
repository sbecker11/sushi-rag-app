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
    return null;
  }
  
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  return openai;
}

// Static menu as fallback and for demo purposes
// Intentionally diverse to distinguish from AI-generated sushi menu
const STATIC_MENU = [
  {
    id: 1,
    name: "Classic Margherita Pizza",
    description: "Fresh mozzarella, tomato sauce, basil, and olive oil",
    price: 14.99,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop"
  },
  {
    id: 2,
    name: "BBQ Bacon Burger",
    description: "Angus beef patty, crispy bacon, cheddar, BBQ sauce, onion rings",
    price: 13.50,
    image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop"
  },
  {
    id: 3,
    name: "Caesar Salad",
    description: "Romaine lettuce, parmesan, croutons, Caesar dressing",
    price: 9.99,
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop"
  },
  {
    id: 4,
    name: "Chicken Tikka Masala",
    description: "Tender chicken in creamy tomato curry sauce with basmati rice",
    price: 16.99,
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop"
  },
  {
    id: 5,
    name: "Fish Tacos",
    description: "Grilled mahi-mahi, cabbage slaw, lime crema, three soft tortillas",
    price: 12.99,
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop"
  },
  {
    id: 6,
    name: "Pad Thai",
    description: "Rice noodles, shrimp, peanuts, bean sprouts, tamarind sauce",
    price: 13.99,
    image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop"
  },
  {
    id: 7,
    name: "Lobster Mac & Cheese",
    description: "Creamy four-cheese sauce with chunks of fresh lobster",
    price: 22.99,
    image: "https://images.unsplash.com/photo-1476124369491-f51a157fc5ea?w=400&h=300&fit=crop"
  },
  {
    id: 8,
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with molten center, vanilla ice cream",
    price: 8.99,
    image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop"
  }
];

/**
 * Get menu items using OpenAI LLM
 * Falls back to static menu if API key is not configured
 */
export async function getMenuFromLLM() {
  const client = getOpenAIClient();
  
  // Return static menu if no API key
  if (!client) {
    console.log('ℹ️  Using static menu (OpenAI API key not configured)');
    return STATIC_MENU;
  }

  try {
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
          content: "You are a helpful assistant for a Japanese sushi restaurant. Generate a menu with exactly 8 items in valid JSON format."
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
    "image": "https://images.unsplash.com/photo-relevant-food?w=400&h=300&fit=crop"
  }
]

Use real Unsplash image URLs for food photos. Make prices realistic ($3-$20). Include variety: rolls, nigiri, appetizers, and entrees.`
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
    console.log('ℹ️  Falling back to static menu');
    return STATIC_MENU;
  }
}

export { STATIC_MENU };

