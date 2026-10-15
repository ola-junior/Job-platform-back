require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Company = require('../models/Company');
const Job = require('../models/Job');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');

const CATEGORIES = [
  { name: 'Technology', icon: '💻', description: 'Software, IT, and tech roles' },
  { name: 'Design', icon: '🎨', description: 'UI/UX, graphic, and product design' },
  { name: 'Marketing', icon: '📢', description: 'Digital marketing and growth' },
  { name: 'Finance', icon: '💰', description: 'Finance, accounting, and banking' },
  { name: 'Healthcare', icon: '🏥', description: 'Medical and healthcare roles' },
  { name: 'Education', icon: '📚', description: 'Teaching and training roles' },
  { name: 'Sales', icon: '🤝', description: 'Sales, BD, and account management' },
  { name: 'Operations', icon: '⚙️', description: 'Operations, logistics, and supply chain' },
  { name: 'Legal', icon: '⚖️', description: 'Legal, compliance, and regulatory' },
  { name: 'Human Resources', icon: '👥', description: 'HR, recruitment, and people ops' },
  { name: 'Customer Service', icon: '🎧', description: 'Support and customer success' },
  { name: 'Engineering', icon: '🔧', description: 'Civil, mechanical, and other engineering' },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobplatform');
  console.log('Connected to database');

  // Categories
  for (const cat of CATEGORIES) {
    await Category.findOneAndUpdate({ name: cat.name }, cat, { upsert: true, new: true });
  }
  console.log('✅ Categories seeded');

  // Job Seeker
  const seekerPass = await bcrypt.hash('Seeker@123', 12);
  const seeker = await User.findOneAndUpdate(
    { email: 'seeker@test.com' },
    { fullName: 'Jane Smith', email: 'seeker@test.com', password: seekerPass, role: 'JOB_SEEKER', isEmailVerified: true, isActive: true },
    { upsert: true, new: true }
  );
  await JobSeekerProfile.findOneAndUpdate(
    { user: seeker._id },
    { user: seeker._id, headline: 'Senior Frontend Developer', about: 'Passionate about building great UIs', location: 'Lagos, Nigeria', skills: [{ name: 'React', level: 'EXPERT' }, { name: 'TypeScript', level: 'ADVANCED' }] },
    { upsert: true }
  );
  console.log('✅ Job Seeker: seeker@test.com / Seeker@123');

  // Employer + Company + Jobs
  const empPass = await bcrypt.hash('Employer@123', 12);
  const employer = await User.findOneAndUpdate(
    { email: 'employer@testco.com' },
    { fullName: 'John Employer', email: 'employer@testco.com', password: empPass, role: 'EMPLOYER', isEmailVerified: true, isActive: true },
    { upsert: true, new: true }
  );
  const company = await Company.findOneAndUpdate(
    { owner: employer._id },
    { owner: employer._id, name: 'TechCorp Nigeria', email: 'hr@techcorp.ng', website: 'https://techcorp.ng', description: 'Leading tech company in Nigeria', industry: 'Technology', size: '51-200', headquarters: 'Lagos, Nigeria', isVerified: true },
    { upsert: true, new: true }
  );
  await EmployerProfile.findOneAndUpdate(
    { user: employer._id },
    { user: employer._id, company: company._id, jobTitle: 'HR Manager' },
    { upsert: true }
  );

  // Sample jobs
  const jobData = [
    { title: 'Senior React Developer', description: 'We are looking for a passionate React developer to join our team and build world-class web applications.', responsibilities: ['Build reusable components', 'Optimize performance', 'Code reviews', 'Mentor junior developers'], requirements: ['5+ years React experience', 'TypeScript proficiency', 'REST API integration'], skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'], location: 'Lagos, Nigeria', workMode: 'HYBRID', employmentType: 'FULL_TIME', experienceLevel: 'SENIOR', salary: { min: 800000, max: 1500000, currency: 'NGN', period: 'MONTHLY' }, status: 'PUBLISHED', isFeatured: true, categoryName: 'Technology' },
    { title: 'UI/UX Designer', description: 'Join our design team to create beautiful and functional user interfaces for our growing suite of products.', responsibilities: ['Create wireframes and prototypes', 'Conduct user research', 'Collaborate with developers'], requirements: ['3+ years UX design', 'Figma expertise', 'Portfolio required'], skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'], location: 'Remote', workMode: 'REMOTE', employmentType: 'FULL_TIME', experienceLevel: 'MID', salary: { min: 500000, max: 900000, currency: 'NGN', period: 'MONTHLY' }, status: 'PUBLISHED', isFeatured: true, categoryName: 'Design' },
    { title: 'Backend Engineer (Node.js)', description: 'Build and maintain scalable backend services for our platform handling millions of requests daily.', responsibilities: ['Design RESTful APIs', 'Database optimization', 'Implement security best practices'], requirements: ['4+ years Node.js', 'MongoDB/PostgreSQL', 'Microservices experience'], skills: ['Node.js', 'Express', 'MongoDB', 'Docker', 'AWS'], location: 'Abuja, Nigeria', workMode: 'ON_SITE', employmentType: 'FULL_TIME', experienceLevel: 'SENIOR', salary: { min: 700000, max: 1200000, currency: 'NGN', period: 'MONTHLY' }, status: 'PUBLISHED', categoryName: 'Technology' },
    { title: 'Digital Marketing Manager', description: 'Lead our digital marketing efforts and drive growth across all digital channels.', responsibilities: ['Manage SEO/SEM campaigns', 'Social media strategy', 'Email marketing', 'Analytics reporting'], requirements: ['5+ years digital marketing', 'Google Analytics certified', 'Team leadership experience'], skills: ['SEO', 'SEM', 'Social Media', 'Email Marketing', 'Analytics'], location: 'Lagos, Nigeria', workMode: 'HYBRID', employmentType: 'FULL_TIME', experienceLevel: 'SENIOR', salary: { min: 400000, max: 700000, currency: 'NGN', period: 'MONTHLY' }, status: 'PUBLISHED', categoryName: 'Marketing' },
    { title: 'Product Manager', description: 'Drive product strategy and work cross-functionally with engineering, design, and business teams.', responsibilities: ['Define product roadmap', 'Gather requirements', 'Stakeholder communication', 'Sprint planning'], requirements: ['4+ years PM experience', 'Technical background preferred', 'Strong communication skills'], skills: ['Product Strategy', 'Agile', 'Jira', 'Data Analysis', 'Roadmapping'], location: 'Lagos, Nigeria', workMode: 'HYBRID', employmentType: 'FULL_TIME', experienceLevel: 'SENIOR', salary: { min: 900000, max: 1600000, currency: 'NGN', period: 'MONTHLY' }, status: 'PUBLISHED', isFeatured: true, categoryName: 'Technology' },
    { title: 'Junior Frontend Developer (Internship)', description: 'Great opportunity for fresh graduates to kickstart their career in frontend development.', responsibilities: ['Build UI components', 'Fix bugs', 'Write tests', 'Learn from senior developers'], requirements: ['React basics', 'HTML/CSS/JavaScript', 'Eagerness to learn'], skills: ['HTML', 'CSS', 'JavaScript', 'React'], location: 'Remote', workMode: 'REMOTE', employmentType: 'INTERNSHIP', experienceLevel: 'ENTRY', salary: { min: 80000, max: 150000, currency: 'NGN', period: 'MONTHLY' }, status: 'PUBLISHED', categoryName: 'Technology' },
  ];

  for (const job of jobData) {
    await Job.findOneAndUpdate(
      { title: job.title, employer: employer._id },
      { ...job, employer: employer._id, company: company._id },
      { upsert: true, new: true }
    );
  }
  console.log('✅ Sample jobs seeded');
  console.log('✅ Employer: employer@testco.com / Employer@123\n');
  console.log('🎉 Database seeded successfully!');
  await mongoose.disconnect();
};

seed().catch(console.error);
