import { initTRPC, TRPCError } from '@trpc/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyJWT, UserPayload } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';

export async function createContext() {
  await connectToDatabase().catch((err) => {
    console.warn('Database connection warning (check MONGODB_URI):', err.message);
  });

  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  let user: UserPayload | null = null;

  if (token) {
    user = await verifyJWT(token);
  }

  return {
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Access denied: Detective badge verification failed. Please login.',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
