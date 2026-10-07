import mongoose from 'mongoose';
import { TRPCError } from '@trpc/server';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/formflow';

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: GlobalMongoose | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached?.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: true,
      serverSelectionTimeoutMS: 5000,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e: unknown) {
    cached!.promise = null;
    const err = e as Error;

    if (err.message.includes('requires authentication') || err.message.includes('Authentication failed')) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message:
          'Database Authentication Failed: MongoDB server requires authentication. Check username/password in MONGODB_URI in .env.local.',
      });
    }

    if (
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('ENOTFOUND') ||
      err.message.includes('ETIMEDOUT') ||
      err.message.includes('Server selection timed out') ||
      err.message.includes('connect')
    ) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Database Offline: Could not connect to MongoDB. Check that MONGODB_URI is correct, that Atlas allows this machine’s IP address, and that your network can reach the cluster. For a local database, confirm mongod is running.',
      });
    }

    throw e;
  }

  return cached!.conn;
}
