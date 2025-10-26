import { useState, useEffect } from 'react';

export default function OrderForm({ onSubmit, totalPrice }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    creditCard: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState(null);
  const [errorField, setErrorField] = useState(null);

  // Load saved customer information from sessionStorage on mount
  useEffect(() => {
    const savedCustomer = sessionStorage.getItem('customerInfo');
    if (savedCustomer) {
      try {
        const { firstName, lastName, phone, creditCard } = JSON.parse(savedCustomer);
        setFormData(prev => ({
          ...prev,
          firstName: firstName || '',
          lastName: lastName || '',
          phone: phone || '',
          // Only load credit card in development mode
          creditCard: import.meta.env.DEV ? (creditCard || '') : ''
        }));
      } catch (err) {
        console.error('Failed to load saved customer info:', err);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format phone number
    if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '');
      let formatted = cleaned;
      if (cleaned.length >= 6) {
        formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      } else if (cleaned.length >= 3) {
        formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      }
      setFormData({ ...formData, [name]: formatted });
      return;
    }
    
    // Format credit card
    if (name === 'creditCard') {
      const cleaned = value.replace(/\D/g, '');
      const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
      setFormData({ ...formData, [name]: formatted.slice(0, 19) }); // Max 16 digits + 3 spaces
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Phone number must be 10 digits');
      return false;
    }
    
    const cardDigits = formData.creditCard.replace(/\D/g, '');
    if (cardDigits.length < 13 || cardDigits.length > 16) {
      setError('Credit card number must be 13-16 digits');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCode(null);
    setErrorField(null);
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      await onSubmit(formData);
      
      // Save customer information to sessionStorage for future orders
      const customerInfo = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      };
      
      // Only save credit card in development mode for convenience
      if (import.meta.env.DEV) {
        customerInfo.creditCard = formData.creditCard;
      }
      
      sessionStorage.setItem('customerInfo', JSON.stringify(customerInfo));
      
      // Clear credit card in production mode after order
      if (!import.meta.env.DEV) {
        setFormData(prev => ({
          ...prev,
          creditCard: ''
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to submit order');
      setErrorCode(err.code || null);
      setErrorField(err.field || null);
      
      // Log additional error context in development
      if (import.meta.env.DEV) {
        console.error('Order submission error:', {
          message: err.message,
          code: err.code,
          field: err.field,
          statusCode: err.statusCode
        });
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // Get error icon based on error code
  const getErrorIcon = () => {
    if (!errorCode) return '⚠️';
    
    switch (errorCode) {
      case 'VALIDATION_ERROR':
        return '📝';
      case 'NETWORK_ERROR':
      case 'CONNECTION_ERROR':
        return '🌐';
      case 'DATABASE_UNAVAILABLE':
      case 'SERVICE_BUSY':
        return '🔧';
      case 'TIMEOUT_ERROR':
        return '⏱️';
      case 'DUPLICATE_ORDER':
        return '🔁';
      default:
        return '⚠️';
    }
  };
  
  // Determine if field has error
  const hasFieldError = (fieldName) => {
    return errorField === fieldName;
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">👤</span>
        Customer Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex items-start">
              <span className="text-2xl mr-3 flex-shrink-0">{getErrorIcon()}</span>
              <div className="flex-1">
                <p className="font-semibold text-red-800 mb-1">Order Failed</p>
                <p className="text-sm text-red-700">{error}</p>
                {errorCode && import.meta.env.DEV && (
                  <p className="text-xs text-red-600 mt-2 font-mono">
                    Error Code: {errorCode}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`input-field ${hasFieldError('firstName') ? 'border-red-500 ring-2 ring-red-200' : ''}`}
              placeholder="John"
              required
            />
            {hasFieldError('firstName') && (
              <p className="text-xs text-red-600 mt-1">⚠️ Check this field</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`input-field ${hasFieldError('lastName') ? 'border-red-500 ring-2 ring-red-200' : ''}`}
              placeholder="Doe"
              required
            />
            {hasFieldError('lastName') && (
              <p className="text-xs text-red-600 mt-1">⚠️ Check this field</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`input-field ${hasFieldError('phone') ? 'border-red-500 ring-2 ring-red-200' : ''}`}
            placeholder="(555) 123-4567"
            required
          />
          {hasFieldError('phone') && (
            <p className="text-xs text-red-600 mt-1">⚠️ Check this field</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Credit Card Number
          </label>
          <input
            type="text"
            name="creditCard"
            value={formData.creditCard}
            onChange={handleChange}
            className={`input-field ${hasFieldError('creditCard') ? 'border-red-500 ring-2 ring-red-200' : ''}`}
            placeholder="1234 5678 9012 3456"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            🔒 Secure payment processing
          </p>
          {hasFieldError('creditCard') && (
            <p className="text-xs text-red-600 mt-1">⚠️ Check this field</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full btn-primary text-lg py-3 flex items-center justify-center space-x-2"
        >
          {submitting ? (
            <>
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Place Order</span>
              <span className="font-bold">${(totalPrice * 1.08).toFixed(2)}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

