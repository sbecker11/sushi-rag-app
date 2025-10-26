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

  // Load saved customer information from sessionStorage on mount
  useEffect(() => {
    const savedCustomer = sessionStorage.getItem('customerInfo');
    if (savedCustomer) {
      try {
        const { firstName, lastName, phone } = JSON.parse(savedCustomer);
        setFormData(prev => ({
          ...prev,
          firstName: firstName || '',
          lastName: lastName || '',
          phone: phone || ''
          // Note: Credit card is intentionally NOT saved for security
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
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      await onSubmit(formData);
      
      // Save customer information to sessionStorage for future orders
      // (excluding credit card for security)
      const customerInfo = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      };
      sessionStorage.setItem('customerInfo', JSON.stringify(customerInfo));
      
      // Clear the form, keeping saved info for next order
      setFormData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        creditCard: '' // Always clear credit card
      });
    } catch (err) {
      setError(err.message || 'Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">👤</span>
        Customer Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
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
              className="input-field"
              placeholder="John"
              required
            />
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
              className="input-field"
              placeholder="Doe"
              required
            />
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
            className="input-field"
            placeholder="(555) 123-4567"
            required
          />
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
            className="input-field"
            placeholder="1234 5678 9012 3456"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            🔒 Secure payment processing
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

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

