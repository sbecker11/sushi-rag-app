import { jest, describe, test, beforeEach, expect } from '@jest/globals';

let mockCreateCompletion = jest.fn();

jest.unstable_mockModule('openai', () => ({
  default: class OpenAI {
    constructor() {
      this.chat = {
        completions: {
          create: mockCreateCompletion
        }
      };
    }
  }
}));

const menuModule = await import('../menuService.js');
const { getMenuFromLLM, clearMenuCache, getCacheStatus } = menuModule;

describe('menuService', () => {
  const originalEnv = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    clearMenuCache();
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.ENABLE_PERFORMANCE_LOGGING = 'false';
  });

  test('returns fallback static menu when key is missing', async () => {
    process.env.OPENAI_API_KEY = '';
    const menu = await getMenuFromLLM();
    expect(Array.isArray(menu)).toBe(true);
    expect(menu.length).toBeGreaterThan(0);
    expect(menu[0]).toHaveProperty('name');
  });

  test('parses plain JSON array response', async () => {
    mockCreateCompletion.mockResolvedValue({
      choices: [{
        finish_reason: 'stop',
        message: {
          content: '[{"id":1,"name":"Test Roll","description":"Desc","price":9.99,"image":"https://x","ingredients":"I","category":"Rolls","dietary":["pescatarian"],"spiceLevel":0}]'
        }
      }]
    });

    const menu = await getMenuFromLLM();
    expect(menu).toHaveLength(1);
    expect(menu[0].name).toBe('Test Roll');
    expect(getCacheStatus().cached).toBe(true);
  });

  test('parses fenced JSON response and strips wrapper text', async () => {
    mockCreateCompletion.mockResolvedValue({
      choices: [{
        finish_reason: 'stop',
        message: {
          content: 'Here is your menu:\n```json\n[{"id":2,"name":"Fenced Roll","description":"Desc","price":8.5,"image":"https://x","ingredients":"I","category":"Rolls","dietary":["vegan"],"spiceLevel":0}]\n```'
        }
      }]
    });
    const menu = await getMenuFromLLM();
    expect(menu[0].name).toBe('Fenced Roll');
  });

  test('returns cached menu on second call', async () => {
    mockCreateCompletion.mockResolvedValue({
      choices: [{
        finish_reason: 'stop',
        message: {
          content: '[{"id":3,"name":"Cached Roll","description":"Desc","price":7.25,"image":"https://x","ingredients":"I","category":"Rolls","dietary":["pescatarian"],"spiceLevel":0}]'
        }
      }]
    });

    const first = await getMenuFromLLM();
    const second = await getMenuFromLLM();
    expect(first[0].name).toBe('Cached Roll');
    expect(second[0].name).toBe('Cached Roll');
    expect(mockCreateCompletion).toHaveBeenCalledTimes(1);
  });

  test('falls back to static menu when LLM JSON is invalid', async () => {
    mockCreateCompletion.mockResolvedValue({
      choices: [{
        finish_reason: 'stop',
        message: { content: '[{"id":1,"name":"Bad JSON",]' }
      }]
    });

    const menu = await getMenuFromLLM();
    expect(menu.length).toBeGreaterThan(1); // fallback static menu contains multiple items
  });

  test('cache status reflects clear/reset lifecycle', async () => {
    expect(getCacheStatus().cached).toBe(false);

    mockCreateCompletion.mockResolvedValue({
      choices: [{
        finish_reason: 'stop',
        message: {
          content: '[{"id":4,"name":"Status Roll","description":"Desc","price":11.0,"image":"https://x","ingredients":"I","category":"Rolls","dietary":["pescatarian"],"spiceLevel":0}]'
        }
      }]
    });

    await getMenuFromLLM();
    expect(getCacheStatus().cached).toBe(true);

    clearMenuCache();
    expect(getCacheStatus().cached).toBe(false);
  });

  test('returns expired cache when API call fails after cache exists', async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      choices: [{
        finish_reason: 'stop',
        message: {
          content: '[{"id":5,"name":"Cached Fallback","description":"Desc","price":6.5,"image":"https://x","ingredients":"I","category":"Rolls","dietary":["pescatarian"],"spiceLevel":0}]'
        }
      }]
    });
    const first = await getMenuFromLLM();
    expect(first[0].name).toBe('Cached Fallback');

    mockCreateCompletion.mockRejectedValueOnce(new Error('network'));
    const second = await getMenuFromLLM();
    expect(second[0].name).toBe('Cached Fallback');
  });

  test('falls back when response has no JSON array', async () => {
    mockCreateCompletion.mockResolvedValue({
      choices: [{
        finish_reason: 'stop',
        message: { content: 'No JSON here' }
      }]
    });
    const menu = await getMenuFromLLM();
    expect(menu.length).toBeGreaterThan(1);
  });

  afterAll(() => {
    process.env.OPENAI_API_KEY = originalEnv;
  });
});

