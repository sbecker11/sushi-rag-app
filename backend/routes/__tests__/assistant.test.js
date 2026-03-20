import { jest, describe, test, beforeEach, expect } from '@jest/globals';

const mockRagService = {
  isInitialized: jest.fn(),
  ask: jest.fn(),
  debug: jest.fn()
};

const mockAgentService = {
  isInitialized: jest.fn(),
  chat: jest.fn()
};

const mockVectorStore = {
  isInitialized: jest.fn(),
  semanticSearch: jest.fn()
};

jest.unstable_mockModule('../../services/ragService.js', () => ({
  default: mockRagService
}));

jest.unstable_mockModule('../../services/agentService.js', () => ({
  default: mockAgentService
}));

jest.unstable_mockModule('../../services/vectorStore.js', () => ({
  default: mockVectorStore
}));

const { default: request } = await import('supertest');
const { default: express } = await import('express');
const { default: assistantRouter } = await import('../assistant.js');

const app = express();
app.use(express.json());
app.use('/api/assistant', assistantRouter);

describe('assistant routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRagService.isInitialized.mockReturnValue(true);
    mockAgentService.isInitialized.mockReturnValue(true);
    mockVectorStore.isInitialized.mockReturnValue(true);
  });

  test('POST /ask validates question', async () => {
    const res = await request(app).post('/api/assistant/ask').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Question is required');
  });

  test('POST /ask returns 503 when rag unavailable', async () => {
    mockRagService.isInitialized.mockReturnValue(false);
    const res = await request(app).post('/api/assistant/ask').send({ question: 'hi' });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('AI assistant not available');
  });

  test('POST /ask returns rag response', async () => {
    mockRagService.ask.mockResolvedValue({ answer: 'ok', sources: [] });
    const res = await request(app).post('/api/assistant/ask').send({ question: 'hi' });
    expect(res.status).toBe(200);
    expect(res.body.answer).toBe('ok');
    expect(mockRagService.ask).toHaveBeenCalledWith('hi');
  });

  test('POST /ask handles internal error', async () => {
    mockRagService.ask.mockRejectedValue(new Error('boom'));
    const res = await request(app).post('/api/assistant/ask').send({ question: 'hi' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to process question');
  });

  test('POST /chat validates message', async () => {
    const res = await request(app).post('/api/assistant/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Message is required');
  });

  test('POST /chat returns 503 when agent unavailable', async () => {
    mockAgentService.isInitialized.mockReturnValue(false);
    const res = await request(app).post('/api/assistant/chat').send({ message: 'hi' });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('AI assistant not available');
  });

  test('POST /chat returns chat response', async () => {
    mockAgentService.chat.mockResolvedValue({ response: 'hello', toolsUsed: [] });
    const res = await request(app).post('/api/assistant/chat').send({ message: 'hi', history: [] });
    expect(res.status).toBe(200);
    expect(res.body.response).toBe('hello');
    expect(mockAgentService.chat).toHaveBeenCalledWith('hi', []);
  });

  test('POST /search validates query', async () => {
    const res = await request(app).post('/api/assistant/search').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Query is required');
  });

  test('POST /search returns 503 when vector store unavailable', async () => {
    mockVectorStore.isInitialized.mockReturnValue(false);
    const res = await request(app).post('/api/assistant/search').send({ query: 'spicy' });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Search not available');
  });

  test('POST /search returns search results', async () => {
    mockVectorStore.semanticSearch.mockResolvedValue([{ name: 'Spicy Tuna Roll' }]);
    const res = await request(app).post('/api/assistant/search').send({ query: 'spicy', limit: 3 });
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(mockVectorStore.semanticSearch).toHaveBeenCalledWith('spicy', 3);
  });

  test('POST /debug validates question', async () => {
    const res = await request(app).post('/api/assistant/debug').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Question is required');
  });

  test('POST /debug returns debug payload', async () => {
    mockRagService.debug.mockResolvedValue({ available: true, selectedItems: [] });
    const res = await request(app).post('/api/assistant/debug').send({ question: 'mild rolls', limit: 5 });
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(mockRagService.debug).toHaveBeenCalledWith('mild rolls', 5);
  });

  test('GET /status returns service status flags', async () => {
    mockVectorStore.isInitialized.mockReturnValue(true);
    mockRagService.isInitialized.mockReturnValue(false);
    mockAgentService.isInitialized.mockReturnValue(true);

    const res = await request(app).get('/api/assistant/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ vectorStore: true, rag: false, agent: true });
  });
});

