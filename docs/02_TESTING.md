# Testing Guide

## 🎯 Overview

A comprehensive unit test suite for the Sushi RAG App covering both backend API validation and frontend error handling with **69 total tests**. The tests ensure robust error handling, proper validation, and a smooth user experience.

---

## 📊 Test Coverage Summary

### Backend Tests: 30 tests ✅
**File**: `backend/routes/__tests__/orders.test.js`  
**Framework**: Jest + Supertest

| Category | Tests | Description |
|----------|-------|-------------|
| ✅ Success Cases | 4 | Valid order submissions |
| ❌ Required Fields | 5 | Missing field validation |
| ❌ Format Errors | 4 | Phone/card format validation |
| ❌ Item Errors | 6 | Cart item validation |
| 🔧 Database Errors | 8 | PostgreSQL error handling |
| 🎲 Edge Cases | 3 | Boundary conditions |

### Frontend Tests: 39 tests ✅
**Files**: 
- `frontend/src/__tests__/App.test.jsx` (12 tests)
- `frontend/src/components/__tests__/OrderForm.test.jsx` (27 tests)

**Framework**: Vitest + React Testing Library

| Category | Tests | Description |
|----------|-------|-------------|
| ✅ Success Cases | 4 | Successful submissions |
| 📝 Validation | 8 | Form field validation |
| 🎨 UI/UX | 5 | Error display and highlighting |
| 💾 Session Storage | 4 | Data persistence |
| 🔄 State Management | 2 | Loading/disabled states |
| 🏷️ Error Categorization | 16 | Error code handling |

### Test Distribution

```
Success Cases:     8 tests  (11.6%)
Validation Tests: 42 tests  (60.9%)
Edge Cases:       19 tests  (27.5%)
```

---

## 🚀 Running Tests

### Quick Start

```bash
# Install test dependencies (if not already installed)
cd backend && npm install
cd ../frontend && npm install

# Run all tests (from root directory)
npm test

# Run with coverage
npm run test:coverage
```

### Individual Test Suites

```bash
# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend

# MCP (Python) tests — creates `mcp/.venv` with Python 3.11/3.12 when needed
npm run test:mcp

# Watch mode (auto-rerun on changes)
npm run test:watch
```

### MCP server (`mcp/`)

- **Runner**: Pytest + `pytest-asyncio` (see `mcp/requirements-dev.txt`).
- **Layout**:
  - `mcp/constraints.py` — constraint parsing/filtering (shared with `server.py`).
  - `mcp/tests/test_constraints.py` — pure unit tests (no Chroma).
  - `mcp/tests/test_server_helpers.py` — `_format_docs`, `_handle_error`, `_format_sources`.
  - `mcp/tests/test_tools.py` — async tools with a **mocked** vector store (no Docker).
- **Manual run**: `bash scripts/test-mcp.sh` or `cd mcp && .venv/bin/python -m pytest tests/` after `pip install -r requirements-dev.txt`.

### From Individual Directories

**Backend:**
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Frontend:**
```bash
cd frontend

# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

---

## 📁 Files Created

### Test Files

```
backend/routes/__tests__/
└── orders.test.js                      # 30 backend API tests

frontend/src/__tests__/
└── App.test.jsx                        # 12 error handling tests

frontend/src/components/__tests__/
└── OrderForm.test.jsx                  # 27 component tests

