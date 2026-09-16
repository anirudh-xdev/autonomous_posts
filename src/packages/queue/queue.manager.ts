import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QueueName, JobName, JobOptions } from './types';
import { env, logger } from '@/packages/config';

export type JobHandler<T = unknown> = (payload: T) => Promise<unknown>;

export class QueueManager {
  private static instance: QueueManager | null = null;
  private redisClient: IORedis | null = null;
  private bullQueues = new Map<QueueName, Queue>();
  private inMemoryHandlers = new Map<string, JobHandler[]>();
  private useRedis: boolean;

  private constructor() {
    this.useRedis = Boolean(env.REDIS_URL && env.REDIS_URL.startsWith('redis://'));

    if (this.useRedis) {
      try {
        this.redisClient = new IORedis(env.REDIS_URL!, {
          maxRetriesPerRequest: null,
          lazyConnect: true,
        });
        logger.info('QueueManager: initialized with Redis (BullMQ)');
      } catch (err) {
        logger.warn('Failed to initialize Redis connection, using in-memory queue fallback', { error: String(err) });
        this.useRedis = false;
      }
    } else {
      logger.info('QueueManager: REDIS_URL not configured. Running in zero-dependency in-memory queue mode.');
    }
  }

  public static getInstance(): QueueManager {
    if (!this.instance) {
      this.instance = new QueueManager();
    }
    return this.instance;
  }

  private getBullQueue(name: QueueName): Queue {
    if (!this.bullQueues.has(name)) {
      const q = new Queue(name, {
        connection: this.redisClient!,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      });
      this.bullQueues.set(name, q);
    }
    return this.bullQueues.get(name)!;
  }

  /**
   * Registers a worker handler for a specific job name (for both in-memory and worker environments)
   */
  public registerHandler<T = unknown>(jobName: JobName, handler: JobHandler<T>): void {
    const handlers = this.inMemoryHandlers.get(jobName) || [];
    handlers.push(handler as JobHandler);
    this.inMemoryHandlers.set(jobName, handlers);
  }

  /**
   * Dispatches a job to the appropriate queue (BullMQ or in-memory async execution)
   */
  public async addJob<T>(
    queueName: QueueName,
    jobName: JobName,
    payload: T,
    options: JobOptions = {}
  ): Promise<{ jobId: string; mode: 'bullmq' | 'in-memory' }> {
    if (this.useRedis && this.redisClient) {
      const q = this.getBullQueue(queueName);
      const job = await q.add(jobName, payload, {
        attempts: options.attempts ?? 3,
        backoff: options.backoff ?? { type: 'exponential', delay: 2000 },
        delay: options.delay,
      });

      logger.info(`BullMQ Job queued [${jobName}] on [${queueName}] with ID: ${job.id}`);
      return { jobId: job.id || 'unknown', mode: 'bullmq' };
    }

    // In-memory async dispatch
    const jobId = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    logger.info(`In-Memory Job dispatched [${jobName}] ID: ${jobId}`);

    // Asynchronous execution without blocking the caller
    setTimeout(async () => {
      const handlers = this.inMemoryHandlers.get(jobName) || [];
      if (handlers.length === 0) {
        logger.warn(`No handler registered for in-memory job [${jobName}]`);
        return;
      }

      for (const h of handlers) {
        try {
          await h(payload);
          logger.info(`In-Memory Job [${jobName}] ID: ${jobId} executed successfully`);
        } catch (err) {
          logger.error(`In-Memory Job [${jobName}] ID: ${jobId} failed`, err);
        }
      }
    }, options.delay || 0);

    return { jobId, mode: 'in-memory' };
  }

  public isRedisActive(): boolean {
    return this.useRedis;
  }
}

export const queueManager = QueueManager.getInstance();
