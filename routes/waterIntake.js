const express = require('express');
const router = express.Router();
const supabase = require('../dbConnection');
const { authenticateToken } = require('../middleware/authenticateToken');
const normalizeId = require('../utils/normalizeId');

function resolveWaterIntakeUserId(req) {
  const requestUserId = req.query.user_id || req.body?.user_id;
  const currentUserId = req.user?.userId;
  const role = String(req.user?.role || '').toLowerCase();

  if ((role === 'admin' || role === 'nutritionist') && requestUserId) {
    return normalizeId(requestUserId);
  }

  return currentUserId;
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = resolveWaterIntakeUserId(req);
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = resolveWaterIntakeUserId(req);
    const { amount_ml, date } = req.body;

    const { data, error } = await supabase
      .from('water_intake')
      .insert([{ user_id: userId, amount_ml, date: date || new Date().toISOString().split('T')[0] }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
