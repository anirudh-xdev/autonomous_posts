import { PrismaClient } from '@prisma/client';
import { logger } from '@/packages/config';

declare global {
  // Prevent multiple instances in development hot-reloading
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Log queries in debug mode if needed
if (process.env.LOG_LEVEL === 'debug') {
  // @ts-expect-error Prisma event typing
  prisma.$on('query', (e: { query: string; params: string; duration: number }) => {
    logger.debug('Prisma Query', { query: e.query, durationMs: e.duration });
  });
}
