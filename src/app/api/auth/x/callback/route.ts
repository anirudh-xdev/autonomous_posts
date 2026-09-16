import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/packages/database';
import { env, encryptSecret, logger } from '@/packages/config';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      logger.warn('X OAuth returned error', { error });
      return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/settings?error=No+authorization+code+received', request.url));
    }

    const verifier = request.cookies.get('x_pkce_verifier')?.value;
    if (!verifier) {
      return NextResponse.redirect(new URL('/settings?error=Missing+PKCE+code+verifier', request.url));
    }

    const clientId = process.env.X_CLIENT_ID || env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET || env.X_CLIENT_SECRET;
    const redirectUri =
      process.env.X_REDIRECT_URI ||
      env.X_REDIRECT_URI ||
      `${env.APP_URL}/api/auth/x/callback`;

    if (!clientId) {
      return NextResponse.redirect(new URL('/settings?error=Missing+X+client+credentials', request.url));
    }

    logger.info('Exchanging X authorization code for access token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (clientSecret) {
      headers['Authorization'] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
    }

    const bodyParams = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });

    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers,
      body: bodyParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      logger.error('X token exchange failed', { status: tokenRes.status, body: errText });
      return NextResponse.redirect(
        new URL(`/settings?error=X+token+exchange+failed:+${encodeURIComponent(errText.slice(0, 100))}`, request.url)
      );
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      scope?: string;
    };

    logger.info('Successfully obtained X access token. Fetching user info...');

    // Fetch user profile
    let xUser: { id?: string; name?: string; username?: string; profile_image_url?: string } = {};
    try {
      const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (userRes.ok) {
        const userData = (await userRes.json()) as { data?: typeof xUser };
        if (userData.data) {
          xUser = userData.data;
        }
      }
    } catch (uErr) {
      logger.warn('Failed to fetch user from Twitter API', { error: String(uErr) });
    }

    const accountId = xUser.id || 'unknown';
    const accountName = xUser.name || 'X User';
    const username = xUser.username || undefined;
    const avatarUrl = xUser.profile_image_url || undefined;

    // Encrypt and store in database
    const encryptedToken = encryptSecret(tokenData.access_token);
    const encryptedRefresh = tokenData.refresh_token ? encryptSecret(tokenData.refresh_token) : null;
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 7200) * 1000);

    await prisma.account.upsert({
      where: { platform: 'X' },
      create: {
        platform: 'X',
        accountId,
        accountName,
        username,
        avatarUrl,
        accessTokenEnc: encryptedToken,
        refreshTokenEnc: encryptedRefresh,
        tokenExpiresAt: expiresAt,
        scopes: JSON.stringify(tokenData.scope ? tokenData.scope.split(' ') : ['tweet.read', 'tweet.write']),
      },
      update: {
        accountId,
        accountName,
        username,
        avatarUrl,
        accessTokenEnc: encryptedToken,
        refreshTokenEnc: encryptedRefresh,
        tokenExpiresAt: expiresAt,
        scopes: JSON.stringify(tokenData.scope ? tokenData.scope.split(' ') : ['tweet.read', 'tweet.write']),
        updatedAt: new Date(),
      },
    });

    process.env.X_ACCESS_TOKEN = tokenData.access_token;

    // Write back to .env
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('X_ACCESS_TOKEN=')) {
          envContent = envContent.replace(/X_ACCESS_TOKEN=.*/, `X_ACCESS_TOKEN="${tokenData.access_token}"`);
        } else {
          envContent += `\nX_ACCESS_TOKEN="${tokenData.access_token}"`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (fsErr) {
      logger.warn('Could not write X token to .env file', { error: String(fsErr) });
    }

    const response = NextResponse.redirect(
      new URL(`/settings?connected=x&name=${encodeURIComponent(username || accountName)}`, request.url)
    );
    response.cookies.delete('x_pkce_verifier');
    return response;
  } catch (err) {
    logger.error('Unexpected error in X OAuth callback', err);
    return NextResponse.redirect(
      new URL(`/settings?error=Unexpected+OAuth+error:+${encodeURIComponent(String(err))}`, request.url)
    );
  }
}
