const Company = require('../models/Company');
const Job = require('../models/Job');
const { cloudinary } = require('../config/cloudinary');

// GET /api/companies
exports.getCompanies = async (req, res, next) => {
  try {
    const { q, industry, size, page = 1, limit = 20 } = req.query;
    const filter = { isSuspended: false };
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (industry) filter.industry = industry;
    if (size) filter.size = size;

    const [companies, total] = await Promise.all([
      Company.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)).lean(),
      Company.countDocuments(filter),
    ]);

    // Attach job counts
    const companyIds = companies.map(c => c._id);
    const jobCounts = await Job.aggregate([
      { $match: { company: { $in: companyIds }, status: 'PUBLISHED' } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
    ]);
    const jobCountMap = Object.fromEntries(jobCounts.map(j => [j._id.toString(), j.count]));
    const enriched = companies.map(c => ({ ...c, openJobCount: jobCountMap[c._id.toString()] || 0 }));

    res.json({ success: true, data: { companies: enriched, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};

// GET /api/companies/:id
exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).populate('owner', 'fullName avatar');
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    const jobs = await Job.find({ company: company._id, status: 'PUBLISHED' }).sort('-createdAt').limit(10);
    res.json({ success: true, data: { company, jobs } });
  } catch (error) { next(error); }
};

// PATCH /api/companies/:id
exports.updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    if (company.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const allowedFields = ['name', 'email', 'phone', 'website', 'linkedin', 'twitter',
      'description', 'industry', 'size', 'founded', 'headquarters', 'locations', 'specialties'];
    allowedFields.forEach(f => { if (req.body[f] !== undefined) company[f] = req.body[f]; });
    await company.save();
    res.json({ success: true, message: 'Company updated', data: { company } });
  } catch (error) { next(error); }
};

// POST /api/companies/:id/logo
exports.uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const company = await Company.findOne({ owner: req.user.id });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    if (company.logo?.publicId) await cloudinary.uploader.destroy(company.logo.publicId).catch(console.error);
    company.logo = { url: req.file.path, publicId: req.file.filename };
    await company.save();
    res.json({ success: true, message: 'Logo uploaded', data: { logo: company.logo } });
  } catch (error) { next(error); }
};

// GET /api/employer/company
exports.getMyCompany = async (req, res, next) => {
  try {
    const company = await Company.findOne({ owner: req.user.id });
    if (!company) return res.status(404).json({ success: false, message: 'No company found' });
    res.json({ success: true, data: { company } });
  } catch (error) { next(error); }
};
