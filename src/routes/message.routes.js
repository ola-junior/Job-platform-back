const router = require('express').Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/message.controller');

router.get('/', protect, ctrl.getConversations);
router.post('/conversations', protect, ctrl.getOrCreateConversation);
router.get('/:id/messages', protect, ctrl.getMessages);
router.post('/:id/messages', protect, ctrl.sendMessage);

module.exports = router;
