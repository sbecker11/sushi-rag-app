import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Helper function to log performance metrics if enabled
const logPerformance = (message) => {
  if (process.env.ENABLE_PERFORMANCE_LOGGING === 'true') {
    console.log(message);
  }
};

/**
 * GET /api/orders
 * Get all orders with their items
 */
router.get('/', async (req, res) => {
  try {
    // Fetch all orders with timing
    const ordersStart = Date.now();
    const ordersResult = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    logPerformance(`⏱️  PostgreSQL: Fetch all orders - ${Date.now() - ordersStart}ms`);
    
    // Get items for each order
    const itemsStart = Date.now();
    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [order.id]
        );
        return {
          ...order,
          items: itemsResult.rows
        };
      })
    );
    logPerformance(`⏱️  PostgreSQL: Fetch items for ${ordersResult.rows.length} orders - ${Date.now() - itemsStart}ms`);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * GET /api/orders/:id
 * Get a specific order with its items
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch specific order with timing
    const orderStart = Date.now();
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
    logPerformance(`⏱️  PostgreSQL: Fetch order by ID - ${Date.now() - orderStart}ms`);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Fetch order items with timing
    const itemsStart = Date.now();
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );
    logPerformance(`⏱️  PostgreSQL: Fetch order items - ${Date.now() - itemsStart}ms`);
    
    const order = {
      ...orderResult.rows[0],
      items: itemsResult.rows
    };
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * POST /api/orders
 * Create a new order with items
 */
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { firstName, lastName, phone, creditCard, items, totalPrice } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !phone || !creditCard || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate items
    for (const item of items) {
      if (!item.name || !item.price || !item.quantity) {
        return res.status(400).json({ error: 'Invalid item data' });
      }
      if (item.quantity < 1 || item.quantity > 9) {
        return res.status(400).json({ error: 'Item quantity must be between 1 and 9' });
      }
    }
    
    // Start transaction timing
    const transactionStart = Date.now();
    
    // BEGIN transaction
    const beginStart = Date.now();
    await client.query('BEGIN');
    logPerformance(`⏱️  PostgreSQL: BEGIN transaction - ${Date.now() - beginStart}ms`);
    
    // Insert order
    const insertOrderStart = Date.now();
    const orderResult = await client.query(
      `INSERT INTO orders (first_name, last_name, phone, credit_card, total_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [firstName, lastName, phone, creditCard, totalPrice]
    );
    logPerformance(`⏱️  PostgreSQL: INSERT order - ${Date.now() - insertOrderStart}ms`);
    
    const order = orderResult.rows[0];
    
    // Insert order items
    const insertItemsStart = Date.now();
    const itemPromises = items.map(item => {
      const subtotal = item.price * item.quantity;
      return client.query(
        `INSERT INTO order_items (order_id, item_name, item_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [order.id, item.name, item.price, item.quantity, subtotal]
      );
    });
    
    const itemResults = await Promise.all(itemPromises);
    const orderItems = itemResults.map(result => result.rows[0]);
    logPerformance(`⏱️  PostgreSQL: INSERT ${items.length} order items - ${Date.now() - insertItemsStart}ms`);
    
    // COMMIT transaction
    const commitStart = Date.now();
    await client.query('COMMIT');
    logPerformance(`⏱️  PostgreSQL: COMMIT transaction - ${Date.now() - commitStart}ms`);
    
    logPerformance(`⏱️  PostgreSQL: Total transaction time - ${Date.now() - transactionStart}ms`);
    
    res.status(201).json({
      ...order,
      items: orderItems
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

export default router;

