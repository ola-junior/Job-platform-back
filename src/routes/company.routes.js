const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');
const ctrl = require('../controllers/company.controller');

router.get('/', ctrl.getCompanies);
router.get('/my-company', protect, authorize('EMPLOYER'), ctrl.getMyCompany);
router.get('/:id', ctrl.getCompany);
router.patch('/:id', protect, authorize('EMPLOYER', 'ADMIN'), ctrl.updateCompany);
router.post('/logo', protect, authorize('EMPLOYER'), uploadImage.single('logo'), ctrl.uploadLogo);

module.exports = router;
