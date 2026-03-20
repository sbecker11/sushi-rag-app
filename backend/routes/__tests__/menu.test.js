import { jest, describe, test, beforeEach, expect } from '@jest/globals';

const mockGetMenuFromLLM = jest.fn();

jest.unstable_mockModule('../../services/menuService.js', () => ({
  getMenuFromLLM: mockGetMenuFromLLM
}));

const { default: request } = await import('supertest');
const { default: express } = await import('express');
const { default: menuRouter } = await import('../menu.js');

const app = express();
app.use('/api/menu', menuRouter);

describe('menu route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns menu items from service', async () => {
    mockGetMenuFromLLM.mockResolvedValue([{ id: 1, name: 'Roll' }]);
    const res = await request(app).get('/api/menu');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: 'Roll' }]);
  });

  test('returns 503 for OpenAI key configuration errors', async () => {
    mockGetMenuFromLLM.mockRejectedValue(new Error('OpenAI API key missing'));
    const res = await request(app).get('/api/menu');
    expect(res.status).toBe(503);
    expect(res.body.error).toContain('AI features are not configured');
  });

  test('returns 500 for generic failures', async () => {
    mockGetMenuFromLLM.mockRejectedValue(new Error('something else'));
    const res = await request(app).get('/api/menu');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch menu');
  });
});

