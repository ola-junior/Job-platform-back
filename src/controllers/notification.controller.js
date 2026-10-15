const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { recipient: req.user.id };
    if (unreadOnly === 'true') filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user.id, isRead: false }),
    ]);

    res.json({ success: true, data: { notifications, unreadCount, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};

exports.markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true }
    );
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) { next(error); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { next(error); }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) { next(error); }
};
