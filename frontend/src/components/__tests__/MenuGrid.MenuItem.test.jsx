import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuGrid from '../MenuGrid';
import MenuItem from '../MenuItem';

const sampleItem = {
  id: 1,
  name: 'California Roll',
  description: 'Crab and avocado',
  price: 8.99,
  image: 'https://example.com/img.jpg'
};

describe('MenuItem', () => {
  test('renders item and calls onAddToCart', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<MenuItem item={sampleItem} onAddToCart={onAdd} />);
    expect(screen.getByText('California Roll')).toBeInTheDocument();
    expect(screen.getByText(/\$8\.99/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add to order/i }));
    expect(onAdd).toHaveBeenCalledWith(sampleItem);
  });

  test('image onError sets fallback src', () => {
    const onAdd = vi.fn();
    render(<MenuItem item={sampleItem} onAddToCart={onAdd} />);
    const img = screen.getByRole('img', { name: /california roll/i });
    fireEvent.error(img);
    expect(img.src).toContain('unsplash.com');
  });
});

describe('MenuGrid', () => {
  test('renders a MenuItem per menu item', () => {
    const onAdd = vi.fn();
    const items = [
      sampleItem,
      { id: 2, name: 'Spicy Tuna', description: 'Hot', price: 9.99, image: 'https://x' }
    ];
    render(<MenuGrid menuItems={items} onAddToCart={onAdd} />);
    expect(screen.getByText('California Roll')).toBeInTheDocument();
    expect(screen.getByText('Spicy Tuna')).toBeInTheDocument();
  });
});
