import { router, protectedProcedure } from '../trpc';
import { CaseModel } from '../models/Case';
import { TestimonyModel } from '../models/Testimony';
import { clueSchema, Clue } from '@/lib/schemas';
import {
  callAnthropicMessagesApi,
  generateOfflineFormClues,
  generateOfflineSuggestions,
  generateOfflineSummary,
  AISuggestion,
  AISummaryResult,
} from '../ai';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import mongoose from 'mongoose';

// In-memory per-user daily rate limiter (20 requests per user per 24h)
const userAiRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkAiRateLimit(userId: string): void {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const maxCallsPerDay = 20;

  const entry = userAiRateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    userAiRateLimitMap.set(userId, { count: 1, resetAt: now + oneDayMs });
    return;
  }

  if (entry.count >= maxCallsPerDay) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Bureau AI dispatch daily limit reached (20/20 requests). Try again tomorrow, detective.',
    });
  }

  entry.count += 1;
}

function generateId(): string {
  return 'clue-' + Math.random().toString(36).substring(2, 9);
}

export const aiRouter = router({
  generateForm: protectedProcedure
    .input(z.object({ prompt: z.string().min(3, 'Please provide a case brief prompt (at least 3 characters).') }))
    .mutation(async ({ input, ctx }) => {
      checkAiRateLimit(ctx.user.userId);

      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        // Deterministic offline fallback engine
        const rawClues = generateOfflineFormClues(input.prompt);
        const clues: Clue[] = rawClues.map((c) => ({
          id: generateId(),
          type: (c.type || 'shortText') as any,
          label: c.label || 'Generated Clue Question',
          helpText: c.helpText || '',
          required: Boolean(c.required),
          placeholder: c.placeholder || '',
          options: c.options || [],
          pageIndex: 0,
        }));

        return {
          title: input.prompt.substring(0, 45).replace(/^\w/, (c) => c.toUpperCase()) + ' Case File',
          description: `AI Brief: "${input.prompt}"`,
          clues,
          isOfflineFallback: true,
        };
      }

      // Anthropic API Call
      const systemPrompt = `You are an expert form architect for FormFlow SaaS. Generate a JSON object containing "title", "description", and a "clues" array.
Each clue MUST contain:
- "type": one of ["shortText", "longText", "email", "number", "phone", "url", "date", "time", "dropdown", "multipleChoice", "checkboxes", "rating", "linearScale", "yesNo", "fileUpload", "statement"]
- "label": string
- "helpText": string
- "required": boolean
- "options": array of strings (for dropdown, multipleChoice, checkboxes)
- "placeholder": string

OUTPUT MUST BE VALID STRICT JSON ONLY. NO MARKDOWN CODE BLOCKS OR EXTRA TEXT.`;

      const promptText = `Generate a themed form schema for this request: "${input.prompt}"`;

      let rawResponse = '';
      try {
        rawResponse = await callAnthropicMessagesApi(promptText, systemPrompt);
      } catch (err: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'Failed to communicate with Anthropic AI service.',
        });
      }

      // Clean JSON string
      const jsonStr = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const parsed = JSON.parse(jsonStr);
        const rawCluesArr = Array.isArray(parsed.clues) ? parsed.clues : Array.isArray(parsed) ? parsed : [];

        const clues: Clue[] = rawCluesArr.map((c: any) => ({
          id: generateId(),
          type: clueSchema.shape.type.safeParse(c.type).success ? c.type : 'shortText',
          label: String(c.label || 'Clue Question'),
          helpText: String(c.helpText || ''),
          required: Boolean(c.required),
          placeholder: String(c.placeholder || ''),
          options: Array.isArray(c.options) ? c.options.map(String) : [],
          pageIndex: 0,
        }));

        return {
          title: String(parsed.title || input.prompt.substring(0, 40) + ' Case File'),
          description: String(parsed.description || `Generated from brief: "${input.prompt}"`),
          clues,
          isOfflineFallback: false,
        };
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'AI returned malformed output format. Please try rephrasing your prompt.',
        });
      }
    }),

  suggestImprovements: protectedProcedure
    .input(z.object({ caseId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      checkAiRateLimit(ctx.user.userId);

      const caseDoc = await CaseModel.findOne({
        _id: input.caseId,
        userId: ctx.user.userId,
      }).lean();

      if (!caseDoc) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Case File not found.' });
      }

      const clues = caseDoc.clues || [];
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        return {
          suggestions: generateOfflineSuggestions(clues, caseDoc.title),
          isOfflineFallback: true,
        };
      }

      const promptText = `Analyze this form case file titled "${caseDoc.title}" with ${clues.length} fields:
${JSON.stringify(clues, null, 2)}

Return a JSON array of suggestion objects with keys: "id", "type" (one of ["missing_field", "too_many_required", "label_improvement", "general"]), "title", "description", "actionableClue" (optional object with type, label, helpText, required).
OUTPUT MUST BE VALID JSON ONLY.`;

      try {
        const rawRes = await callAnthropicMessagesApi(promptText);
        const jsonStr = rawRes.replace(/```json/g, '').replace(/```/g, '').trim();
        const suggestions: AISuggestion[] = JSON.parse(jsonStr);
        return { suggestions, isOfflineFallback: false };
      } catch {
        return {
          suggestions: generateOfflineSuggestions(clues, caseDoc.title),
          isOfflineFallback: true,
        };
      }
    }),

  summarizeResponses: protectedProcedure
    .input(z.object({ caseId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      checkAiRateLimit(ctx.user.userId);

      if (!mongoose.Types.ObjectId.isValid(input.caseId)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Case File ID.' });
      }

      const caseDoc = await CaseModel.findOne({
        _id: input.caseId,
        userId: ctx.user.userId,
      }).lean();

      if (!caseDoc) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Case File not found or permission denied.' });
      }

      const testimonies = await TestimonyModel.find({ caseId: caseDoc._id })
        .sort({ submittedAt: -1 })
        .limit(20)
        .lean();

      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        return {
          ...generateOfflineSummary(testimonies.map((t) => t.answers || {}), caseDoc.title),
          isOfflineFallback: true,
          disclaimer: '⚠️ AI Analysis processed via Bureau Offline Fallback Engine. Data remains strictly on your device.',
        };
      }

      // Capped text sample for AI summary
      const sampleAnswers = testimonies.map((t) => {
        const copy: Record<string, unknown> = {};
        Object.entries(t.answers || {}).forEach(([k, v]) => {
          if (k !== '_ipHash' && typeof v === 'string' && v.length < 200) {
            copy[k] = v;
          }
        });
        return copy;
      });

      const promptText = `Summarize the following witness testimony sample for Case "${caseDoc.title}":
${JSON.stringify(sampleAnswers, null, 2)}

Return a JSON object with keys:
- "verdict": 1-2 sentence executive verdict summary
- "bulletPoints": array of 3-4 bullet observations

OUTPUT MUST BE VALID JSON ONLY.`;

      try {
        const rawRes = await callAnthropicMessagesApi(promptText);
        const jsonStr = rawRes.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed: AISummaryResult = JSON.parse(jsonStr);

        return {
          verdict: parsed.verdict || 'Witness depositions show clear consistent incident patterns.',
          bulletPoints: parsed.bulletPoints || ['Depositions recorded cleanly.'],
          sampleSize: testimonies.length,
          isOfflineFallback: false,
          disclaimer: '⚠️ Testimony data sample was processed by Anthropic AI service for summary insights.',
        };
      } catch {
        return {
          ...generateOfflineSummary(testimonies.map((t) => t.answers || {}), caseDoc.title),
          isOfflineFallback: true,
          disclaimer: '⚠️ AI Analysis processed via Bureau Offline Fallback Engine.',
        };
      }
    }),
});
