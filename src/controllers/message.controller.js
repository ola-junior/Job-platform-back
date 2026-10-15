const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate('participants', 'fullName avatar role')
      .populate('lastMessage')
      .sort('-lastMessageAt');
    res.json({ success: true, data: { conversations } });
  } catch (error) { next(error); }
};

exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { recipientId, jobId } = req.body;
    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ success: false, message: 'User not found' });

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId] },
      ...(jobId ? { job: jobId } : {}),
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, recipientId],
        job: jobId,
        unreadCount: { [recipientId]: 0, [req.user.id]: 0 },
      });
    }

    await conversation.populate('participants', 'fullName avatar role');
    res.json({ success: true, data: { conversation } });
  } catch (error) { next(error); }
};

exports.getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'fullName avatar')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Mark messages from other participants as read
    await Message.updateMany(
      { conversation: req.params.id, sender: { $ne: req.user.id }, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, data: { messages: messages.reverse() } });
  } catch (error) { next(error); }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
    if (!conversation.participants.map(p => p.toString()).includes(req.user.id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      content,
    });

    // Update conversation last message
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    // Increment unread for other participants
    conversation.participants.forEach(p => {
      if (p.toString() !== req.user.id.toString()) {
        const currentCount = conversation.unreadCount.get(p.toString()) || 0;
        conversation.unreadCount.set(p.toString(), currentCount + 1);
      }
    });
    await conversation.save();

    await message.populate('sender', 'fullName avatar');

    // Notify recipient
    const recipient = conversation.participants.find(p => p.toString() !== req.user.id.toString());
    if (recipient) {
      await Notification.create({
        recipient,
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: `${req.user.fullName}: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`,
        link: `/messages`,
      });
    }

    res.status(201).json({ success: true, data: { message } });
  } catch (error) { next(error); }
};
