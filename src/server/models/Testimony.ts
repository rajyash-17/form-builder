import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITestimony extends Document {
  _id: mongoose.Types.ObjectId;
  caseId: mongoose.Types.ObjectId;
  answers: Record<string, unknown>;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonySchema = new Schema<ITestimony>(
  {
    caseId: { type: Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    answers: { type: Schema.Types.Mixed, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const TestimonyModel: Model<ITestimony> =
  mongoose.models.Testimony || mongoose.model<ITestimony>('Testimony', TestimonySchema);
