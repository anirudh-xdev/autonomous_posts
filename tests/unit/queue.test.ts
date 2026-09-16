import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { queueManager, registerAllWorkerHandlers, SchedulerService } from '@/packages/queue';
import { prisma, seedDatabase } from '@/packages/database';

describe('Phase 8: Queue Layer & Scheduler', () => {
  beforeAll(async () => {
    await seedDatabase();
    registerAllWorkerHandlers();
  });

  afterAll(async () => {
    SchedulerService.stop();
    await prisma.$disconnect();
  });

  it('should register handlers and dispatch in-memory jobs', async () => {
    let resolveHandler: () => void;
    const handledPromise = new Promise<void>((resolve) => {
      resolveHandler = resolve;
    });

    queueManager.registerHandler<{ testMessage: string }>('discover-trends', async (payload) => {
      if (payload.testMessage === 'unit-test') {
        resolveHandler();
      }
    });

    const result = await queueManager.addJob('discovery-queue', 'discover-trends', {
      testMessage: 'unit-test',
    });

    expect(result.jobId).toBeDefined();
    expect(result.mode).toBeDefined();

    // Await deterministic execution
    await handledPromise;
  });

  it('should initialize schedules in database and cleanly stop timers', async () => {
    await SchedulerService.initSchedules();

    const schedules = await prisma.schedule.findMany();
    expect(schedules.length).toBeGreaterThanOrEqual(1);

    SchedulerService.stop();
  });
});
