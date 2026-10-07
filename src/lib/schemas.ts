import { z } from 'zod';

export const signupSchema = z.object({
  agentName: z.string().min(2, 'Detective name / badge identifier required (at least 2 characters)'),
  email: z.string().email('Valid detective badge email required'),
  password: z.string().min(8, 'Passcode must be at least 8 characters long'),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email('Valid detective badge email required'),
  password: z.string().min(8, 'Passcode must be at least 8 characters long'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const clueTypeEnum = z.enum([
  'shortText',
  'longText',
  'email',
  'number',
  'phone',
  'url',
  'date',
  'time',
  'dropdown',
  'multipleChoice',
  'checkboxes',
  'rating',
  'linearScale',
  'yesNo',
  'fileUpload',
  'statement',
  'pageBreak',
]);

export type ClueType = z.infer<typeof clueTypeEnum>;

export const clueValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
});

export type ClueValidation = z.infer<typeof clueValidationSchema>;

export const clueConditionalOperatorEnum = z.enum([
  'equals',
  'not_equals',
  'contains',
  'greater_than',
  'less_than',
  'is_empty',
  'is_not_empty',
  // Backward compatibility aliases
  'notEquals',
]);

export type ClueConditionalOperator = z.infer<typeof clueConditionalOperatorEnum>;

export const clueConditionalSchema = z.object({
  fieldId: z.string(),
  operator: clueConditionalOperatorEnum,
  value: z.string().optional().default(''),
});

export type ClueConditional = z.infer<typeof clueConditionalSchema>;

export const clueSchema = z.object({
  id: z.string(),
  type: clueTypeEnum,
  label: z.string().min(1, 'Clue label is required'),
  helpText: z.string().optional().default(''),
  required: z.boolean().default(false),
  placeholder: z.string().optional().default(''),
  options: z.array(z.string()).optional().default([]),
  validation: clueValidationSchema.optional(),
  pageIndex: z.number().default(0),
  showIf: clueConditionalSchema.optional(),
});

export type Clue = z.infer<typeof clueSchema>;

export const caseSettingsSchema = z.object({
  accentColor: z.string().default('#f0b44c'),
  coverBannerUrl: z.string().optional().default(''),
  thankYouMessage: z.string().default('Your testimony has been sworn and recorded in official archives.'),
  redirectUrl: z.string().optional().default(''),
  responseLimit: z.number().optional(),
  closeDate: z.string().optional(),
  allowMultipleSubmissions: z.boolean().default(true),
  notifyEmailOnTestimony: z.boolean().default(false),
  notificationEmail: z.string().optional().default(''),
});

export type CaseSettings = z.infer<typeof caseSettingsSchema>;

export const caseStatusEnum = z.enum(['draft', 'published', 'closed']);
export type CaseStatus = z.infer<typeof caseStatusEnum>;

export const createCaseSchema = z.object({
  title: z.string().min(1, 'Case title is required'),
  description: z.string().optional().default(''),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;

export const updateCaseSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Case title is required'),
  description: z.string().optional().default(''),
  status: caseStatusEnum,
  clues: z.array(clueSchema),
  settings: caseSettingsSchema,
});

export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;

export const updateCaseStatusSchema = z.object({
  id: z.string(),
  status: caseStatusEnum,
});

export type UpdateCaseStatusInput = z.infer<typeof updateCaseStatusSchema>;

export const caseFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['draft', 'published', 'closed', 'all']).optional().default('all'),
});

export type CaseFilterInput = z.infer<typeof caseFilterSchema>;
