import express from 'express';
import { getMenuFromLLM, STATIC_MENU } from '../services/menuService.js';

const router = express.Router();

/**
 * GET /api/menu
 * Get menu items from LLM agent
 * Query params:
 *   - type: 'live' (default) or 'static'
 */
router.get('/', async (req, res) => {
  try {
    const menuType = req.query.type || 'live';
    
    if (menuType === 'static') {
      console.log('📋 Serving static fallback menu');
      res.json(STATIC_MENU);
    } else {
      const menuItems = await getMenuFromLLM();
      res.json(menuItems);
    }
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

export default router;

