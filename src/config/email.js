require('dotenv').config();
const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 587);
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('SMTP_USER and SMTP_PASSWORD must be configured with Gmail credentials.');
  }

  return transporter.sendMail({
    from: `${process.env.FROM_NAME || 'JobPlatform'} <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
  });
};

const baseTemplate = (content, previewText = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>JobPlatform</title>
  <style>
    body { margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
    table { border-collapse:collapse; }
    a { color:#2563eb; }
    .btn { display:inline-block; background:#2563eb; color:#ffffff !important; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:15px; font-weight:600; }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#2563eb;border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">💼 JobPlatform</h1>
            <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Your Career, Elevated.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;color:#64748b;font-size:12px;">This email was sent by <strong>JobPlatform</strong>. If you did not create an account, you can safely ignore this email.</p>
            <p style="margin:0;color:#94a3b8;font-size:11px;">© ${new Date().getFullYear()} JobPlatform. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const divider = `<hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />`;

const infoRow = (label, value) => `
  <tr>
    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;"><span style="color:#64748b;font-size:13px;">${label}</span></td>
    <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;"><span style="color:#0f172a;font-size:13px;font-weight:600;">${value}</span></td>
  </tr>`;

const emailTemplates = {

  verifyEmail: (name, url) => ({
    subject: 'Verify your email address — JobPlatform',
    html: baseTemplate(`
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">Welcome aboard, ${name}! 🎉</h2>
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
        Thank you for joining <strong>JobPlatform</strong>. Please verify your email address to activate your account.
      </p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:24px;margin-bottom:28px;text-align:center;">
        <p style="margin:0 0 16px;color:#1e40af;font-size:14px;font-weight:500;">Click the button below to verify your email</p>
        <a href="${url}" class="btn">✅ Verify My Email</a>
        <p style="margin:16px 0 0;color:#64748b;font-size:12px;">This link expires in <strong>24 hours</strong></p>
      </div>
      <p style="margin:0 0 8px;color:#64748b;font-size:13px;">If the button doesn't work, copy and paste this link:</p>
      <p style="margin:0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;font-size:12px;color:#2563eb;word-break:break-all;">${url}</p>
      ${divider}
      <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">Didn't create an account? Just ignore this email.</p>
    `, `Hi ${name}, please verify your email to activate your account.`),
  }),

  resetPassword: (name, url) => ({
    subject: 'Reset your password — JobPlatform',
    html: baseTemplate(`
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background:#fef3c7;border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;">🔐</div>
      </div>
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;text-align:center;">Password Reset Request</h2>
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;text-align:center;">
        Hi <strong>${name}</strong>, click the button below to create a new password.
      </p>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${url}" class="btn">🔑 Reset My Password</a>
        <p style="margin:16px 0 0;color:#64748b;font-size:12px;">This link expires in <strong>1 hour</strong></p>
      </div>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;">⚠️ <strong>Security notice:</strong> If you did not request this, please ignore this email.</p>
      </div>
      <p style="margin:0 0 8px;color:#64748b;font-size:13px;">If the button doesn't work, copy and paste this link:</p>
      <p style="margin:0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;font-size:12px;color:#2563eb;word-break:break-all;">${url}</p>
    `, 'You requested a password reset. Click to create a new password.'),
  }),

  applicationReceived: (seekerName, jobTitle, company) => ({
    subject: `Application confirmed — ${jobTitle} at ${company}`,
    html: baseTemplate(`
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background:#dcfce7;border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;">✅</div>
      </div>
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;text-align:center;">Application Submitted!</h2>
      <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.7;text-align:center;">
        Hi <strong>${seekerName}</strong>, your application has been successfully received.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Position', jobTitle)}
          ${infoRow('Company', company)}
          ${infoRow('Status', '<span style="color:#16a34a;background:#dcfce7;padding:2px 10px;border-radius:20px;font-size:12px;">Under Review</span>')}
          ${infoRow('Submitted', new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))}
        </table>
      </div>
      <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
        <p style="margin:0;color:#1e40af;font-size:14px;line-height:1.6;">💡 <strong>What happens next?</strong> The employer will review your application and reach out if your profile matches their requirements.</p>
      </div>
      <div style="text-align:center;">
        <a href="${process.env.CLIENT_URL}/applications" class="btn">View My Applications</a>
      </div>
    `, `Your application for ${jobTitle} at ${company} has been submitted.`),
  }),

  applicationStatusUpdate: (seekerName, jobTitle, company, status) => {
    const statusConfig = {
      REVIEWING:   { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', emoji: '👀', label: 'Under Review',    message: "The employer is currently reviewing your application. We'll keep you posted." },
      SHORTLISTED: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', emoji: '⭐', label: 'Shortlisted',     message: "Congratulations! You've been shortlisted. The employer may reach out to schedule an interview soon." },
      INTERVIEW:   { color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', emoji: '🎯', label: 'Interview Stage', message: "Excellent news! You've been selected for an interview. Check your messages for further details." },
      OFFERED:     { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', emoji: '🎉', label: 'Offer Extended',  message: "Congratulations! You've received a job offer. Log in to review the details and respond." },
      REJECTED:    { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', emoji: '📋', label: 'Not Selected',    message: "Thank you for your interest. Unfortunately, the employer has decided to move forward with other candidates. Keep applying!" },
      WITHDRAWN:   { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', emoji: '↩️', label: 'Withdrawn',       message: 'Your application has been withdrawn as requested.' },
    };
    const cfg = statusConfig[status] || statusConfig['REVIEWING'];
    return {
      subject: `Application update: ${cfg.label} — ${jobTitle}`,
      html: baseTemplate(`
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-block;background:${cfg.bg};border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;">${cfg.emoji}</div>
        </div>
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;text-align:center;">Application Update</h2>
        <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.7;text-align:center;">Hi <strong>${seekerName}</strong>, there's an update on your application.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${infoRow('Position', jobTitle)}
            ${infoRow('Company', company)}
            ${infoRow('New Status', `<span style="color:${cfg.color};background:${cfg.bg};padding:2px 10px;border-radius:20px;font-size:12px;border:1px solid ${cfg.border};">${cfg.label}</span>`)}
          </table>
        </div>
        <div style="background:${cfg.bg};border:1px solid ${cfg.border};border-radius:10px;padding:16px 20px;margin-bottom:28px;">
          <p style="margin:0;color:${cfg.color};font-size:14px;line-height:1.6;">${cfg.message}</p>
        </div>
        <div style="text-align:center;">
          <a href="${process.env.CLIENT_URL}/applications" class="btn">View Application</a>
        </div>
      `, `Your application for ${jobTitle} at ${company} has been updated to: ${cfg.label}`),
    };
  },

  welcomeEmployer: (name, companyName) => ({
    subject: 'Welcome to JobPlatform — Start hiring today',
    html: baseTemplate(`
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">Welcome, ${name}! 🚀</h2>
      <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
        Your employer account for <strong>${companyName}</strong> is all set. Post jobs and connect with top talent.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:28px;">
        <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:600;">Get started in 3 easy steps:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:8px 0;color:#475569;font-size:13px;">1️⃣ &nbsp; Complete your company profile</td></tr>
          <tr><td style="padding:8px 0;color:#475569;font-size:13px;">2️⃣ &nbsp; Post your first job listing</td></tr>
          <tr><td style="padding:8px 0;color:#475569;font-size:13px;">3️⃣ &nbsp; Review and connect with applicants</td></tr>
        </table>
      </div>
      <div style="text-align:center;">
        <a href="${process.env.CLIENT_URL}/employer/dashboard" class="btn">Go to Dashboard</a>
      </div>
    `, `Hi ${name}, your employer account is ready.`),
  }),
};

module.exports = { sendEmail, emailTemplates };
