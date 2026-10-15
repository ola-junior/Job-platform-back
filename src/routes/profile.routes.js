const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadImage, uploadCV } = require('../config/cloudinary');
const ctrl = require('../controllers/profile.controller');

router.get('/', protect, authorize('JOB_SEEKER'), ctrl.getJobSeekerProfile);
router.patch('/', protect, authorize('JOB_SEEKER'), ctrl.updateJobSeekerProfile);
router.get('/:userId/public', ctrl.getPublicProfile);

router.post('/avatar', protect, uploadImage.single('avatar'), ctrl.uploadAvatar);
router.post('/cv', protect, authorize('JOB_SEEKER'), uploadCV.single('cv'), ctrl.uploadCV);

// Array field routes
router.post('/skills', protect, authorize('JOB_SEEKER'), ctrl.skills.add);
router.patch('/skills/:itemId', protect, authorize('JOB_SEEKER'), ctrl.skills.update);
router.delete('/skills/:itemId', protect, authorize('JOB_SEEKER'), ctrl.skills.remove);

router.post('/education', protect, authorize('JOB_SEEKER'), ctrl.education.add);
router.patch('/education/:itemId', protect, authorize('JOB_SEEKER'), ctrl.education.update);
router.delete('/education/:itemId', protect, authorize('JOB_SEEKER'), ctrl.education.remove);

router.post('/experience', protect, authorize('JOB_SEEKER'), ctrl.experience.add);
router.patch('/experience/:itemId', protect, authorize('JOB_SEEKER'), ctrl.experience.update);
router.delete('/experience/:itemId', protect, authorize('JOB_SEEKER'), ctrl.experience.remove);

router.post('/certifications', protect, authorize('JOB_SEEKER'), ctrl.certifications.add);
router.patch('/certifications/:itemId', protect, authorize('JOB_SEEKER'), ctrl.certifications.update);
router.delete('/certifications/:itemId', protect, authorize('JOB_SEEKER'), ctrl.certifications.remove);

router.post('/projects', protect, authorize('JOB_SEEKER'), ctrl.projects.add);
router.patch('/projects/:itemId', protect, authorize('JOB_SEEKER'), ctrl.projects.update);
router.delete('/projects/:itemId', protect, authorize('JOB_SEEKER'), ctrl.projects.remove);

module.exports = router;
