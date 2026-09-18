import { SocialPublisher } from './types';
import { LinkedInPublisher } from './linkedin.publisher';
import { XPublisher } from './x.publisher';
import { MockPublisher } from './mock.publisher';
import { ValidationError } from '@/packages/config';

export class PublisherFactory {
  public static getPublisher(platform: 'LINKEDIN' | 'X', forceMock = false): SocialPublisher {
    if (forceMock || process.env.NODE_ENV === 'test') {
      return new MockPublisher(platform);
    }

    if (platform === 'LINKEDIN') {
      const real = new LinkedInPublisher();
      if (!real.isConfigured()) {
        throw new ValidationError('LinkedIn credentials not configured. Please set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN in Settings or your .env file.');
      }
      return real;
    } else {
      const real = new XPublisher();
      if (!real.isConfigured()) {
        throw new ValidationError('X (Twitter) credentials not configured. Please set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_SECRET in Settings or your .env file.');
      }
      return real;
    }
  }
}
