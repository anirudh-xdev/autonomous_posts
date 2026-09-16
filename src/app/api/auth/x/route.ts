import { NextResponse } from 'next/server';
import { env, logger } from '@/packages/config';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clientId = process.env.X_CLIENT_ID || env.X_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        { error: 'X_CLIENT_ID is not configured in .env' },
        { status: 400 }
      );
    }

    const redirectUri =
      process.env.X_REDIRECT_URI ||
      env.X_REDIRECT_URI ||
      `${env.APP_URL}/api/auth/x/callback`;

    // PKCE code_verifier and code_challenge
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    const state = crypto.randomBytes(16).toString('hex');

    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(
      'tweet.read tweet.write users.read offline.access'
    )}&state=${state}&code_challenge=${challenge}&code_challenge_method=S256`;

    logger.info('Redirecting user to X / Twitter 1-Click OAuth authorization');

    const response = NextResponse.redirect(authUrl);
    // Store verifier in an httpOnly cookie for token exchange
    response.cookies.set('x_pkce_verifier', verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (err) {
    logger.error('Failed to initiate X OAuth', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
