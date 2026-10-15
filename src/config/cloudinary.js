require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for profile pictures and logos
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'jobplatform/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
  }),
});

// Storage for CVs/resumes
const cvStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'jobplatform/cvs',
    resource_type: 'auto',
  }),
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files allowed'), false);
  },
});

const uploadCV = multer({
  storage: cvStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only PDF and Word documents allowed'), false);
  },
});

module.exports = { cloudinary, uploadImage, uploadCV };
