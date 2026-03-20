import { jest, describe, test, beforeEach, expect } from '@jest/globals';

const mockSemanticSearch = jest.fn();
const mockVectorInitialized = jest.fn();
const mockCompletionsCreate = jest.fn();

jest.unstable_mockModule('../vectorStore.js', () => ({
  default: {
    isInitialized: mockVectorInitialized,
    semanticSearch: mockSemanticSearch
  }
}));

jest.unstable_mockModule('openai', () => ({
  default: class OpenAI {
    constructor() {
      this.chat = {
        completions: {
          create: mockCompletionsCreate
        }
      };
    }
  }
}));

const { default: ragService } = await import('../ragService.js');

describe('ragService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ragService.initialized = true;
    ragService.openai = {
      chat: {
        completions: {
          create: mockCompletionsCreate
        }
      }
    };
    mockVectorInitialized.mockReturnValue(true);
    mockSemanticSearch.mockResolvedValue([]);
    process.env.ENABLE_PERFORMANCE_LOGGING = 'false';
  });

  test('infers constraints from natural language', () => {
    const c = ragService.inferConstraints('show mild maki under $10');
    expect(c.maxPrice).toBe(10);
    expect(c.category).toBe('rolls');
    expect(c.spice).toBe('mild');
  });

  test('infers spicy and soup constraints', () => {
    const c = ragService.inferConstraints('hot soup above $5');
    expect(c.spice).toBe('spicy');
    expect(c.category).toBe('soup');
    expect(c.minPrice).toBe(5);
  });

  test('matchesCategory handles category variants', () => {
    expect(ragService.matchesCategory('Nigiri', 'nigiri')).toBe(true);
    expect(ragService.matchesCategory('Appetizers', 'appetizers')).toBe(true);
    expect(ragService.matchesCategory('Soup', 'soup')).toBe(true);
    expect(ragService.matchesCategory('Rolls', null)).toBe(true);
  });

  test('applyConstraints filters by price/category/spice', () => {
    const items = [
      { name: 'A', price: 9, category: 'Maki Rolls', spiceLevel: 1 },
      { name: 'B', price: 12, category: 'Maki Rolls', spiceLevel: 0 },
      { name: 'C', price: 8, category: 'Nigiri', spiceLevel: 0 },
      { name: 'D', price: 8, category: 'Maki Rolls', spiceLevel: 3 }
    ];
    const filtered = ragService.applyConstraints(items, {
      maxPrice: 10,
      minPrice: null,
      category: 'rolls',
      spice: 'mild'
    });
    expect(filtered.map(i => i.name)).toEqual(['A']);
  });

  test('debug returns unavailable payload when vector store is down', async () => {
    mockVectorInitialized.mockReturnValue(false);
    const res = await ragService.debug('mild rolls');
    expect(res.available).toBe(false);
    expect(res.reason).toBe('vector_store_unavailable');
  });

  test('debug returns deterministic selected items', async () => {
    mockSemanticSearch.mockResolvedValue([
      { id: 2, name: 'B', price: 9, category: 'Maki Rolls', spiceLevel: 1, similarity: 0.95, dietary: [] },
      { id: 1, name: 'A', price: 7, category: 'Maki Rolls', spiceLevel: 0, similarity: 0.9, dietary: [] }
    ]);
    const res = await ragService.debug('maki under 10', 10);
    expect(res.available).toBe(true);
    expect(res.selectedItems[0].name).toBe('A');
    expect(res.counts.selected).toBe(2);
  });

  test('ask returns unavailable response when rag is not initialized', async () => {
    ragService.initialized = false;
    ragService.openai = null;
    const res = await ragService.ask('hello');
    expect(res.answer).toContain('not available');
    expect(res.sources).toEqual([]);
  });

  test('ask returns vector unavailable response', async () => {
    mockVectorInitialized.mockReturnValue(false);
    const res = await ragService.ask('hello');
    expect(res.answer).toContain('menu database is not available');
  });

  test('ask returns no-results response when search is empty', async () => {
    mockSemanticSearch.mockResolvedValue([]);
    const res = await ragService.ask('unknown');
    expect(res.answer).toContain("couldn't find any menu items");
    expect(res.sources).toEqual([]);
  });

  test('ask uses deterministic constrained answer when constraints exist', async () => {
    mockSemanticSearch.mockResolvedValue([
      { id: 11, name: 'Mild Roll', price: 8.5, category: 'Maki Rolls', spiceLevel: 1, similarity: 0.88 }
    ]);
    const res = await ragService.ask('mild maki under $10');
    expect(res.answer).toContain('Here are the matching menu items');
    expect(res.sources[0].name).toBe('Mild Roll');
    expect(mockCompletionsCreate).not.toHaveBeenCalled();
  });

  test('ask uses LLM for unconstrained query', async () => {
    mockSemanticSearch.mockResolvedValue([
      {
        id: 1,
        name: 'Dragon Roll',
        description: 'desc',
        price: 14.99,
        ingredients: 'shrimp',
        category: 'Specialty',
        dietary: ['pescatarian'],
        spiceLevel: 0,
        similarity: 0.91
      }
    ]);
    mockCompletionsCreate.mockResolvedValue({
      choices: [{ message: { content: 'Great pick!' } }]
    });

    const res = await ragService.ask('what do you recommend?');
    expect(res.answer).toBe('Great pick!');
    expect(res.sources).toHaveLength(1);
    expect(mockCompletionsCreate).toHaveBeenCalled();
  });

  test('ask handles LLM exception with friendly error', async () => {
    mockSemanticSearch.mockResolvedValue([
      { id: 1, name: 'X', description: 'd', price: 10, category: 'Rolls', dietary: [], spiceLevel: 0, similarity: 0.8 }
    ]);
    mockCompletionsCreate.mockRejectedValue(new Error('llm down'));
    const res = await ragService.ask('anything?');
    expect(res.answer).toContain('encountered an error');
    expect(res.sources).toEqual([]);
  });

  test('initialize handles missing key and initialization error', async () => {
    const prev = process.env.OPENAI_API_KEY;
    ragService.initialized = false;
    process.env.OPENAI_API_KEY = '';
    await ragService.initialize();
    expect(ragService.isInitialized()).toBe(false);

    process.env.OPENAI_API_KEY = 'sk-test';
    ragService.initialized = false;
    const originalOpenai = ragService.openai;
    ragService.openai = null;
    // Force constructor path then throw via invalid assignment
    const realCreate = mockCompletionsCreate;
    mockCompletionsCreate.mockImplementationOnce(() => {
      throw new Error('should not execute');
    });
    await ragService.initialize();
    expect(ragService.isInitialized()).toBe(true);
    ragService.openai = originalOpenai;
    mockCompletionsCreate.mockImplementation(realCreate.getMockImplementation() || (() => Promise.resolve({ choices: [{ message: { content: 'ok' } }] })));
    process.env.OPENAI_API_KEY = prev;
  });
});

