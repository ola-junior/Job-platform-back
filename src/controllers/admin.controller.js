const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Company = require('../models/Company');
const Report = require('../models/Report');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');

exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers, totalSeekers, totalEmployers,
      totalJobs, activeJobs, totalApplications,
      jobsThisMonth, appsThisMonth,
      pendingReports,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'ADMIN' } }),
      User.countDocuments({ role: 'JOB_SEEKER' }),
      User.countDocuments({ role: 'EMPLOYER' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'PUBLISHED' }),
      Application.countDocuments(),
      Job.countDocuments({ createdAt: { $gte: monthStart } }),
      Application.countDocuments({ createdAt: { $gte: monthStart } }),
      Report.countDocuments({ status: 'PENDING' }),
    ]);

    // Monthly growth data (last 6 months)
    const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        stats: { totalUsers, totalSeekers, totalEmployers, totalJobs, activeJobs, totalApplications, jobsThisMonth, appsThisMonth, pendingReports },
        userGrowth,
      },
    });
  } catch (error) { next(error); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'suspended') filter.isActive = false;
    if (search) filter.$or = [{ fullName: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: { users, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'ADMIN') return res.status(403).json({ success: false, message: 'Cannot modify admin accounts' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'suspended'}`, data: { user } });
  } catch (error) { next(error); }
};

exports.getJobs = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('company', 'name logo')
        .populate('employer', 'fullName email')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Job.countDocuments(filter),
    ]);
    res.json({ success: true, data: { jobs, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};

exports.getApplications = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const filter = {};
    const validStatuses = ['APPLIED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN', 'HIRED'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid application status' });
    }
    if (status) filter.status = status;
    if (search?.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const [applicantIds, jobIds] = await Promise.all([
        User.find({ $or: [{ fullName: { $regex: escapedSearch, $options: 'i' } }, { email: { $regex: escapedSearch, $options: 'i' } }] }).distinct('_id'),
        Job.find({ title: { $regex: escapedSearch, $options: 'i' } }).distinct('_id'),
      ]);
      filter.$or = [{ applicant: { $in: applicantIds } }, { job: { $in: jobIds } }];
    }

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('applicant', 'fullName email')
        .populate('job', 'title location employmentType')
        .populate('company', 'name')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit),
      Application.countDocuments(filter),
    ]);

    res.json({ success: true, data: { applications, pagination: { total, page, pages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};

exports.updateJobStatus = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { status: req.body.status, isFeatured: req.body.isFeatured }, { new: true });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, message: 'Job updated', data: { job } });
  } catch (error) { next(error); }
};

exports.getReports = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'fullName email')
        .populate('targetJob', 'title')
        .populate('targetUser', 'fullName email')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Report.countDocuments(filter),
    ]);
    res.json({ success: true, data: { reports, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};

exports.resolveReport = async (req, res, next) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, adminNote: req.body.adminNote, resolvedBy: req.user.id, resolvedAt: new Date() },
      { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, message: 'Report resolved', data: { report } });
  } catch (error) { next(error); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort('name');
    res.json({ success: true, data: { categories } });
  } catch (error) { next(error); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, message: 'Category created', data: { category } });
  } catch (error) { next(error); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) { next(error); }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const [logs, total] = await Promise.all([
      AuditLog.find().populate('actor', 'fullName role').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
      AuditLog.countDocuments(),
    ]);
    res.json({ success: true, data: { logs, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
};
