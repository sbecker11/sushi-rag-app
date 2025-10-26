import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderForm from '../OrderForm';

describe('OrderForm Component', () => {
  const mockOnSubmit = vi.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
    totalPrice: 34.97
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Rendering', () => {
    test('should render all form fields', () => {
      render(<OrderForm {...defaultProps} />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/credit card number/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
    });

    test('should display total price with tax', () => {
      render(<OrderForm {...defaultProps} />);

      const button = screen.getByRole('button', { name: /place order/i });
      expect(button).toHaveTextContent('$37.77'); // 34.97 * 1.08
    });
  });

  describe('Form Validation - Success Cases', () => {
    test('should submit form with valid data', async () => {
      mockOnSubmit.mockResolvedValueOnce();
      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone number/i), '5551234567');
      await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          phone: expect.stringContaining('555'),
          creditCard: expect.stringContaining('4111')
        });
      });
    });

    test('should format phone number during input', async () => {
      render(<OrderForm {...defaultProps} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await userEvent.type(phoneInput, '5551234567');

      expect(phoneInput.value).toBe('(555) 123-4567');
    });

    test('should format credit card during input', async () => {
      render(<OrderForm {...defaultProps} />);

      const cardInput = screen.getByLabelText(/credit card/i);
      await userEvent.type(cardInput, '4111111111111111');

      expect(cardInput.value).toBe('4111 1111 1111 1111');
    });

    test('should accept 13-digit credit card', async () => {
      mockOnSubmit.mockResolvedValueOnce();
      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/first name/i), 'Jane');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Smith');
      await userEvent.type(screen.getByLabelText(/phone/i), '5559876543');
      await userEvent.type(screen.getByLabelText(/credit card/i), '3782822463100'); // 13 digits

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation - Failure Cases', () => {
    test('should show error for empty first name', async () => {
      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone/i), '5551234567');
      await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('should show error for empty last name', async () => {
      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/phone/i), '5551234567');
      await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      });
    });

    test('should show error for invalid phone (too short)', async () => {
      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone/i), '555123456'); // 9 digits
      await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/phone number must be 10 digits/i)).toBeInTheDocument();
      });
    });

    test('should show error for invalid credit card (too short)', async () => {
      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone/i), '5551234567');
      await userEvent.type(screen.getByLabelText(/credit card/i), '411111111111'); // 12 digits

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/credit card number must be 13-16 digits/i)).toBeInTheDocument();
      });
    });

    test('should show error for invalid credit card (too long)', async () => {
      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone/i), '5551234567');
      await userEvent.type(screen.getByLabelText(/credit card/i), '41111111111111111'); // 17 digits

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/credit card number must be 13-16 digits/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Display and UI', () => {
    test('should display backend error message', async () => {
      const error = new Error('Phone number must be 10 digits');
      error.code = 'VALIDATION_ERROR';
      error.field = 'phone';
      mockOnSubmit.mockRejectedValueOnce(error);

      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone/i), '555123456');
      await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/phone number must be 10 digits/i)).toBeInTheDocument();
        expect(screen.getByText(/order failed/i)).toBeInTheDocument();
      });
    });

    test('should highlight field with error', async () => {
      const error = new Error('First name is required');
      error.code = 'VALIDATION_ERROR';
      error.field = 'firstName';
      mockOnSubmit.mockRejectedValueOnce(error);

      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone/i), '5551234567');
      await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        const firstNameInput = screen.getByLabelText(/first name/i);
        expect(firstNameInput).toHaveClass('border-red-500');
      });
    });

    test('should show correct icon for validation error', async () => {
      const error = new Error('Invalid data');
      error.code = 'VALIDATION_ERROR';
      mockOnSubmit.mockRejectedValueOnce(error);

      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone/i), '5551234567');
      await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid data/i)).toBeInTheDocument();
        // The error icon should be present (📝 for validation)
        const errorContainer = screen.getByText(/invalid data/i).closest('div');
        expect(errorContainer).toContainHTML('📝');
      });
    });

    test('should show network error with appropriate icon', async () => {
      const error = new Error('Unable to reach the server');
      error.code = 'NETWORK_ERROR';
      mockOnSubmit.mockRejectedValueOnce(error);

      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone/i), '5551234567');
      await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        const errorContainer = screen.getByText(/unable to reach/i).closest('div');
        expect(errorContainer).toContainHTML('🌐');
      });
    });

    test('should clear error on new submission attempt', async () => {
      const error = new Error('First error');
      mockOnSubmit.mockRejectedValueOnce(error);

      render(<OrderForm {...defaultProps} />);

      // First submission with error
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone/i), '5551234567');
      await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');
      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/first error/i)).toBeInTheDocument();
      });

      // Second submission (should clear previous error)
      mockOnSubmit.mockResolvedValueOnce();
      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.queryByText(/first error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Session Storage - Development Mode', () => {
    test('should load customer data from session storage on mount', () => {
      const savedData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '(555) 987-6543',
        creditCard: '4111 1111 1111 1111'
      };
      sessionStorage.setItem('customerInfo', JSON.stringify(savedData));

      render(<OrderForm {...defaultProps} />);

      expect(screen.getByLabelText(/first name/i).value).toBe('Jane');
      expect(screen.getByLabelText(/last name/i).value).toBe('Smith');
      expect(screen.getByLabelText(/phone/i).value).toBe('(555) 987-6543');
      // Credit card loading depends on DEV mode
    });

    test('should save customer data to session storage on successful submit', async () => {
      mockOnSubmit.mockResolvedValueOnce();
      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone/i), '5551234567');
      await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        const savedData = JSON.parse(sessionStorage.getItem('customerInfo'));
        expect(savedData.firstName).toBe('John');
        expect(savedData.lastName).toBe('Doe');
        expect(savedData.phone).toContain('555');
      });
    });

    test('should not save data if submission fails', async () => {
      mockOnSubmit.mockRejectedValueOnce(new Error('Network error'));
      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone/i), '5551234567');
      await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      expect(sessionStorage.getItem('customerInfo')).toBeNull();
    });

    test('should handle corrupted session storage data', () => {
      sessionStorage.setItem('customerInfo', 'invalid json{');

      // Should not throw error, just render empty form
      expect(() => {
        render(<OrderForm {...defaultProps} />);
      }).not.toThrow();

      expect(screen.getByLabelText(/first name/i).value).toBe('');
    });
  });

  describe('Form Submission State', () => {
    test('should show loading state during submission', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone/i), '5551234567');
      await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');

      await userEvent.click(screen.getByRole('button', { name: /place order/i }));

      expect(screen.getByText(/processing/i)).toBeInTheDocument();
      
      const button = screen.getByRole('button', { name: /processing/i });
      expect(button).toBeDisabled();
    });

    test('should disable button during submission', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<OrderForm {...defaultProps} />);

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/phone/i), '5551234567');
      await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');

      const button = screen.getByRole('button', { name: /place order/i });
      
      await userEvent.click(button);

      expect(button).toBeDisabled();
      
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Error Code Categorization', () => {
    const errorCases = [
      { code: 'VALIDATION_ERROR', icon: '📝', message: 'Invalid field' },
      { code: 'NETWORK_ERROR', icon: '🌐', message: 'Network issue' },
      { code: 'DATABASE_UNAVAILABLE', icon: '🔧', message: 'Database down' },
      { code: 'TIMEOUT_ERROR', icon: '⏱️', message: 'Request timeout' },
      { code: 'DUPLICATE_ORDER', icon: '🔁', message: 'Duplicate order' },
      { code: null, icon: '⚠️', message: 'Generic error' }
    ];

    errorCases.forEach(({ code, icon, message }) => {
      test(`should show ${icon} icon for ${code || 'generic'} error`, async () => {
        const error = new Error(message);
        error.code = code;
        mockOnSubmit.mockRejectedValueOnce(error);

        render(<OrderForm {...defaultProps} />);

        await userEvent.type(screen.getByLabelText(/first name/i), 'John');
        await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
        await userEvent.type(screen.getByLabelText(/phone/i), '5551234567');
        await userEvent.type(screen.getByLabelText(/credit card/i), '4111111111111111');

        await userEvent.click(screen.getByRole('button', { name: /place order/i }));

        await waitFor(() => {
          const errorContainer = screen.getByText(new RegExp(message, 'i')).closest('div');
          expect(errorContainer).toContainHTML(icon);
        });
      });
    });
  });
});

