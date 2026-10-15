const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const SavedJob = require('../models/SavedJob');

// GET /api/jobs — public, with search & filters
exports.getJobs = async (req, res, next) => {
  try {
    const {
      q, location, category, workMode, employmentType,
      experienceLevel, salaryMin, salaryMax, datePosted,
      page = 1, limit = 20, sort = '-createdAt',
    } = req.query;

    const filter = { status: 'PUBLISHED' };

    if (q) filter.$text = { $search: q };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (category) filter.categoryName = { $regex: category, $options: 'i' };
    if (workMode) filter.workMode = workMode;
    if (employmentType) filter.employmentType = employmentType;
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (salaryMin) filter['salary.min'] = { $gte: Number(salaryMin) };
    if (salaryMax) filter['salary.max'] = { $lte: Number(salaryMax) };
    if (datePosted) {
      const days = { '24h': 1, '7d': 7, '30d': 30 }[datePosted];
      if (days) filter.createdAt = { $gte: new Date(Date.now() - days * 86400000) };
    }

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .populate('company', 'name logo industry headquarters')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // If user is authenticated, mark saved jobs
    let savedJobIds = new Set();
    if (req.user) {
      const saved = await SavedJob.find({ user: req.user.id }).select('job');
      savedJobIds = new Set(saved.map(s => s.job.toString()));
    }

    const enriched = jobs.map(j => ({ ...j, isSaved: savedJobIds.has(j._id.toString()) }));

    res.json({
      success: true,
      data: {
        jobs: enriched,
        pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/:id
exports.getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name logo description industry headquarters website size')
      .populate('employer', 'fullName avatar');

    if (!job || job.status === 'DRAFT') {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Increment view count
    await Job.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    let isSaved = false;
    let hasApplied = false;
    if (req.user) {
      const [saved, applied] = await Promise.all([
        SavedJob.findOne({ user: req.user.id, job: job._id }),
        Application.findOne({ applicant: req.user.id, job: job._id }),
      ]);
      isSaved = !!saved;
      hasApplied = !!applied;
    }

    res.json({ success: true, data: { job: { ...job.toObject(), isSaved, hasApplied } } });
  } catch (error) {
    next(error);
  }
};

// POST /api/jobs — employer only
exports.createJob = async (req, res, next) => {
  try {
    const company = await Company.findOne({ owner: req.user.id });
    if (!company) return res.status(400).json({ success: false, message: 'Create a company profile first' });

    const job = await Job.create({
      ...req.body,
      employer: req.user.id,
      company: company._id,
    });

    res.status(201).json({ success: true, message: 'Job created successfully', data: { job } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/jobs/:id
exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.employer.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Job updated', data: { job: updated } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/jobs/:id
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.employer.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/employer/my-jobs
exports.getMyJobs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { employer: req.user.id };
    if (status) filter.status = status;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('company', 'name logo')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Job.countDocuments(filter),
    ]);

    res.json({ success: true, data: { jobs, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (error) {
    next(error);
  }
};

// POST /api/jobs/:id/save
exports.saveJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const existing = await SavedJob.findOne({ user: req.user.id, job: job._id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, message: 'Job unsaved', data: { isSaved: false } });
    }

    await SavedJob.create({ user: req.user.id, job: job._id });
    res.json({ success: true, message: 'Job saved', data: { isSaved: true } });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/saved
exports.getSavedJobs = async (req, res, next) => {
  try {
    const saved = await SavedJob.find({ user: req.user.id })
      .populate({ path: 'job', populate: { path: 'company', select: 'name logo' } })
      .sort('-createdAt');
    const jobs = saved.filter(s => s.job).map(s => ({ ...s.job.toObject(), savedAt: s.createdAt }));
    res.json({ success: true, data: { jobs } });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/featured
exports.getFeaturedJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ status: 'PUBLISHED', isFeatured: true })
      .populate('company', 'name logo industry')
      .sort('-createdAt')
      .limit(6);
    res.json({ success: true, data: { jobs } });
  } catch (error) {
    next(error);
  }
};
