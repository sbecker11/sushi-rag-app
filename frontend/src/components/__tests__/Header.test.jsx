import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../Header';

describe('Header', () => {
  test('renders title and tagline', () => {
    render(<Header />);
    expect(screen.getByRole('heading', { name: /sushi rag app/i })).toBeInTheDocument();
    expect(screen.getByText(/ai-powered japanese cuisine/i)).toBeInTheDocument();
  });
});
