import { jest, describe, test, beforeEach, expect } from '@jest/globals';

const mockHeartbeat = jest.fn();
const mockGetCollection = jest.fn();
const mockCreateCollection = jest.fn();
const mockDeleteCollection = jest.fn();
const mockEmbeddingsCreate = jest.fn();

const mockCollection = {
  count: jest.fn(),
  add: jest.fn(),
  query: jest.fn()
};

jest.unstable_mockModule('chromadb', () => ({
  ChromaClient: class ChromaClient {
    constructor() {}
    heartbeat = mockHeartbeat;
    getCollection = mockGetCollection;
    createCollection = mockCreateCollection;
    deleteCollection = mockDeleteCollection;
  }
}));

jest.unstable_mockModule('openai', () => ({
  default: class OpenAI {
    constructor() {
      this.embeddings = {
        create: mockEmbeddingsCreate
      };
    }
  }
}));

const { default: vectorStore } = await import('../vectorStore.js');

describe('vectorStore service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    vectorStore.client = null;
    vectorStore.openai = null;
    vectorStore.collection = null;
    vectorStore.initialized = false;
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.ENABLE_PERFORMANCE_LOGGING = 'false';

    mockHeartbeat.mockResolvedValue({});
    mockGetCollection.mockResolvedValue(mockCollection);
    mockCreateCollection.mockResolvedValue(mockCollection);
    mockCollection.count.mockResolvedValue(0);
    mockCollection.add.mockResolvedValue({});
    mockCollection.query.mockResolvedValue({
      metadatas: [[{
        id: 1,
        name: 'Spicy Tuna Roll',
        description: 'Hot',
        price: 9.99,
        image: 'img',
        ingredients: 'tuna',
        category: 'Rolls',
        dietary: 'pescatarian',
        spiceLevel: 3
      }]],
      distances: [[0.2]]
    });
    mockEmbeddingsCreate.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2, 0.3] }]
    });
  });

  test('does not initialize without API key', async () => {
    process.env.OPENAI_API_KEY = '';
    await vectorStore.initialize();
    expect(vectorStore.isInitialized()).toBe(false);
  });

  test('initializes with existing collection', async () => {
    await vectorStore.initialize();
    expect(vectorStore.isInitialized()).toBe(true);
    expect(mockGetCollection).toHaveBeenCalledWith({ name: 'sushi_menu' });
  });

  test('initialize returns early when already initialized', async () => {
    vectorStore.initialized = true;
    await vectorStore.initialize();
    expect(mockHeartbeat).not.toHaveBeenCalled();
  });

  test('creates collection when getCollection fails', async () => {
    mockGetCollection.mockRejectedValue(new Error('not found'));
    await vectorStore.initialize();
    expect(vectorStore.isInitialized()).toBe(true);
    expect(mockCreateCollection).toHaveBeenCalled();
  });

  test('returns [] for semantic search when not initialized', async () => {
    vectorStore.initialized = false;
    const results = await vectorStore.semanticSearch('spicy');
    expect(results).toEqual([]);
  });

  test('initialize failure keeps service disabled', async () => {
    mockHeartbeat.mockRejectedValue(new Error('chroma down'));
    await vectorStore.initialize();
    expect(vectorStore.isInitialized()).toBe(false);
  });

  test('generateEmbedding throws when openai client missing', async () => {
    await expect(vectorStore.generateEmbedding('hello')).rejects.toThrow('OpenAI client not initialized');
  });

  test('semantic search transforms metadata and similarity', async () => {
    await vectorStore.initialize();
    const results = await vectorStore.semanticSearch('spicy', 1);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Spicy Tuna Roll');
    expect(results[0].similarity).toBeCloseTo(0.8);
    expect(results[0].dietary).toEqual(['pescatarian']);
  });

  test('semantic search handles empty metadata payload', async () => {
    await vectorStore.initialize();
    mockCollection.query.mockResolvedValue({ metadatas: [], distances: [[]] });
    const results = await vectorStore.semanticSearch('spicy');
    expect(results).toEqual([]);
  });

  test('indexMenu indexes items and writes to collection', async () => {
    await vectorStore.initialize();
    await vectorStore.indexMenu([{
      id: 10,
      name: 'Dragon Roll',
      description: 'desc',
      price: 12.99,
      image: 'img',
      ingredients: 'shrimp',
      category: 'Specialty',
      dietary: ['pescatarian'],
      spiceLevel: 0
    }]);

    expect(mockEmbeddingsCreate).toHaveBeenCalled();
    expect(mockCollection.add).toHaveBeenCalled();
  });

  test('indexMenu skips when not initialized', async () => {
    vectorStore.initialized = false;
    vectorStore.collection = null;
    await vectorStore.indexMenu([{ id: 1 }]);
    expect(mockCollection.add).not.toHaveBeenCalled();
  });

  test('indexMenu recreates collection when existing docs are present', async () => {
    await vectorStore.initialize();
    mockCollection.count.mockResolvedValue(2);
    await vectorStore.indexMenu([{
      id: 11,
      name: 'A',
      description: 'd',
      price: 5,
      ingredients: 'i',
      category: 'Rolls',
      dietary: [],
      spiceLevel: 0
    }]);
    expect(mockDeleteCollection).toHaveBeenCalledWith({ name: 'sushi_menu' });
    expect(mockCreateCollection).toHaveBeenCalled();
  });

  test('semanticSearch catches query failures', async () => {
    await vectorStore.initialize();
    mockCollection.query.mockRejectedValue(new Error('query failed'));
    const results = await vectorStore.semanticSearch('spicy');
    expect(results).toEqual([]);
  });

  test('indexMenu surfaces add failures', async () => {
    await vectorStore.initialize();
    mockCollection.add.mockRejectedValueOnce(new Error('add failed'));
    await expect(vectorStore.indexMenu([{
      id: 20,
      name: 'Y',
      description: 'd',
      price: 9,
      ingredients: '',
      category: 'Rolls',
      dietary: [],
      spiceLevel: 0
    }])).rejects.toThrow('add failed');
  });
});