frontend/src/test/
└── setup.js                            # Vitest configuration
```

### Configuration Files

```
backend/package.json                    # Updated with Jest config
frontend/package.json                   # Updated with Vitest
frontend/vitest.config.js               # Vitest setup
package.json (root)                     # Test runner scripts
```

---

## 🧪 Backend Test Suite

### File: `backend/routes/__tests__/orders.test.js`

#### Test Categories

##### 1. Success Cases (4 tests)
Tests that verify successful order creation with valid data:

- ✅ Create order with valid data
- ✅ Accept 13-digit credit card (AMEX)
- ✅ Accept 16-digit credit card (Visa/MC)
- ✅ Handle multiple items with varying quantities (1-9)

**Example:**
```javascript
test('should create order with valid data', async () => {
  const validOrder = {
    firstName: 'John',
    lastName: 'Doe',
    phone: '(555) 123-4567',
    creditCard: '4111 1111 1111 1111',
    items: [
      { name: 'Salmon Nigiri', price: 12.99, quantity: 2 }
    ],
    totalPrice: 25.98
  };

  const response = await request(app)
    .post('/api/orders')
    .send(validOrder);

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
});
```

##### 2. Validation Failures - Required Fields (5 tests)
Tests that verify proper error messages for missing required fields:

- ❌ Missing first name → "First name is required"
- ❌ Missing last name → "Last name is required"
- ❌ Missing phone → "Phone number is required"
- ❌ Missing credit card → "Credit card number is required"
- ❌ Empty cart → "Your cart is empty. Please add items before placing an order."

##### 3. Validation Failures - Format Errors (4 tests)
Tests that verify format validation:

- ❌ Phone < 10 digits → "Phone number must be 10 digits"
- ❌ Phone > 10 digits → "Phone number must be 10 digits"
- ❌ Credit card < 13 digits → "Credit card number must be 13-16 digits"
- ❌ Credit card > 16 digits → "Credit card number must be 13-16 digits"

##### 4. Validation Failures - Item Errors (6 tests)
Tests that verify item-level validation:

- ❌ Item without name → "Item #1 is missing a name"
- ❌ Item with invalid price → "Item 'Salmon' has an invalid price"
- ❌ Item with negative price → "Item 'Tuna' has an invalid price"
- ❌ Item quantity < 1 → "Item 'Salmon' quantity must be between 1 and 9"
- ❌ Item quantity > 9 → "Item 'Salmon' quantity must be between 1 and 9"
- ❌ Item with invalid quantity type → "Item 'Salmon' has an invalid quantity"

##### 5. Database Error Handling (8 tests)
Tests that verify proper handling of database errors:

- 🔧 **Duplicate order (23505)** → 409: "This order has already been processed"
- 🔧 **Foreign key violation (23503)** → 400: "Items no longer available"
- 🔧 **Not null violation (23502)** → 400: "Missing required information"
- 🔧 **Connection refused (ECONNREFUSED)** → 503: "Unable to connect to database"
- 🔧 **Timeout** → 504: "Order processing is taking too long"
- 🔧 **High traffic (53300)** → 503: "System experiencing high traffic"
- 🔧 **Generic database error** → 500: "Unable to process your order"

**Before:**
```json
{ "error": "Failed to create order" }
```

**After:**
```json
{
  "error": "Phone number must be 10 digits",
  "code": "VALIDATION_ERROR",
  "field": "phone"
}
```

##### 6. Edge Cases (3 tests)
Tests that verify handling of edge cases:

- ❌ Invalid total price (negative)
- ❌ Invalid total price (string)
- ❌ Items as non-array

**Total Backend Tests: 30**

---

## 🎨 Frontend Test Suite

### File: `frontend/src/__tests__/App.test.jsx`

#### Test Categories

##### 1. Success Cases (1 test)
- ✅ Successfully submit order and return data

##### 2. Error Response Parsing (7 tests)
Tests that verify proper extraction of error information:

- 📝 Extract error message from backend response
- 🌐 Handle network error (no response)
- 📝 Handle validation error with field info
- 🔧 Handle database unavailable error
- 🔁 Handle duplicate order error
- ⏱️ Handle timeout error
- 🔧 Handle high traffic error

##### 3. Error Object Structure (2 tests)
- Verify error has all required properties (message, code, field, statusCode)
- Handle error without field information

##### 4. Generic Error Handling (2 tests)
- Provide fallback message for unknown errors
- Handle empty error response

**Total App Tests: 12**

---

### File: `frontend/src/components/__tests__/OrderForm.test.jsx`

#### Test Categories

##### 1. Rendering (2 tests)
- ✅ Render all form fields
- ✅ Display total price with tax

##### 2. Form Validation - Success Cases (3 tests)
- ✅ Submit form with valid data
- ✅ Format phone number during input → `(555) 123-4567`
- ✅ Format credit card during input → `4111 1111 1111 1111`

##### 3. Form Validation - Failure Cases (5 tests)
- ❌ Empty first name
- ❌ Empty last name
- ❌ Invalid phone (too short)
- ❌ Invalid credit card (too short)
- ❌ Invalid credit card (too long)

##### 4. Error Display and UI (5 tests)
- 📋 Display backend error message
- 🎨 Highlight field with error (red border)
- 📝 Show correct icon for validation error
- 🌐 Show network error with appropriate icon
- 🔄 Clear error on new submission attempt

**Example:**
```javascript
test('should highlight field with error', async () => {
  const error = new Error('First name is required');
  error.code = 'VALIDATION_ERROR';
  error.field = 'firstName';
  mockOnSubmit.mockRejectedValueOnce(error);

  render(<OrderForm {...defaultProps} />);

  // Submit form
  await userEvent.click(screen.getByRole('button', { name: /place order/i }));

  await waitFor(() => {
    const firstNameInput = screen.getByLabelText(/first name/i);
    expect(firstNameInput).toHaveClass('border-red-500');
  });
});
```

##### 5. Session Storage - Development Mode (4 tests)
- 💾 Load customer data from session storage on mount
- 💾 Save customer data to session storage on success
- 🚫 Don't save data if submission fails
- 🛡️ Handle corrupted session storage data

Tests verify:
- ✅ Customer data saved on success
- ❌ Data NOT saved on failure
- 🔒 Credit card only saved in DEV mode
- 🛡️ Graceful handling of corrupted data

##### 6. Form Submission State (2 tests)
- ⏳ Show loading state during submission
- 🔒 Disable button during submission

##### 7. Error Code Categorization (6 tests)
Tests that verify correct icon display for each error type:
- 📝 VALIDATION_ERROR → 📝 icon
- 🌐 NETWORK_ERROR → 🌐 icon
- 🔧 DATABASE_UNAVAILABLE → 🔧 icon
- ⏱️ TIMEOUT_ERROR → ⏱️ icon
- 🔁 DUPLICATE_ORDER → 🔁 icon
- ⚠️ Generic error → ⚠️ icon

**Total OrderForm Tests: 27**

---

## 🎨 Error Icon System

Each error type displays a unique icon for better UX:

| Error Code | Icon | Description |
|------------|------|-------------|
| `VALIDATION_ERROR` | 📝 | Form validation issues |
| `NETWORK_ERROR` | 🌐 | Connection problems |
| `DATABASE_UNAVAILABLE` | 🔧 | Database connectivity |
| `SERVICE_BUSY` | 🔧 | High traffic/capacity |
| `TIMEOUT_ERROR` | ⏱️ | Request timeout |
| `DUPLICATE_ORDER` | 🔁 | Order already exists |
| Generic | ⚠️ | Unknown errors |

---

## 📋 Error Code Reference

### Backend Error Codes

| Code | HTTP Status | Message | Icon |
|------|-------------|---------|------|
| `VALIDATION_ERROR` | 400 | Field-specific validation message | 📝 |
| `DUPLICATE_ORDER` | 409 | "Order already processed" | 🔁 |
| `INVALID_ITEM` | 400 | "Items no longer available" | 📝 |
| `MISSING_DATA` | 400 | "Missing required information" | 📝 |
| `INVALID_FORMAT` | 400 | "Invalid data format" | 📝 |
| `DATABASE_UNAVAILABLE` | 503 | "Unable to connect to database" | 🔧 |
| `SERVICE_BUSY` | 503 | "System experiencing high traffic" | 🔧 |
| `TIMEOUT_ERROR` | 504 | "Order processing taking too long" | ⏱️ |
| `CONNECTION_ERROR` | 503 | "Database connection failed" | 🌐 |
| `ORDER_FAILED` | 500 | "Unable to process your order" | ⚠️ |
| `NETWORK_ERROR` | N/A | "Unable to reach the server" | 🌐 |

---

## 📈 Test Statistics

### Coverage by Component

| Component | Tests | Success | Failure | Edge Cases |
|-----------|-------|---------|---------|------------|
| Order API | 30 | 4 | 23 | 3 |
| App.jsx | 12 | 1 | 9 | 2 |
| OrderForm | 27 | 3 | 10 | 14 |
| **Total** | **69** | **8** | **42** | **19** |

### Quality Metrics

- **Backend Coverage**: Order validation, database errors, PostgreSQL error codes
- **Frontend Coverage**: Error display, field highlighting, session storage, loading states
- **Integration**: Tests verify backend error responses match frontend expectations
- **Security**: Credit card storage only in DEV mode validated

---

## 🔧 Technologies Used

### Backend Testing
- **Jest**: Testing framework
- **Supertest**: HTTP assertion library
- **Mock**: Database connection mocking

### Frontend Testing
- **Vitest**: Fast unit test framework
- **React Testing Library**: Component testing
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM environment simulation

---

## ✍️ Writing New Tests

### Backend Test Example

```javascript
test('should reject order with invalid data', async () => {
  const invalidOrder = {
    firstName: '',
    lastName: 'Doe',
    phone: '5551234567',
    creditCard: '4111111111111111',
    items: [{ name: 'Salmon', price: 12.99, quantity: 1 }],
    totalPrice: 12.99
  };

  const response = await request(app)
    .post('/api/orders')
    .send(invalidOrder);

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('First name is required');
  expect(response.body.field).toBe('firstName');
  expect(response.body.code).toBe('VALIDATION_ERROR');
});
```

### Frontend Test Example

```javascript
test('should display error message', async () => {
  const error = new Error('Phone number invalid');
  error.code = 'VALIDATION_ERROR';
  mockOnSubmit.mockRejectedValueOnce(error);

  render(<OrderForm {...props} />);

  // Fill form and submit
  await userEvent.click(screen.getByRole('button', { name: /place order/i }));

  await waitFor(() => {
    expect(screen.getByText(/phone number invalid/i)).toBeInTheDocument();
  });
});
```

---

## 🎯 Testing Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use clear, descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

### 2. Mocking
- Mock external dependencies (database, API calls)
- Clear mocks between tests using `beforeEach`
- Use realistic mock data

### 3. Assertions
- Test both success and failure paths
- Verify error messages and codes
- Check UI state changes

### 4. Coverage Goals
- Aim for >80% code coverage
- Focus on critical paths (validation, error handling)
- Test edge cases and boundary conditions

### 5. User-Centric Testing
- Frontend tests simulate real user interactions
- Test what users see and do, not implementation details
- Verify accessibility and UX

### Best Practices Demonstrated

1. ✅ **Clear Test Names**: Descriptive test descriptions
2. ✅ **AAA Pattern**: Arrange, Act, Assert structure
3. ✅ **Mock External Dependencies**: Database and API calls
4. ✅ **Test Edge Cases**: Boundary values and error conditions
5. ✅ **User-Centric**: Frontend tests simulate real user interactions
6. ✅ **Error Message Validation**: Verify exact error text
7. ✅ **HTTP Status Codes**: Verify correct status for each error
8. ✅ **Cleanup**: Reset state between tests

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install backend dependencies
        run: cd backend && npm install
      
      - name: Run backend tests
        run: cd backend && npm test
      
      - name: Install frontend dependencies
        run: cd frontend && npm install
      
      - name: Run frontend tests
        run: cd frontend && npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

Tests are fully configured for CI/CD pipelines:

```yaml
# Example commands
- name: Run Backend Tests
  run: cd backend && npm test

