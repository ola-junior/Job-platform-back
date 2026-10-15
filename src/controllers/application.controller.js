const Application = require('../models/Application');
const Job = require('../models/Job');
const Company = require('../models/Company');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const Notification = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../config/email');
const User = require('../models/User');

// POST /api/jobs/:id/apply
exports.applyToJob = async (req, res, next) => {
  try {
    const { coverLetter, cvUrl, cvFileName } = req.body;
    const jobId = req.params.id;

    const job = await Job.findById(jobId).populate('company', 'name');
    if (!job || job.status !== 'PUBLISHED') {
      return res.status(404).json({ success: false, message: 'Job not available' });
    }

    // Check deadline
    if (job.applicationDeadline && new Date() > new Date(job.applicationDeadline)) {
      return res.status(400).json({ success: false, message: 'Application deadline has passed' });
    }

    // Check for existing application
    const existing = await Application.findOne({ job: jobId, applicant: req.user.id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already applied to this job' });

    // Get CV from profile if not provided
    let cv = { url: cvUrl, fileName: cvFileName };
    if (!cvUrl) {
      const profile = await JobSeekerProfile.findOne({ user: req.user.id });
      if (!profile?.cv?.url) {
        return res.status(400).json({ success: false, message: 'Please upload a CV to your profile first' });
      }
      cv = { url: profile.cv.url, fileName: profile.cv.fileName };
    }

    const application = await Application.create({
      job: jobId,
      applicant: req.user.id,
      employer: job.employer,
      company: job.company._id,
      coverLetter,
      cv,
      statusHistory: [{ status: 'APPLIED', changedAt: new Date() }],
    });

    // Increment application count
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    // Notify employer
    await Notification.create({
      recipient: job.employer,
      type: 'APPLICATION_RECEIVED',
      title: 'New Application',
      message: `${req.user.fullName} applied for ${job.title}`,
      link: `/employer/jobs/${jobId}/applicants`,
      data: { applicationId: application._id, jobId },
    });

    // Send confirmation email to applicant
    const { subject, html } = emailTemplates.applicationReceived(req.user.fullName, job.title, job.company.name);
    sendEmail({ to: req.user.email, subject, html }).catch(console.error);

    await application.populate([
      { path: 'job', select: 'title company', populate: { path: 'company', select: 'name logo' } },
    ]);

    res.status(201).json({ success: true, message: 'Application submitted successfully', data: { application } });
  } catch (error) {
    next(error);
  }
};

// GET /api/applications — job seeker's applications
exports.getMyApplications = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { applicant: req.user.id };
    if (status) filter.status = status;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate({ path: 'job', select: 'title location workMode employmentType salary', populate: { path: 'company', select: 'name logo' } })
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Application.countDocuments(filter),
    ]);

    res.json({ success: true, data: { applications, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (error) {
    next(error);
  }
};

// GET /api/employer/jobs/:jobId/applicants — employer
exports.getJobApplicants = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const filter = { job: req.params.jobId };
    if (status) filter.status = status;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('applicant', 'fullName email avatar phone')
        .populate({ path: 'applicant', select: 'fullName email avatar phone' })
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Application.countDocuments(filter),
    ]);

    // Mark as read
    await Application.updateMany({ job: req.params.jobId, employer: req.user.id, isRead: false }, { isRead: true });

    res.json({ success: true, data: { applications, total, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/applications/:id/status — employer updates status
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('job', 'title')
      .populate('applicant', 'fullName email');

    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    if (application.employer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const validStatuses = ['REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'REJECTED', 'HIRED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    application.status = status;
    application.statusHistory.push({ status, changedAt: new Date(), note });
    if (note) application.employerNote = note;
    await application.save();

    // Notify applicant
    await Notification.create({
      recipient: application.applicant._id,
      type: 'APPLICATION_STATUS',
      title: 'Application Update',
      message: `Your application for ${application.job.title} status changed to ${status}`,
      link: '/applications',
      data: { applicationId: application._id, status },
    });

    // Send email
    const { subject, html } = emailTemplates.applicationStatusUpdate(
      application.applicant.fullName, application.job.title, status
    );
    sendEmail({ to: application.applicant.email, subject, html }).catch(console.error);

    res.json({ success: true, message: 'Application status updated', data: { application } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/applications/:id/withdraw — job seeker withdraws
exports.withdrawApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    if (application.applicant.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (['REJECTED', 'HIRED', 'WITHDRAWN'].includes(application.status)) {
      return res.status(400).json({ success: false, message: 'Cannot withdraw this application' });
    }
    application.status = 'WITHDRAWN';
    application.withdrawnAt = new Date();
    application.withdrawReason = req.body.reason;
    application.statusHistory.push({ status: 'WITHDRAWN', changedAt: new Date() });
    await application.save();
    await Job.findByIdAndUpdate(application.job, { $inc: { applicationCount: -1 } });
    res.json({ success: true, message: 'Application withdrawn', data: { application } });
  } catch (error) {
    next(error);
  }
};
