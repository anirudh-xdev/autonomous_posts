import { queueManager } from './queue.manager';
import { prisma } from '@/packages/database';
import { logger } from '@/packages/config';

export class SchedulerService {
  private static timers: NodeJS.Timeout[] = [];

  /**
   * Initializes cron/interval schedules and synchronizes with the database Schedule table
   */
  public static async initSchedules() {
    logger.info('⏰ Initializing SchedulerService...');

    // Clear existing timers
    this.stop();

    const schedules = await prisma.schedule.findMany({ where: { enabled: true } });

    // Seed default schedule if none exist
    if (schedules.length === 0) {
      await prisma.schedule.createMany({
        data: [
          {
            name: 'Trend Discovery (Every 6h)',
            jobType: 'DISCOVERY',
            cronExpression: '0 */6 * * *',
            enabled: true,
          },
          {
            name: 'Daily Publishing Window',
            jobType: 'PUBLISHING',
            cronExpression: '0 14 * * *', // 2:00 PM UTC
            enabled: true,
          },
        ],
      });
    }

    // Start 6-hour interval for discovery
    // In dev / test, we also allow manual trigger via API
    const discoveryIntervalMs = 6 * 60 * 60 * 1000;
    const timer = setInterval(async () => {
      logger.info('Scheduler: triggered recurring trend discovery');
      await queueManager.addJob('discovery-queue', 'discover-trends', {});
      await prisma.schedule.updateMany({
        where: { jobType: 'DISCOVERY' },
        data: { lastRunAt: new Date() },
      });
    }, discoveryIntervalMs);

    this.timers.push(timer);
    logger.info('✅ Recurring schedules initialized successfully.');
  }

  public static stop() {
    for (const t of this.timers) {
      clearInterval(t);
    }
    this.timers = [];
  }
}