- name: Run Frontend Tests
  run: cd frontend && npm test

- name: Generate Coverage
  run: npm run test:coverage
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors
**Solution**: Make sure dependencies are installed:
```bash
cd backend && npm install
cd frontend && npm install
```

#### 2. "port already in use" in tests
**Solution**: Tests use mocked server, ensure no other tests are running

#### 3. Frontend tests fail with "document is not defined"
**Solution**: Check `vitest.config.js` has `environment: 'jsdom'`

#### 4. Database mock not working
**Solution**: Verify jest mock is at top of test file:
```javascript
jest.mock('../../config/database.js');
```

#### 5. Tests hang or timeout
**Solution**: Check for unresolved promises or missing `await` statements

---

## 📚 Next Steps

### Recommended Additions

1. **Integration Tests**: Test full order flow end-to-end
2. **E2E Tests**: Use Playwright or Cypress for browser automation
3. **Performance Tests**: Measure API response times with k6 or Artillery
4. **Load Tests**: Test concurrent order submissions
5. **Snapshot Tests**: Capture component rendering states
6. **Visual Regression Tests**: Screenshot comparison
7. **API Contract Tests**: Ensure API consistency

### Coverage Improvements

- Add tests for menu service
- Test AI assistant error handling
- Add cart manipulation tests
- Test order success component
- Test session storage edge cases
- Add accessibility tests

### Coverage Goals

**Current**: Unit tests for validation and error handling  
**Target**: Add integration and E2E tests for 90%+ coverage

---

## 🎓 Learning Resources

The test suite demonstrates:
- ✅ RESTful API testing patterns
- ✅ React component testing
- ✅ Error handling best practices
- ✅ Mock strategy for external dependencies
- ✅ User interaction testing
- ✅ Async operation testing

### Documentation Links

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest](https://github.com/visionmedia/supertest)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)

---

## 🏆 Success Criteria Met

- [x] **69 comprehensive tests** covering success and failure cases
- [x] **Backend validation** for all fields and formats
- [x] **Database error handling** for 8 different scenarios
- [x] **Frontend error display** with field highlighting
- [x] **Session storage** behavior verification
- [x] **Error categorization** with appropriate UI feedback
- [x] **Documentation** with examples and best practices
- [x] **CI/CD ready** with npm scripts

---

## 💬 Support

For questions or issues with tests:
1. Check this documentation
2. Review existing test examples
3. Run tests with `--verbose` flag for more details
4. Check console logs for specific error messages

---

**All tests passing! Ready for production deployment. ✅**

**Perfect for portfolios and interviews! 🚀**
