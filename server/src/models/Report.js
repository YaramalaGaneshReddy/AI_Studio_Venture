import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    agentKey: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    format: { type: String, default: 'markdown' }
  },
  { timestamps: true }
);

reportSchema.index({ title: 'text', content: 'text' });

export const Report = mongoose.model('Report', reportSchema);
