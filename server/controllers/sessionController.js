// Session Controller for SoulSeer
// Handles session creation, management, logging, and RTC room coordination
const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Start a new session (client requests a reading)
exports.startSession = async (req, res) => {
  try {
    const { reader_id, client_id, rate_per_minute } = req.body;
    const session_id = uuidv4();
    const start_time = new Date();
    await pool.query(
      'INSERT INTO sessions (session_id, reader_id, client_id, start_time, rate_per_minute, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [session_id, reader_id, client_id, start_time, rate_per_minute, 'pending']
    );
    res.status(201).json({ session_id, start_time });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start session', details: err.message });
  }
};

// End a session (called by RTC disconnect or user action)
exports.endSession = async (req, res) => {
  try {
    const { session_id } = req.body;
    const end_time = new Date();
    // Calculate total_minutes and update status
    const { rows } = await pool.query('SELECT start_time, rate_per_minute FROM sessions WHERE session_id = $1', [session_id]);
    if (!rows.length) return res.status(404).json({ error: 'Session not found' });
    const durationMs = end_time - rows[0].start_time;
    const total_minutes = Math.ceil(durationMs / 60000);
    const amount_charged = total_minutes * rows[0].rate_per_minute;
    await pool.query(
      'UPDATE sessions SET end_time = $1, total_minutes = $2, amount_charged = $3, status = $4 WHERE session_id = $5',
      [end_time, total_minutes, amount_charged, 'ended', session_id]
    );
    res.status(200).json({ session_id, end_time, total_minutes, amount_charged });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end session', details: err.message });
  }
};

// Get sessions for a user
exports.getSessions = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { rows } = await pool.query('SELECT * FROM sessions WHERE client_id = $1 OR reader_id = $1 ORDER BY start_time DESC', [user_id]);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions', details: err.message });
  }
};
