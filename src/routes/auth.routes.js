const router = require('express').Router();
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');

const registerRules = [
  body('fullName').trim().notEmpty().withMessage('Full name required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('role').isIn(['JOB_SEEKER', 'EMPLOYER']).withMessage('Role must be JOB_SEEKER or EMPLOYER'),
];

router.post('/register', registerRules, validate, ctrl.register);
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validate,
], ctrl.login);
router.post('/refresh', ctrl.refreshToken);
router.get('/me', protect, ctrl.getMe);
router.get('/verify/:token', ctrl.verifyEmail);
router.post('/forgot-password', [body('email').isEmail(), validate], ctrl.forgotPassword);
router.post('/resend-verification', [body('email').isEmail(), validate], ctrl.resendVerification);
router.post('/reset-password/:token', [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
], ctrl.resetPassword);
router.put('/change-password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  validate,
], ctrl.changePassword);

module.exports = router;
