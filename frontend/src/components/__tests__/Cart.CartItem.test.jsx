import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Cart from '../Cart';
import CartItem from '../CartItem';

describe('Cart', () => {
  test('shows empty state', () => {
    render(<Cart cartItems={[]} onUpdateQuantity={vi.fn()} totalPrice={0} />);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  test('shows items and totals', () => {
    const items = [{ id: 1, name: 'Roll', price: 10, quantity: 2 }];
    render(<Cart cartItems={items} onUpdateQuantity={vi.fn()} totalPrice={20} />);
    expect(screen.getByText('Roll')).toBeInTheDocument();
    expect(screen.getByText('Subtotal').closest('div')).toHaveTextContent('$20.00');
    expect(screen.getByText('Tax (8%)').closest('div')).toHaveTextContent('$1.60');
    expect(screen.getByText('Total').closest('div')).toHaveTextContent('$21.60');
  });
});

describe('CartItem', () => {
  test('decrease calls onUpdateQuantity', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<CartItem item={{ id: 5, name: 'X', price: 3, quantity: 2 }} onUpdateQuantity={onUpdate} />);
    await user.click(screen.getByRole('button', { name: /decrease quantity/i }));
    expect(onUpdate).toHaveBeenCalledWith(5, 1);
  });

  test('increase calls onUpdateQuantity when under 9', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<CartItem item={{ id: 1, name: 'X', price: 5, quantity: 1 }} onUpdateQuantity={onUpdate} />);
    await user.click(screen.getByRole('button', { name: /increase quantity/i }));
    expect(onUpdate).toHaveBeenCalledWith(1, 2);
  });

  test('increase disabled at quantity 9', () => {
    render(<CartItem item={{ id: 1, name: 'X', price: 5, quantity: 9 }} onUpdateQuantity={vi.fn()} />);
    expect(screen.getByRole('button', { name: /increase quantity/i })).toBeDisabled();
  });
});
