/**
 * Structured Logger with Secret Masking & Request/Job Tracing
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'apikey',
  'authorization',
  'cookie',
  'encryptionkey',
  'clientsecret',
]);

function maskSensitive(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Mask potential JWTs or long hex strings if they match patterns
    if (obj.length > 30 && (obj.startsWith('eyJ') || obj.startsWith('sk-') || obj.startsWith('ghp_'))) {
      return `${obj.slice(0, 4)}...[MASKED]`;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(maskSensitive);
  }
  if (typeof obj === 'object') {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const normalizedKey = key.toLowerCase().replace(/[-_]/g, '');
      if (SENSITIVE_KEYS.has(normalizedKey)) {
        masked[key] = '[REDACTED]';
      } else {
        masked[key] = maskSensitive(value);
      }
    }
    return masked;
  }
  return obj;
}

export class Logger {
  private serviceName: string;
  private defaultMeta: Record<string, unknown>;

  constructor(serviceName = 'autonomus-posts', defaultMeta: Record<string, unknown> = {}) {
    this.serviceName = serviceName;
    this.defaultMeta = defaultMeta;
  }

  public child(meta: Record<string, unknown>): Logger {
    return new Logger(this.serviceName, { ...this.defaultMeta, ...meta });
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...this.defaultMeta,
      ...(meta ? (maskSensitive(meta) as Record<string, unknown>) : {}),
    };

    const output = JSON.stringify(payload);
    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
      this.log('debug', message, meta);
    }
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  public error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    const errMeta: Record<string, unknown> = { ...meta };
    if (error instanceof Error) {
      errMeta.errorName = error.name;
      errMeta.errorMessage = error.message;
      errMeta.stack = error.stack;
    } else if (error) {
      errMeta.rawError = String(error);
    }
    this.log('error', message, errMeta);
  }
}

export const logger = new Logger('core');
