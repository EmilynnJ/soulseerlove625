// Session Routes for SoulSeer
const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

// Start a new session
router.post('/start', protect, sessionController.startSession);
// End a session
router.post('/end', protect, sessionController.endSession);
// Get sessions for a user
router.get('/user/:user_id', protect, sessionController.getSessions);

module.exports = router;
