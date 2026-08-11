import mongoose from 'mongoose';
import { agentDefinitions } from '../agents/agentDefinitions.js';

const agentRunSchema = new mongoose.Schema(
  {
    key: String,
    name: String,
    outputFile: String,
    dependencies: { type: [String], default: [] },
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed', 'awaiting_approval'], default: 'pending' },
    output: { type: String, default: '' },
    runtimeMs: { type: Number, default: 0 },
    waitingMs: { type: Number, default: 0 },
    tokenUsage: { type: Number, default: 0 },
    error: String,
    retryCount: { type: Number, default: 0 },
    startedAt: Date,
    completedAt: Date,
    approvedAt: Date
  },
  { _id: false }
);

const startupScoreSchema = new mongoose.Schema(
  {
    marketDemand: { type: Number, default: 0 },
    competition: { type: Number, default: 0 },
    revenuePotential: { type: Number, default: 0 },
    technicalFeasibility: { type: Number, default: 0 },
    executionComplexity: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startupName: { type: String, required: true },
    idea: { type: String, required: true },
    industry: { type: String, required: true },
    targetUsers: { type: String, required: true },
    country: { type: String, required: true },
    budget: { type: String, required: true },
    timeline: { type: String, required: true },
    status: { type: String, enum: ['pending', 'running', 'awaiting_approval', 'completed', 'failed'], default: 'pending' },
    agentRuns: { type: [agentRunSchema], default: () => agentDefinitions.map((agent) => ({ ...agent, status: 'pending', output: '' })) },
    startupScore: { type: startupScoreSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export const Project = mongoose.model('Project', projectSchema);
