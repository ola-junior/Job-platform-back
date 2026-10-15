const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const auditLog = require('../middleware/auditLog');
const ctrl = require('../controllers/admin.controller');

router.use(protect, authorize('ADMIN'));

router.get('/stats', ctrl.getStats);
router.get('/users', ctrl.getUsers);
router.patch('/users/:id/toggle-status', auditLog('ADMIN_TOGGLE_USER_STATUS', 'User'), ctrl.toggleUserStatus);
router.get('/jobs', ctrl.getJobs);
router.patch('/jobs/:id', auditLog('ADMIN_UPDATE_JOB', 'Job'), ctrl.updateJobStatus);
router.get('/applications', ctrl.getApplications);
router.get('/reports', ctrl.getReports);
router.patch('/reports/:id', auditLog('ADMIN_RESOLVE_REPORT', 'Report'), ctrl.resolveReport);
router.get('/categories', ctrl.getCategories);
router.post('/categories', auditLog('ADMIN_CREATE_CATEGORY', 'Category'), ctrl.createCategory);
router.delete('/categories/:id', auditLog('ADMIN_DELETE_CATEGORY', 'Category'), ctrl.deleteCategory);
router.get('/audit-logs', ctrl.getAuditLogs);

module.exports = router;
