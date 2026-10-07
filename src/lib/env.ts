import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required for database connection.'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters for security.'),
  RESEND_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

/**
 * Validates process.env against the Zod schema.
 * Throws a formatted error if required variables are missing or invalid.
 */
export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variable configuration:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Environment variable validation failed. Inspect detective bureau config.');
  }
  return parsed.data;
}

export const env = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/formflow',
  JWT_SECRET: process.env.JWT_SECRET || 'noir_detective_super_secret_jwt_key_2026',
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
