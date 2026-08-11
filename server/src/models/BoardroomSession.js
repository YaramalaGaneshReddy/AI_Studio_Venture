import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const boardroomSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    question: { type: String, required: true },
    messages: [messageSchema],
    consensus: String
  },
  { timestamps: true }
);

export const BoardroomSession = mongoose.model('BoardroomSession', boardroomSessionSchema);
