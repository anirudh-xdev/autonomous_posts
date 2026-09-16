export interface PublishPostInput {
  text: string;
  isThread?: boolean;
  threadPosts?: string[];
  variantId: string;
}

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  postUrl?: string;
  error?: string;
  retryAfterSeconds?: number;
}

export interface ValidatePostInput {
  text: string;
  isThread?: boolean;
  threadPosts?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface AccountInfo {
  platform: 'LINKEDIN' | 'X';
  accountId: string;
  accountName: string;
  username?: string;
  avatarUrl?: string;
  isConnected: boolean;
  expiresAt?: Date;
}

export interface SocialPublisher {
  readonly platform: 'LINKEDIN' | 'X';
  publishPost(input: PublishPostInput): Promise<PublishResult>;
  validatePost(input: ValidatePostInput): Promise<ValidationResult>;
  getAccount(): Promise<AccountInfo>;
  isConfigured(): boolean;
}
