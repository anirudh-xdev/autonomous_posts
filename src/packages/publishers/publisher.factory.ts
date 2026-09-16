import { SocialPublisher } from './types';
import { LinkedInPublisher } from './linkedin.publisher';
import { XPublisher } from './x.publisher';
import { MockPublisher } from './mock.publisher';
import { logger } from '@/packages/config';

export class PublisherFactory {
  public static getPublisher(platform: 'LINKEDIN' | 'X', forceMock = false): SocialPublisher {
    if (forceMock || process.env.NODE_ENV === 'test') {
      return new MockPublisher(platform);
    }

    if (platform === 'LINKEDIN') {
      const real = new LinkedInPublisher();
      if (!real.isConfigured()) {
        logger.warn('LinkedIn credentials not configured. Falling back to MockPublisher.');
        return new MockPublisher('LINKEDIN');
      }
      return real;
    } else {
      const real = new XPublisher();
      if (!real.isConfigured()) {
        logger.warn('X credentials not configured. Falling back to MockPublisher.');
        return new MockPublisher('X');
      }
      return real;
    }
  }
}
