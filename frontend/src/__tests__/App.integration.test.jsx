import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import App from '../App';

vi.mock('axios');

const menuItem = {
  id: 1,
  name: 'Test Roll',
  description: 'Yummy',
  price: 10,
  image: 'https://example.com/x.jpg'
};

function mockAxiosGet() {
  axios.get.mockImplementation((url) => {
    if (String(url).includes('/api/menu')) {
      return Promise.resolve({ data: [menuItem] });
    }
    if (String(url).includes('/api/assistant/status')) {
      return Promise.resolve({ data: { agent: false, rag: true, vectorStore: true } });
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });
}

describe('App integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAxiosGet();
    axios.post.mockResolvedValue({
      data: {
        id: 99,
        first_name: 'John',
        last_name: 'Doe',
        phone: '5551234567',
        created_at: new Date().toISOString(),
        total_price: 10,
        items: [{ quantity: 1, item_name: 'Test Roll', subtotal: '10.00' }]
      }
    });
  });

  test('loads menu and shows grid', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Test Roll')).toBeInTheDocument();
    });
    expect(screen.getByText(/our menu/i)).toBeInTheDocument();
  });

  test('shows error and retry on 503 menu fetch', async () => {
    const user = userEvent.setup();
    axios.get.mockImplementation((url) => {
      if (String(url).includes('/api/menu')) {
        const err = new Error('503');
        err.response = { status: 503, data: { error: 'AI not configured' } };
        return Promise.reject(err);
      }
      if (String(url).includes('/api/assistant/status')) {
        return Promise.resolve({ data: { rag: false, agent: false } });
      }
      return Promise.reject(new Error(url));
    });
    render(<App />);
    expect(await screen.findByText(/ai not configured/i)).toBeInTheDocument();
    mockAxiosGet();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(screen.getByText('Test Roll')).toBeInTheDocument());
  });

  test('shows generic error when menu fetch fails', async () => {
    axios.get.mockImplementation((url) => {
      if (String(url).includes('/api/menu')) {
        return Promise.reject(new Error('network'));
      }
      if (String(url).includes('/api/assistant/status')) {
        return Promise.resolve({ data: { rag: false } });
      }
      return Promise.reject(new Error(url));
    });
    render(<App />);
    expect(await screen.findByText(/failed to load menu/i)).toBeInTheDocument();
  });

  test('add to cart shows cart and order form; submit order shows success', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText('Test Roll')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /add to order/i }));
    expect(screen.getByText(/your order/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/phone number/i), '5551234567');
    await user.type(screen.getByLabelText(/credit card number/i), '4111111111111111');

    let resolveSubmit;
    axios.post.mockImplementation((url) => {
      if (String(url).includes('/api/orders')) {
        return new Promise((resolve) => {
          resolveSubmit = () =>
            resolve({
              data: {
                id: 99,
                first_name: 'John',
                last_name: 'Doe',
                phone: '(555) 123-4567',
                created_at: new Date().toISOString(),
                total_price: 10,
                items: [{ quantity: 1, item_name: 'Test Roll', subtotal: '10.00' }]
              }
            });
        });
      }
      if (String(url).includes('/api/assistant')) {
        return Promise.resolve({ data: {} });
      }
      return Promise.reject(new Error(url));
    });

    await user.click(screen.getByRole('button', { name: /place order/i }));
    const processingBtn = await screen.findByRole('button', { name: /processing/i });
    expect(processingBtn).toBeDisabled();
    resolveSubmit();
    await waitFor(() => expect(screen.getByText(/order confirmed/i)).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /place another order/i }));
    await waitFor(() => expect(screen.getByText('Test Roll')).toBeInTheDocument());
  });

  test('submitOrder throws network error with NETWORK_ERROR code', async () => {
    const user = userEvent.setup();
    axios.post.mockImplementation((url) => {
      if (String(url).includes('/api/orders')) {
        return Promise.reject({ request: {} });
      }
      return Promise.resolve({ data: {} });
    });
    render(<App />);
    await waitFor(() => expect(screen.getByText('Test Roll')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /add to order/i }));
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/phone number/i), '5551234567');
    await user.type(screen.getByLabelText(/credit card number/i), '4111111111111111');
    await user.click(screen.getByRole('button', { name: /place order/i }));
    expect(await screen.findByText(/unable to reach the server/i)).toBeInTheDocument();
  });
});
