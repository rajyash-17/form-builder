import { router, publicProcedure, protectedProcedure } from '../trpc';
import {
  createCaseSchema,
  updateCaseSchema,
  updateCaseStatusSchema,
  caseFilterSchema,
} from '@/lib/schemas';
import { CaseModel } from '../models/Case';
import { TestimonyModel } from '../models/Testimony';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import mongoose from 'mongoose';

function generateShareId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'case-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const caseRouter = router({
  list: protectedProcedure
    .input(caseFilterSchema)
    .query(async ({ ctx, input }) => {
      // Build query enforcing ownership strictly
      const query: Record<string, unknown> = {
        userId: new mongoose.Types.ObjectId(ctx.user.userId),
      };

      if (input.status && input.status !== 'all') {
        query.status = input.status;
      }

      if (input.search && input.search.trim() !== '') {
        query.title = { $regex: input.search.trim(), $options: 'i' };
      }

      const cases = await CaseModel.find(query)
        .sort({ updatedAt: -1 })
        .lean();

      const caseIds = cases.map((c) => c._id);

      // Aggregation for testimony counts
      const testimonyCounts = await TestimonyModel.aggregate([
        { $match: { caseId: { $in: caseIds } } },
        { $group: { _id: '$caseId', count: { $sum: 1 } } },
      ]).catch(() => []);

      const countMap = new Map<string, number>();
      testimonyCounts.forEach((item: { _id: mongoose.Types.ObjectId; count: number }) => {
        countMap.set(item._id.toString(), item.count);
      });

      return cases.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        description: c.description || '',
        status: c.status,
        shareId: c.shareId,
        cluesCount: c.clues?.length || 0,
        testimonyCount: countMap.get(c._id.toString()) || 0,
        viewCount: c.viewCount || 0,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!mongoose.Types.ObjectId.isValid(input.id)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Case File ID.' });
      }

      // Enforce strict ownership verification
      const caseDoc = await CaseModel.findOne({
        _id: input.id,
        userId: ctx.user.userId,
      }).lean();

      if (!caseDoc) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Case File not found or permission denied in archives.',
        });
      }

      const testimonyCount = await TestimonyModel.countDocuments({
        caseId: caseDoc._id,
      }).catch(() => 0);

      return {
        id: caseDoc._id.toString(),
        title: caseDoc.title,
        description: caseDoc.description || '',
        status: caseDoc.status,
        shareId: caseDoc.shareId,
        clues: caseDoc.clues || [],
        settings: caseDoc.settings || {
          accentColor: '#f0b44c',
          thankYouMessage: 'Your testimony has been sworn and recorded in official archives.',
          redirectUrl: '',
          allowMultipleSubmissions: true,
        },
        testimonyCount,
        viewCount: caseDoc.viewCount || 0,
        createdAt: caseDoc.createdAt.toISOString(),
        updatedAt: caseDoc.updatedAt.toISOString(),
      };
    }),

  getByShareId: publicProcedure
    .input(z.object({ shareId: z.string() }))
    .query(async ({ input }) => {
      const caseDoc = await CaseModel.findOneAndUpdate(
        { shareId: input.shareId },
        { $inc: { viewCount: 1 } },
        { new: true }
      ).lean();

      if (!caseDoc) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Case File not found.' });
      }

      if (caseDoc.status === 'closed') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'THIS CASE IS COLD (CLOSED). No further depositions can be recorded at this time.',
        });
      }

      return {
        id: caseDoc._id.toString(),
        title: caseDoc.title,
        description: caseDoc.description || '',
        status: caseDoc.status,
        shareId: caseDoc.shareId,
        clues: caseDoc.clues || [],
        settings: caseDoc.settings || {
          accentColor: '#f0b44c',
          thankYouMessage: 'Your testimony has been sworn and recorded in official archives.',
          redirectUrl: '',
          allowMultipleSubmissions: true,
        },
      };
    }),

  create: protectedProcedure
    .input(createCaseSchema)
    .mutation(async ({ ctx, input }) => {
      let shareId = generateShareId();
      while (await CaseModel.findOne({ shareId }).catch(() => null)) {
        shareId = generateShareId();
      }

      const newCase = await CaseModel.create({
        userId: new mongoose.Types.ObjectId(ctx.user.userId),
        title: input.title,
        description: input.description || '',
        status: 'draft',
        clues: [],
        settings: {
          accentColor: '#f0b44c',
          thankYouMessage: 'Your testimony has been sworn and recorded in official archives.',
          redirectUrl: '',
          allowMultipleSubmissions: true,
        },
        shareId,
        viewCount: 0,
      });

      return {
        id: newCase._id.toString(),
        title: newCase.title,
        description: newCase.description,
        status: newCase.status,
        shareId: newCase.shareId,
      };
    }),

  update: protectedProcedure
    .input(updateCaseSchema)
    .mutation(async ({ ctx, input }) => {
      if (!mongoose.Types.ObjectId.isValid(input.id)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Case File ID.' });
      }

      // Strict ownership check
      const updated = await CaseModel.findOneAndUpdate(
        { _id: input.id, userId: ctx.user.userId },
        {
          $set: {
            title: input.title,
            description: input.description,
            status: input.status,
            clues: input.clues,
            settings: input.settings,
          },
        },
        { new: true }
      ).lean();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Case File not found or permission denied.',
        });
      }

      return {
        id: updated._id.toString(),
        title: updated.title,
        description: updated.description,
        status: updated.status,
        shareId: updated.shareId,
        clues: updated.clues,
        settings: updated.settings,
      };
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!mongoose.Types.ObjectId.isValid(input.id)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Case File ID.' });
      }

      // Enforce ownership check on source case file
      const sourceCase = await CaseModel.findOne({
        _id: input.id,
        userId: ctx.user.userId,
      }).lean();

      if (!sourceCase) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Source Case File not found or permission denied.',
        });
      }

      let newShareId = generateShareId();
      while (await CaseModel.findOne({ shareId: newShareId }).catch(() => null)) {
        newShareId = generateShareId();
      }

      const duplicatedCase = await CaseModel.create({
        userId: new mongoose.Types.ObjectId(ctx.user.userId),
        title: `Copy of ${sourceCase.title}`,
        description: sourceCase.description || '',
        status: 'draft',
        clues: sourceCase.clues || [],
        settings: sourceCase.settings || {
          accentColor: '#f0b44c',
          thankYouMessage: 'Your testimony has been sworn and recorded in official archives.',
          redirectUrl: '',
          allowMultipleSubmissions: true,
        },
        shareId: newShareId,
        viewCount: 0,
      });

      return {
        id: duplicatedCase._id.toString(),
        title: duplicatedCase.title,
        description: duplicatedCase.description,
        status: duplicatedCase.status,
        shareId: duplicatedCase.shareId,
      };
    }),

  setStatus: protectedProcedure
    .input(updateCaseStatusSchema)
    .mutation(async ({ ctx, input }) => {
      if (!mongoose.Types.ObjectId.isValid(input.id)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Case File ID.' });
      }

      const updated = await CaseModel.findOneAndUpdate(
        { _id: input.id, userId: ctx.user.userId },
        { $set: { status: input.status } },
        { new: true }
      ).lean();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Case File not found.' });
      }

      return {
        id: updated._id.toString(),
        status: updated.status,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!mongoose.Types.ObjectId.isValid(input.id)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid Case File ID.' });
      }

      const deleted = await CaseModel.findOneAndDelete({
        _id: input.id,
        userId: ctx.user.userId,
      });

      if (!deleted) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Case File not found or permission denied.' });
      }

      await TestimonyModel.deleteMany({ caseId: deleted._id }).catch(() => null);

      return { success: true };
    }),
});
