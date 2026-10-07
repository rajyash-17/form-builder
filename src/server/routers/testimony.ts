import { router, publicProcedure, protectedProcedure } from '../trpc';
import { CaseModel } from '../models/Case';
import { TestimonyModel } from '../models/Testimony';
import { buildResponseSchema, evaluateCondition } from '@/lib/validation';
import { connectToDatabase } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import crypto from 'crypto';

// In-memory rate limiter tracking submissions per IP
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute
  const maxSubmits = 10;

  const entry = ipRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + limitWindow });
    return true;
  }

  if (entry.count >= maxSubmits) {
    return false;
  }

  entry.count += 1;
  return true;
}

export const testimonyRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        shareId: z.string(),
        answers: z.record(z.unknown()),
        honeypot: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await connectToDatabase();

      // 1. Honeypot Anti-Bot Check
      if (input.honeypot && input.honeypot.trim() !== '') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Automated bot activity detected by bureau security.',
        });
      }

      // 2. IP Address & Rate Limiting
      const clientIp = '127.0.0.1';
      if (!checkRateLimit(clientIp)) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded: Maximum 10 sworn testimony submissions per minute.',
        });
      }

      // 3. Find Case by Share ID
      const caseDoc = await CaseModel.findOne({ shareId: input.shareId });
      if (!caseDoc) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Case File not found.' });
      }

      // 4. Enforce Published Status ("Active")
      if (caseDoc.status !== 'published') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'THIS CASE IS COLD (CLOSED). Depositions are not being accepted.',
        });
      }

      // 5. Check Close Date Expiration
      if (caseDoc.settings?.closeDate) {
        const closeTime = new Date(caseDoc.settings.closeDate).getTime();
        if (Date.now() > closeTime) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'THIS CASE HAS EXPIRED. Close date reached.',
          });
        }
      }

      // 6. Check Response Limit
      if (caseDoc.settings?.responseLimit) {
        const currentCount = await TestimonyModel.countDocuments({ caseId: caseDoc._id });
        if (currentCount >= caseDoc.settings.responseLimit) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'MAXIMUM TESTIMONY LIMIT REACHED for this case file.',
          });
        }
      }

      // 7. Check Allow Multiple Submissions
      const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex');
      if (caseDoc.settings?.allowMultipleSubmissions === false) {
        const existingTestimony = await TestimonyModel.findOne({
          caseId: caseDoc._id,
          'answers._ipHash': ipHash,
        });
        if (existingTestimony) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You have already sworn and submitted testimony for this case file.',
          });
        }
      }

      // 8. Server-Side Dynamic Zod Validation & Conditional Pruning
      const dynamicSchema = buildResponseSchema(caseDoc.clues || [], input.answers);
      let validatedAnswers: Record<string, unknown>;
      try {
        validatedAnswers = dynamicSchema.parse(input.answers);
      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
          const firstError = err.errors[0]?.message || 'Invalid testimony answers format.';
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Validation Error: ${firstError}`,
          });
        }
        throw err;
      }

      // Drop answers for clues that were hidden by conditional logic
      const cleanedAnswers: Record<string, unknown> = {};
      (caseDoc.clues || []).forEach((clue) => {
        if (clue.type === 'statement' || clue.type === 'pageBreak') return;
        const isVisible = !clue.showIf || evaluateCondition(clue.showIf, input.answers);
        if (isVisible && validatedAnswers[clue.id] !== undefined) {
          cleanedAnswers[clue.id] = validatedAnswers[clue.id];
        }
      });

      cleanedAnswers._ipHash = ipHash;

      // 9. Save Testimony Record
      const newTestimony = await TestimonyModel.create({
        caseId: caseDoc._id,
        answers: cleanedAnswers,
        submittedAt: new Date(),
      });

      // 10. Email Notification Provider Interface (Resend or No-Op Log)
      if (caseDoc.settings?.notifyEmailOnTestimony) {
        const recipientEmail = caseDoc.settings.notificationEmail;
        if (recipientEmail) {
          if (process.env.RESEND_API_KEY) {
            try {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'FormFlow Bureau <notifications@formflow.app>',
                  to: [recipientEmail],
                  subject: `🕵️‍♂️ New Sworn Testimony Filed for Case: ${caseDoc.title}`,
                  html: `<p>A new witness deposition has been sworn and recorded in bureau archives for Case <strong>${caseDoc.title}</strong>.</p>`,
                }),
              });
            } catch {
              // Ignore email sending failures in background
            }
          } else {
            console.log(
              `[EMAIL NOTIFICATION NO-OP] Sworn testimony notification for case "${caseDoc.title}" to ${recipientEmail}`
            );
          }
        }
      }

      return {
        success: true,
        id: newTestimony._id.toString(),
        thankYouMessage:
          caseDoc.settings?.thankYouMessage ||
          'Your sworn testimony has been officially recorded in bureau archives.',
        redirectUrl: caseDoc.settings?.redirectUrl || '',
      };
    }),

  list: protectedProcedure
    .input(
      z.object({
        caseId: z.string(),
        search: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        sortBy: z.enum(['newest', 'oldest']).optional().default('newest'),
      })
    )
    .query(async ({ input, ctx }) => {
      await connectToDatabase();

      if (!mongoose.Types.ObjectId.isValid(input.caseId)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Case File ID.' });
      }

      // Verify case ownership
      const caseDoc = await CaseModel.findOne({
        _id: input.caseId,
        userId: ctx.user.userId,
      }).lean();

      if (!caseDoc) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Case File not found or permission denied.' });
      }

      const filterQuery: Record<string, unknown> = {
        caseId: caseDoc._id,
      };

      if (input.startDate || input.endDate) {
        const dateFilter: Record<string, Date> = {};
        if (input.startDate) dateFilter.$gte = new Date(input.startDate);
        if (input.endDate) dateFilter.$lte = new Date(input.endDate);
        filterQuery.submittedAt = dateFilter;
      }

      const sortOrder = input.sortBy === 'oldest' ? 1 : -1;

      let testimonies = await TestimonyModel.find(filterQuery)
        .sort({ submittedAt: sortOrder })
        .lean();

      if (input.search && input.search.trim() !== '') {
        const queryStr = input.search.trim().toLowerCase();
        testimonies = testimonies.filter((t) => {
          const answersObj = t.answers || {};
          return Object.values(answersObj).some((val) => {
            if (typeof val === 'string') return val.toLowerCase().includes(queryStr);
            if (typeof val === 'number') return String(val).includes(queryStr);
            if (Array.isArray(val)) return val.some((v) => String(v).toLowerCase().includes(queryStr));
            return false;
          });
        });
      }

      return {
        clues: caseDoc.clues || [],
        testimonies: testimonies.map((t) => ({
          id: t._id.toString(),
          answers: t.answers || {},
          submittedAt: t.submittedAt.toISOString(),
        })),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      await connectToDatabase();

      if (!mongoose.Types.ObjectId.isValid(input.id)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Testimony ID.' });
      }

      const testimony = await TestimonyModel.findById(input.id).lean();
      if (!testimony) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Testimony not found.' });
      }

      const caseDoc = await CaseModel.findOne({
        _id: testimony.caseId,
        userId: ctx.user.userId,
      }).lean();

      if (!caseDoc) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied to this testimony.' });
      }

      return {
        id: testimony._id.toString(),
        caseTitle: caseDoc.title,
        clues: caseDoc.clues || [],
        answers: testimony.answers || {},
        submittedAt: testimony.submittedAt.toISOString(),
      };
    }),

  getStats: protectedProcedure
    .input(
      z.object({
        caseId: z.string(),
        range: z.enum(['7d', '30d', 'all']).default('30d'),
      })
    )
    .query(async ({ input, ctx }) => {
      await connectToDatabase();

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
        .sort({ submittedAt: 1 })
        .lean();

      const views = caseDoc.viewCount || 0;
      const totalTestimonies = testimonies.length;
      const completionRate =
        views > 0 ? Math.min(Math.round((totalTestimonies / views) * 100), 100) : totalTestimonies > 0 ? 100 : 0;
      const avgDurationSeconds = 48; // Estimated average deposition time

      // Calculate Timeline Data for 7d, 30d, or all days
      const daysCount = input.range === '7d' ? 7 : input.range === '30d' ? 30 : 60;
      const timelineMap = new Map<string, number>();

      const now = new Date();
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        timelineMap.set(dateStr, 0);
      }

      testimonies.forEach((t) => {
        const dateStr = new Date(t.submittedAt).toISOString().split('T')[0];
        if (timelineMap.has(dateStr)) {
          timelineMap.set(dateStr, (timelineMap.get(dateStr) || 0) + 1);
        } else if (input.range === 'all') {
          timelineMap.set(dateStr, (timelineMap.get(dateStr) || 0) + 1);
        }
      });

      const timelineData = Array.from(timelineMap.entries()).map(([date, count]) => ({
        date: date.substring(5), // 'MM-DD'
        testimonies: count,
      }));

      // Calculate Per-Clue Breakdown Analytics
      const clueStats = (caseDoc.clues || [])
        .filter((c) => c.type !== 'statement')
        .map((clue) => {
          const rawValues = testimonies
            .map((t) => (t.answers as Record<string, unknown>)?.[clue.id])
            .filter((v) => v !== undefined && v !== null && v !== '');

          const isChoice = ['dropdown', 'multipleChoice', 'checkboxes', 'yesNo'].includes(clue.type);
          const isNumeric = ['number', 'rating', 'linearScale'].includes(clue.type);

          if (isChoice) {
            const counts: Record<string, number> = {};
            (clue.options || (clue.type === 'yesNo' ? ['Yes', 'No'] : [])).forEach((opt) => {
              counts[opt] = 0;
            });

            rawValues.forEach((val) => {
              if (Array.isArray(val)) {
                val.forEach((v) => {
                  const str = String(v);
                  counts[str] = (counts[str] || 0) + 1;
                });
              } else {
                const str = String(val);
                counts[str] = (counts[str] || 0) + 1;
              }
            });

            const distribution = Object.entries(counts).map(([option, count]) => ({
              option,
              count,
            }));

            return {
              id: clue.id,
              type: clue.type,
              label: clue.label,
              category: 'choice' as const,
              totalAnswers: rawValues.length,
              distribution,
            };
          }

          if (isNumeric) {
            const numVals = rawValues.map((v) => Number(v)).filter((n) => !isNaN(n));
            const count = numVals.length;
            const sum = numVals.reduce((a, b) => a + b, 0);
            const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;
            const min = count > 0 ? Math.min(...numVals) : 0;
            const max = count > 0 ? Math.max(...numVals) : 0;

            const distMap: Record<number, number> = {};
            numVals.forEach((n) => {
              distMap[n] = (distMap[n] || 0) + 1;
            });

            const distribution = Object.entries(distMap).map(([val, cnt]) => ({
              value: Number(val),
              count: cnt,
            }));

            return {
              id: clue.id,
              type: clue.type,
              label: clue.label,
              category: 'numeric' as const,
              totalAnswers: count,
              avg,
              min,
              max,
              distribution,
            };
          }

          // Text Clues
          const recentAnswers = rawValues
            .slice(-5)
            .reverse()
            .map((v) => String(v));

          return {
            id: clue.id,
            type: clue.type,
            label: clue.label,
            category: 'text' as const,
            totalAnswers: rawValues.length,
            recentAnswers,
          };
        });

      return {
        totals: {
          views,
          testimonies: totalTestimonies,
          completionRate,
          avgDurationSeconds,
        },
        timeline: timelineData,
        clueStats,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await connectToDatabase();

      if (!mongoose.Types.ObjectId.isValid(input.id)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Testimony ID.' });
      }

      const testimony = await TestimonyModel.findById(input.id);
      if (!testimony) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Testimony not found.' });
      }

      const caseDoc = await CaseModel.findOne({
        _id: testimony.caseId,
        userId: ctx.user.userId,
      });

      if (!caseDoc) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      await TestimonyModel.deleteOne({ _id: testimony._id });
      return { success: true };
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      await connectToDatabase();

      const objectIds = input.ids
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (objectIds.length === 0) {
        return { success: true, count: 0 };
      }

      const testimonies = await TestimonyModel.find({ _id: { $in: objectIds } }).lean();
      const caseIds = Array.from(new Set(testimonies.map((t) => t.caseId)));

      const ownedCases = await CaseModel.find({
        _id: { $in: caseIds },
        userId: ctx.user.userId,
      }).lean();

      const ownedCaseIdSet = new Set(ownedCases.map((c) => c._id.toString()));
      const validTestimonyIds = testimonies
        .filter((t) => ownedCaseIdSet.has(t.caseId.toString()))
        .map((t) => t._id);

      const result = await TestimonyModel.deleteMany({ _id: { $in: validTestimonyIds } });
      return { success: true, count: result.deletedCount };
    }),
});
