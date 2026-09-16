import { registerAllWorkerHandlers } from './packages/queue/workers/pipeline.worker';
import { SchedulerService } from './packages/queue/scheduler';
import { logger } from './packages/config';

async function bootstrapWorker() {
  logger.info('⚙️ Starting Autonomous Content Automation Background Worker Process...');

  registerAllWorkerHandlers();
  await SchedulerService.initSchedules();

  logger.info('🚀 Background Worker Process is running and waiting for jobs.');

  // Handle graceful shutdown
  const shutdown = async () => {
    logger.info('🛑 Shutting down background worker process...');
    SchedulerService.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrapWorker().catch((err) => {
  logger.error('Fatal error in background worker', err);
  process.exit(1);
});
