import { router, publicProcedure, protectedProcedure } from '../trpc';
import { signupSchema, loginSchema } from '@/lib/schemas';
import { UserModel } from '../models/User';
import { hashPassword, comparePassword, signJWT, COOKIE_NAME } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { cookies } from 'next/headers';

export const authRouter = router({
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input }) => {
      await connectToDatabase();

      const existing = await UserModel.findOne({ email: input.email.toLowerCase() }).catch(() => null);
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An agent with this badge email is already registered in agency archives.',
        });
      }

      const passwordHash = await hashPassword(input.password);
      const badgeNumber = `DET-${Math.floor(1000 + Math.random() * 9000)}`;

      const newUser = await UserModel.create({
        name: input.agentName,
        email: input.email.toLowerCase(),
        passwordHash,
        badgeNumber,
      });

      const token = await signJWT({
        userId: newUser._id.toString(),
        email: newUser.email,
        agentName: newUser.name,
      });

      cookies().set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return {
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          badgeNumber: newUser.badgeNumber,
        },
      };
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      await connectToDatabase();

      // Do not reveal whether an email exists on login failure for security
      const genericError = new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid badge email or secret passcode.',
      });

      const user = await UserModel.findOne({ email: input.email.toLowerCase() }).catch(() => null);
      if (!user) {
        throw genericError;
      }

      const isMatch = await comparePassword(input.password, user.passwordHash);
      if (!isMatch) {
        throw genericError;
      }

      const token = await signJWT({
        userId: user._id.toString(),
        email: user.email,
        agentName: user.name,
      });

      cookies().set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          badgeNumber: user.badgeNumber,
        },
      };
    }),

  logout: publicProcedure.mutation(async () => {
    cookies().set(COOKIE_NAME, '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });
    return { success: true };
  }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    await connectToDatabase();

    const user = await UserModel.findById(ctx.user.userId).catch(() => null);
    if (!user) {
      return {
        id: ctx.user.userId,
        name: ctx.user.agentName,
        email: ctx.user.email,
        badgeNumber: 'DET-7742',
      };
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      badgeNumber: user.badgeNumber,
    };
  }),
});
