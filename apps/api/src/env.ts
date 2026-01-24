import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string(),
  TOKEN_COC: z.string(),
  BETTER_AUTH_TRUSTED_ORIGIN: z
    .string()
    .transform((str) => str.split(","))
    .pipe(z.array(z.string())),
  BETTER_AUTH_TRUSTED_DOMAIN: z.string(),
  REDIS_HOST: z.string().optional().default("localhost"),
  REDIS_PORT: z.string().optional().default("6379"),
  REDIS_PASSWORD: z.string().optional().default(""),
});

export const env = envSchema.parse(process.env);
