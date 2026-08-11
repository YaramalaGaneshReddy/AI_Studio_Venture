import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const users = new Map();
const projects = new Map();

// Helper to create admin if first user
let isFirstUser = true;

export function registerMemoryUser({ name, email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  if (Array.from(users.values()).some((u) => u.email === normalizedEmail)) {
    const error = new Error('Email already registered');
    error.status = 409;
    throw error;
  }

  const role = isFirstUser ? 'admin' : 'user';
  isFirstUser = false;

  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = { _id: id, id, name: name || email.split('@')[0], email: normalizedEmail, passwordHash, role, createdAt: new Date() };

  users.set(id, user);
  return authPayload(user);
}

export function loginMemoryUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = Array.from(users.values()).find((u) => u.email === normalizedEmail);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  return authPayload(user);
}

export function authPayload(user) {
  const token = jwt.sign({ sub: user.id || user._id, role: user.role }, process.env.JWT_SECRET || 'development-secret', { expiresIn: '7d' });
  return { token, user: { id: user.id || user._id, _id: user.id || user._id, name: user.name, email: user.email, role: user.role } };
}

export function getMemoryUsers() {
  return Array.from(users.values()).map(({ passwordHash, ...u }) => u);
}

export function updateMemoryUserRole(id, role) {
  const user = users.get(id);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  user.role = role;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function deleteMemoryUser(id) {
  users.delete(id);
  for (const [projId, proj] of projects.entries()) {
    if (proj.user === id) projects.delete(projId);
  }
}

export function getMemoryProjects() {
  return Array.from(projects.values());
}

export function createMemoryProject(data) {
  const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const agentDefinitions = [
    { key: 'market_research', name: 'Market Research Agent', outputFile: 'market_report.md' },
    { key: 'competitor_analysis', name: 'Competitor Analysis Agent', outputFile: 'competitor_report.md' },
    { key: 'opportunity_discovery', name: 'Opportunity Discovery Agent', outputFile: 'opportunity_report.md' },
    { key: 'product_strategy', name: 'Product Strategy Agent', outputFile: 'product_strategy.md' },
    { key: 'prd', name: 'PRD Agent', outputFile: 'prd.md' },
    { key: 'technical_architect', name: 'Technical Architect Agent', outputFile: 'architecture.md' },
    { key: 'revenue_model', name: 'Revenue Model Agent', outputFile: 'revenue_model.md' },
    { key: 'financial_forecast', name: 'Financial Forecast Agent', outputFile: 'financials.md' },
    { key: 'gtm', name: 'GTM Agent', outputFile: 'gtm.md' },
    { key: 'investor', name: 'Investor Agent', outputFile: 'investor_report.md' },
    { key: 'pitch_deck', name: 'Pitch Deck Agent', outputFile: 'pitch_deck.md' }
  ];

  const agentRuns = agentDefinitions.map((agent) => ({
    key: agent.key,
    name: agent.name,
    outputFile: agent.outputFile,
    dependencies: agent.dependencies || [],
    status: 'pending',
    output: '',
    approved: false,
    runtimeMs: 0,
    waitingMs: 0,
    tokenUsage: 0,
    error: '',
    retryCount: 0
  }));

  const project = {
    _id: id,
    id,
    user: data.user,
    startupName: data.startupName,
    idea: data.idea,
    industry: data.industry,
    targetUsers: data.targetUsers,
    country: data.country,
    budget: data.budget,
    timeline: data.timeline,
    status: 'active',
    agentRuns,
    startupScore: {
      marketDemand: 75,
      competition: 70,
      revenuePotential: 80,
      technicalFeasibility: 85,
      executionComplexity: 65,
      overall: 75
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  projects.set(id, project);
  return project;
}
