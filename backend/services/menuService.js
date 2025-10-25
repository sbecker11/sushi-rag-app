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
          content: "You are a JSON generator. Return ONLY valid JSON, no extra text."
        },
        {
          role: "user",
          content: `Generate 8 sushi items as a JSON array. Format (compact, no line breaks):
[{"id":1,"name":"Name","description":"Brief","price":9.99,"image":"https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300","ingredients":"List","category":"Category","dietary":["type"],"spiceLevel":0}]

Include: rolls, nigiri, appetizers. Prices $5-$15. Return ONLY the JSON.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2500,
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
      try {
        // Try to fix common JSON issues
        let jsonString = jsonMatch[1]
          .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
          .replace(/'/g, '"')              // Replace single quotes with double quotes
          .replace(/(\w+):/g, '"$1":');    // Quote unquoted keys
        
        const menuItems = JSON.parse(jsonString);
        console.log('✅ Generated menu from OpenAI LLM');
        return menuItems;
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError.message);
        console.error('   Raw content:', content.substring(0, 500));
        throw new Error('Could not parse JSON from LLM response: ' + parseError.message);
      }
    }
    
    throw new Error('Could not find JSON array in LLM response');
  } catch (error) {
    console.error('❌ Error fetching menu from LLM:', error.message);
    if (error.status) console.error('   Status:', error.status);
    if (error.type) console.error('   Type:', error.type);
    
    // Fallback to simple static menu so app can work
    console.log('ℹ️  Using fallback static menu');
    return [
      {
        id: 1,
        name: "California Roll",
        description: "Crab, avocado, cucumber",
        price: 8.99,
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300",
        ingredients: "Crab, Avocado, Cucumber, Rice, Nori",
        category: "Maki Rolls",
        dietary: ["pescatarian"],
        spiceLevel: 0
      },
      {
        id: 2,
        name: "Spicy Tuna Roll",
        description: "Tuna with spicy mayo",
        price: 9.99,
        image: "https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=400&h=300",
        ingredients: "Tuna, Spicy Mayo, Cucumber, Rice",
        category: "Maki Rolls",
        dietary: ["pescatarian"],
        spiceLevel: 3
      },
      {
        id: 3,
        name: "Salmon Nigiri",
        description: "Fresh salmon on rice",
        price: 6.99,
        image: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400&h=300",
        ingredients: "Salmon, Sushi Rice, Wasabi",
        category: "Nigiri",
        dietary: ["pescatarian", "gluten-free"],
        spiceLevel: 0
      },
      {
        id: 4,
        name: "Vegetable Tempura",
        description: "Crispy fried vegetables",
        price: 7.99,
        image: "https://images.unsplash.com/photo-1576774213852-c2c7e0c6dbfc?w=400&h=300",
        ingredients: "Sweet Potato, Broccoli, Carrot, Tempura Batter",
        category: "Appetizers",
        dietary: ["vegetarian"],
        spiceLevel: 0
      },
      {
        id: 5,
        name: "Dragon Roll",
        description: "Shrimp tempura with eel",
        price: 14.99,
        image: "https://images.unsplash.com/photo-1564489563601-c53cfc451e93?w=400&h=300",
        ingredients: "Shrimp, Eel, Avocado, Cucumber, Eel Sauce",
        category: "Specialty Rolls",
        dietary: ["pescatarian"],
        spiceLevel: 0
      },
      {
        id: 6,
        name: "Edamame",
        description: "Steamed soybeans with salt",
        price: 4.99,
        image: "https://images.unsplash.com/photo-1583663237037-b57a45c1e5d6?w=400&h=300",
        ingredients: "Soybeans, Sea Salt",
        category: "Appetizers",
        dietary: ["vegan", "vegetarian", "gluten-free"],
        spiceLevel: 0
      },
      {
        id: 7,
        name: "Rainbow Roll",
        description: "California roll with assorted fish",
        price: 13.99,
        image: "https://images.unsplash.com/photo-1582450871972-ab5ca641643d?w=400&h=300",
        ingredients: "Tuna, Salmon, Yellowtail, Crab, Avocado",
        category: "Specialty Rolls",
        dietary: ["pescatarian"],
        spiceLevel: 0
      },
      {
        id: 8,
        name: "Miso Soup",
        description: "Traditional Japanese soup",
        price: 3.99,
        image: "https://images.unsplash.com/photo-1588566565463-180a5b2090d2?w=400&h=300",
        ingredients: "Miso Paste, Tofu, Seaweed, Green Onions",
        category: "Soup",
        dietary: ["vegan", "vegetarian", "gluten-free"],
        spiceLevel: 0
      }
    ];
  }
}

