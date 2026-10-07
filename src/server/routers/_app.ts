import { router } from '../trpc';
import { authRouter } from './auth';
import { caseRouter } from './case';
import { testimonyRouter } from './testimony';
import { aiRouter } from './ai';

export const appRouter = router({
  auth: authRouter,
  case: caseRouter,
  testimony: testimonyRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
