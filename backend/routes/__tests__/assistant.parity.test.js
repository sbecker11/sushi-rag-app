import { jest, describe, test, beforeEach, expect } from '@jest/globals';

const mockItems = [
  { id: 1, name: 'California Roll', price: 8.99, category: 'Rolls', spiceLevel: 0, dietary: ['pescatarian'], similarity: 0.55, description: 'Crab and avocado' },
  { id: 2, name: 'Spicy Tuna Roll', price: 9.5, category: 'Rolls', spiceLevel: 2, dietary: ['pescatarian'], similarity: 0.56, description: 'Tuna with spicy mayo' },
  { id: 3, name: 'Avocado Maki', price: 6.25, category: 'Rolls', spiceLevel: 0, dietary: ['vegan'], similarity: 0.61, description: 'Avocado wrapped in sushi rice' },
  { id: 4, name: 'Dragon Roll', price: 12.75, category: 'Rolls', spiceLevel: 0, dietary: ['pescatarian'], similarity: 0.54, description: 'Eel and avocado topped with avocado' },
  { id: 5, name: 'Salmon Nigiri', price: 7.25, category: 'Nigiri', spiceLevel: 0, dietary: ['pescatarian'], similarity: 0.46, description: 'Fresh salmon on sushi rice' }
];

const mockVectorStore = {
  isInitialized: jest.fn(),
  semanticSearch: jest.fn()
};

jest.unstable_mockModule('../../services/vectorStore.js', () => ({
  default: mockVectorStore
}));

const { default: ragService } = await import('../../services/ragService.js');
const { default: request } = await import('supertest');
const { default: express } = await import('express');
const { default: assistantRouter } = await import('../assistant.js');

const app = express();
app.use(express.json());
app.use('/api/assistant', assistantRouter);

describe('Assistant parity and debug integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVectorStore.isInitialized.mockReturnValue(true);
    mockVectorStore.semanticSearch.mockResolvedValue(mockItems);

    // Keep ragService in initialized state without requiring live OpenAI calls.
    ragService.initialized = true;
    ragService.openai = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };
  });

  test('constrained ask query returns deterministic filtered results', async () => {
    const result = await ragService.ask('Show me mild maki rolls under $10');

    expect(result.answer).toContain('Here are the matching menu items');
    expect(result.sources.map(s => s.name)).toEqual(['Avocado Maki', 'California Roll']);
    expect(result.sources.every(s => s.price < 10)).toBe(true);
  });

  test('POST /api/assistant/debug returns parsed constraints and selected items', async () => {
    const response = await request(app)
      .post('/api/assistant/debug')
      .send({ question: 'Show me mild maki rolls under $10', limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      available: true,
      hasConstraints: true
    });
    expect(response.body.constraints).toMatchObject({
      maxPrice: 10,
      category: 'rolls',
      spice: 'mild'
    });
    expect(response.body.selectedItems.map(i => i.name)).toEqual(['Avocado Maki', 'California Roll']);
  });

  test('POST /api/assistant/debug validates question', async () => {
    const response = await request(app)
      .post('/api/assistant/debug')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Question is required');
  });

  test('POST /api/assistant/debug returns 503 when vector store unavailable', async () => {
    mockVectorStore.isInitialized.mockReturnValue(false);

    const response = await request(app)
      .post('/api/assistant/debug')
      .send({ question: 'What is nigiri?' });

    expect(response.status).toBe(503);
    expect(response.body.error).toBe('Debug not available');
  });
});

