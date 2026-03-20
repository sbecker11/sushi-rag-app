import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderSuccess from '../OrderSuccess';

const mockOrder = {
  id: 42,
  first_name: 'Jane',
  last_name: 'Doe',
  phone: '5551234567',
  created_at: '2025-01-15T12:00:00.000Z',
  total_price: 25.5,
  items: [
    { quantity: 2, item_name: 'Salmon Roll', subtotal: '20.00' }
  ]
};

describe('OrderSuccess', () => {
  test('renders order details and new order button', () => {
    const onNew = vi.fn();
    render(<OrderSuccess order={mockOrder} onNewOrder={onNew} />);
    expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
    expect(screen.getByText(/thank you for your order, jane/i)).toBeInTheDocument();
    expect(screen.getByText(/#000042/)).toBeInTheDocument();
    expect(screen.getByText(/2x salmon roll/i)).toBeInTheDocument();
  });

  test('calls onNewOrder when button clicked', async () => {
    const user = userEvent.setup();
    const onNew = vi.fn();
    render(<OrderSuccess order={mockOrder} onNewOrder={onNew} />);
    await user.click(screen.getByRole('button', { name: /place another order/i }));
    expect(onNew).toHaveBeenCalled();
  });

  test('renders without items section when items empty', () => {
    const { items, ...noItems } = mockOrder;
    render(<OrderSuccess order={{ ...noItems, items: [] }} onNewOrder={vi.fn()} />);
    expect(screen.queryByText(/order items/i)).not.toBeInTheDocument();
  });
});
