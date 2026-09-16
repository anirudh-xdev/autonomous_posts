import { NextResponse } from 'next/server';
import { env, logger } from '@/packages/config';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID || env.LINKEDIN_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        { error: 'LINKEDIN_CLIENT_ID is not configured in .env' },
        { status: 400 }
      );
    }

    const redirectUri =
      process.env.LINKEDIN_REDIRECT_URI ||
      env.LINKEDIN_REDIRECT_URI ||
      `${env.APP_URL}/api/auth/linkedin/callback`;

    // Generate random state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');

    // Scopes: Default to openid + profile + email + w_member_social if OpenID product is added,
    // or w_member_social if Share on LinkedIn is the only product enabled.
    const requestedScope =
      process.env.LINKEDIN_SCOPES ||
      'openid profile email w_member_social';

    const scope = encodeURIComponent(requestedScope);

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}&scope=${scope}`;

    logger.info('Redirecting user to LinkedIn 1-Click OAuth authorization', { scope: requestedScope });
    return NextResponse.redirect(authUrl);
  } catch (err) {
    logger.error('Failed to initiate LinkedIn OAuth', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
