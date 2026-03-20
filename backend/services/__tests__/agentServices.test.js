import { jest, describe, test, beforeEach, expect } from '@jest/globals';

const mockInvoke = jest.fn();
const mockSemanticSearch = jest.fn();
const mockVectorInitialized = jest.fn();

class MockMessage {
  constructor(content) {
    this.content = content;
  }
}

jest.unstable_mockModule('langchain', () => ({
  createAgent: jest.fn(() => ({ invoke: mockInvoke })),
  tool: jest.fn((fn, cfg) => ({ invoke: fn, ...cfg })),
  HumanMessage: class HumanMessage extends MockMessage {
    _getType() { return 'human'; }
  },
  AIMessage: class AIMessage extends MockMessage {
    _getType() { return 'ai'; }
  }
}));

jest.unstable_mockModule('@langchain/openai', () => ({
  ChatOpenAI: class ChatOpenAI {}
}));

jest.unstable_mockModule('../vectorStore.js', () => ({
  default: {
    isInitialized: mockVectorInitialized,
    semanticSearch: mockSemanticSearch
  }
}));

const { default: agentService } = await import('../agentService.js');
const { default: simpleAgent } = await import('../agentService-simple.js');
const { createAgent } = await import('langchain');

describe('agent services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVectorInitialized.mockReturnValue(true);
    mockSemanticSearch.mockResolvedValue([
      { id: 1, name: 'Spicy Tuna', description: 'desc', price: 9.99, category: 'Rolls', dietary: [], spiceLevel: 3, ingredients: 'tuna', image: 'img' }
    ]);
    agentService.initialized = true;
    agentService.agent = { invoke: mockInvoke };
  });

  test('simple disabled agent returns fixed message', async () => {
    const res = await simpleAgent.chat('hi');
    expect(res).toContain('temporarily disabled');
    expect(simpleAgent.isInitialized()).toBe(false);
  });

  test('simple agent initialize remains disabled and handles re-init', async () => {
    simpleAgent.initialized = false;
    await simpleAgent.initialize();
    expect(simpleAgent.isInitialized()).toBe(false);
    await simpleAgent.initialize();
    expect(simpleAgent.isInitialized()).toBe(false);
  });

  test('history conversion only keeps user/assistant roles', () => {
    const messages = agentService._historyToMessages([
      { role: 'system', content: 'x' },
      { role: 'user', content: 'u1' },
      { role: 'assistant', content: 'a1' }
    ]);
    expect(messages).toHaveLength(2);
  });

  test('extracts response text and tool calls', () => {
    const result = agentService._extractResponseAndTools({
      messages: [{
        _getType: () => 'ai',
        content: 'Final answer',
        tool_calls: [{ name: 'search_menu', args: { query: 'spicy' } }]
      }]
    });

    expect(result.response).toBe('Final answer');
    expect(result.toolsUsed).toEqual([{ tool: 'search_menu', input: { query: 'spicy' } }]);
  });

  test('chat returns unavailable message when uninitialized', async () => {
    agentService.initialized = false;
    agentService.agent = null;
    const res = await agentService.chat('hello');
    expect(res.response).toContain('not available');
    expect(res.toolsUsed).toEqual([]);
  });

  test('initialize exits when API key is missing', async () => {
    const prev = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = '';
    agentService.initialized = false;
    await agentService.initialize();
    expect(agentService.isInitialized()).toBe(false);
    process.env.OPENAI_API_KEY = prev;
  });

  test('initialize builds agent when key exists', async () => {
    const prev = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-test';
    agentService.initialized = false;
    await agentService.initialize();
    expect(createAgent).toHaveBeenCalled();
    expect(agentService.isInitialized()).toBe(true);
    process.env.OPENAI_API_KEY = prev;
  });

  test('initialize returns early when already initialized', async () => {
    agentService.initialized = true;
    await agentService.initialize();
    expect(agentService.isInitialized()).toBe(true);
  });

  test('chat returns extracted agent response', async () => {
    mockInvoke.mockResolvedValue({
      messages: [{ _getType: () => 'ai', content: 'Hello from agent', tool_calls: [] }]
    });
    const res = await agentService.chat('hello', [{ role: 'user', content: 'prev' }]);
    expect(res.response).toBe('Hello from agent');
  });

  test('chat handles invoke errors gracefully', async () => {
    mockInvoke.mockRejectedValue(new Error('agent failed'));
    const res = await agentService.chat('hello');
    expect(res.response).toContain('encountered an error');
    expect(res.toolsUsed).toEqual([]);
  });

  test('tool functions honor vector store availability and filtering', async () => {
    const tools = agentService.createTools();
    mockVectorInitialized.mockReturnValue(false);
    const unavailable = await tools[0].invoke({ query: 'spicy' });
    expect(unavailable).toContain('not available');

    mockVectorInitialized.mockReturnValue(true);
    mockSemanticSearch.mockResolvedValue([
      { id: 1, name: 'A', description: 'd', price: 8 },
      { id: 2, name: 'B', description: 'd', price: 12 }
    ]);
    const filtered = await tools[1].invoke({ max: 10 });
    expect(filtered).toContain('"name":"A"');
    expect(filtered).not.toContain('"name":"B"');
  });

  test('tool functions handle edge and error branches', async () => {
    const tools = agentService.createTools();

    mockVectorInitialized.mockReturnValue(true);
    mockSemanticSearch.mockResolvedValue([]);
    const emptySearch = await tools[0].invoke({ query: 'none' });
    expect(emptySearch).toContain('No items found');

    const noPriceMatch = await tools[1].invoke({ min: 999 });
    expect(noPriceMatch).toContain('No items found in that price range');

    const noItemDetails = await tools[2].invoke({ itemName: 'unknown' });
    expect(noItemDetails).toContain('Item not found');

    mockSemanticSearch.mockRejectedValue(new Error('boom'));
    const searchErr = await tools[0].invoke({ query: 'x' });
    const priceErr = await tools[1].invoke({ min: 1 });
    const detailsErr = await tools[2].invoke({ itemName: 'x' });
    expect(searchErr).toContain('Search failed');
    expect(priceErr).toContain('Price filtering failed');
    expect(detailsErr).toContain('Failed to get item details');
  });
});

