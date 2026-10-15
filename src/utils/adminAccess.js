const ADMIN_EMAILS = new Set([
  'yxngalhaji02@gmail.com',
  'abdullahakinkunmi26@gmail.com',
]);

exports.isAllowedAdminEmail = (email) =>
  ADMIN_EMAILS.has(String(email || '').trim().toLowerCase());