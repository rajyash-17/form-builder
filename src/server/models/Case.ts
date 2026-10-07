import mongoose, { Schema, Document, Model } from 'mongoose';
import { Clue, CaseSettings } from '@/lib/schemas';

export interface ICase extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'closed';
  clues: Clue[];
  settings: CaseSettings;
  shareId: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClueValidationSchema = new Schema(
  {
    min: { type: Number },
    max: { type: Number },
    pattern: { type: String },
  },
  { _id: false }
);

const ClueConditionalSchema = new Schema(
  {
    fieldId: { type: String, required: true },
    operator: {
      type: String,
      enum: [
        'equals',
        'not_equals',
        'contains',
        'greater_than',
        'less_than',
        'is_empty',
        'is_not_empty',
        'notEquals',
      ],
      required: true,
    },
    value: { type: String, default: '' },
  },
  { _id: false }
);

const ClueSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, required: true },
    helpText: { type: String, default: '' },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    options: { type: [String], default: [] },
    validation: { type: ClueValidationSchema, default: {} },
    pageIndex: { type: Number, default: 0 },
    showIf: { type: ClueConditionalSchema },
  },
  { _id: false }
);

const CaseSettingsSchema = new Schema(
  {
    accentColor: { type: String, default: '#f0b44c' },
    coverBannerUrl: { type: String, default: '' },
    thankYouMessage: {
      type: String,
      default: 'Your testimony has been sworn and recorded in official archives.',
    },
    redirectUrl: { type: String, default: '' },
    responseLimit: { type: Number },
    closeDate: { type: String },
    allowMultipleSubmissions: { type: Boolean, default: true },
    notifyEmailOnTestimony: { type: Boolean, default: false },
    notificationEmail: { type: String, default: '' },
  },
  { _id: false }
);

const CaseSchema = new Schema<ICase>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
      index: true,
    },
    clues: { type: [ClueSchema], default: [] },
    settings: {
      type: CaseSettingsSchema,
      default: () => ({
        accentColor: '#f0b44c',
        thankYouMessage: 'Your testimony has been sworn and recorded in official archives.',
        redirectUrl: '',
        allowMultipleSubmissions: true,
      }),
    },
    shareId: { type: String, required: true, unique: true, index: true },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CaseModel: Model<ICase> =
  mongoose.models.Case || mongoose.model<ICase>('Case', CaseSchema);
