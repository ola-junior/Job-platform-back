const AuditLog = require('../models/AuditLog');

const auditLog = (action, resource) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    AuditLog.create({
      actor: req.user?._id,
      actorRole: req.user?.role,
      action,
      resource,
      resourceId: req.params?.id,
      details: { method: req.method, path: req.path, body: req.body },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      success: data?.success !== false,
    }).catch(() => {}); // Non-blocking
    return originalJson(data);
  };
  next();
};

module.exports = auditLog;
