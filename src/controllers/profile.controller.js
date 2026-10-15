const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');
const Company = require('../models/Company');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// Compute profile completeness
const computeCompleteness = (profile, user) => {
  const checks = [
    !!user.avatar, !!profile.headline, !!profile.about, !!profile.location,
    profile.skills?.length > 0, profile.education?.length > 0,
    profile.experience?.length > 0, !!profile.cv?.url,
    !!user.phone, !!profile.linkedin || !!profile.github,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

// GET /api/profile — job seeker
exports.getJobSeekerProfile = async (req, res, next) => {
  try {
    const profile = await JobSeekerProfile.findOne({ user: req.user.id })
      .populate('user', 'fullName email phone avatar role isEmailVerified');
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/profile — job seeker update
exports.updateJobSeekerProfile = async (req, res, next) => {
  try {
    const allowedFields = ['headline', 'about', 'location', 'website', 'linkedin', 'github',
      'isOpenToWork', 'preferredJobTypes', 'preferredLocations', 'expectedSalary', 'languages'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user.id },
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'fullName email phone avatar');

    // Update completeness
    const user = await User.findById(req.user.id);
    profile.profileCompleteness = computeCompleteness(profile, user);
    await profile.save();

    res.json({ success: true, message: 'Profile updated', data: { profile } });
  } catch (error) {
    next(error);
  }
};

// Skills, Education, Experience, Certifications, Projects — CRUD operations
const arrayFieldController = (field) => ({
  add: async (req, res, next) => {
    try {
      const profile = await JobSeekerProfile.findOneAndUpdate(
        { user: req.user.id },
        { $push: { [field]: req.body } },
        { new: true, runValidators: true }
      );
      res.json({ success: true, message: `${field} added`, data: { profile } });
    } catch (error) { next(error); }
  },
  update: async (req, res, next) => {
    try {
      const profile = await JobSeekerProfile.findOne({ user: req.user.id });
      const item = profile[field].id(req.params.itemId);
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      Object.assign(item, req.body);
      await profile.save();
      res.json({ success: true, message: `${field} updated`, data: { profile } });
    } catch (error) { next(error); }
  },
  remove: async (req, res, next) => {
    try {
      const profile = await JobSeekerProfile.findOneAndUpdate(
        { user: req.user.id },
        { $pull: { [field]: { _id: req.params.itemId } } },
        { new: true }
      );
      res.json({ success: true, message: `${field} removed`, data: { profile } });
    } catch (error) { next(error); }
  },
});

exports.skills = arrayFieldController('skills');
exports.education = arrayFieldController('education');
exports.experience = arrayFieldController('experience');
exports.certifications = arrayFieldController('certifications');
exports.projects = arrayFieldController('projects');

// POST /api/profile/cv
exports.uploadCV = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const profile = await JobSeekerProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        cv: {
          url: req.file.path,
          publicId: req.file.filename,
          fileName: req.file.originalname,
          uploadedAt: new Date(),
        },
      },
      { new: true }
    );
    res.json({ success: true, message: 'CV uploaded successfully', data: { cv: profile.cv } });
  } catch (error) {
    next(error);
  }
};

// POST /api/profile/avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const user = await User.findById(req.user.id);
    // Delete old avatar from cloudinary
    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId).catch(console.error);
    }
    user.avatar = req.file.path;
    user.avatarPublicId = req.file.filename;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Avatar updated', data: { avatar: user.avatar } });
  } catch (error) {
    next(error);
  }
};

// GET /api/profile/:userId — public profile
exports.getPublicProfile = async (req, res, next) => {
  try {
    const profile = await JobSeekerProfile.findOne({ user: req.params.userId })
      .populate('user', 'fullName email avatar');
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
};
