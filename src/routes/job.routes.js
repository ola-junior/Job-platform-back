const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/optionalAuth');
const ctrl = require('../controllers/job.controller');

router.get('/', optionalAuth, ctrl.getJobs);
router.get('/featured', ctrl.getFeaturedJobs);
router.get('/saved', protect, authorize('JOB_SEEKER'), ctrl.getSavedJobs);
router.get('/employer/my-jobs', protect, authorize('EMPLOYER'), ctrl.getMyJobs);
router.get('/:id', optionalAuth, ctrl.getJob);
router.post('/', protect, authorize('EMPLOYER'), ctrl.createJob);
router.patch('/:id', protect, authorize('EMPLOYER', 'ADMIN'), ctrl.updateJob);
router.delete('/:id', protect, authorize('EMPLOYER', 'ADMIN'), ctrl.deleteJob);
router.post('/:id/save', protect, authorize('JOB_SEEKER'), ctrl.saveJob);
router.post('/:id/apply', protect, authorize('JOB_SEEKER'), require('../controllers/application.controller').applyToJob);

module.exports = router;
