const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/application.controller');

router.get('/', protect, authorize('JOB_SEEKER'), ctrl.getMyApplications);
router.get('/employer/jobs/:jobId/applicants', protect, authorize('EMPLOYER'), ctrl.getJobApplicants);
router.patch('/:id/status', protect, authorize('EMPLOYER'), ctrl.updateApplicationStatus);
router.patch('/:id/withdraw', protect, authorize('JOB_SEEKER'), ctrl.withdrawApplication);

module.exports = router;
