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
    const errorDescription = searchParams.get('error_description');

    if (error) {
      logger.warn('LinkedIn OAuth returned error', { error, errorDescription });
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(errorDescription || error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/settings?error=No+authorization+code+received', request.url)
      );
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID || env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || env.LINKEDIN_CLIENT_SECRET;
    const redirectUri =
      process.env.LINKEDIN_REDIRECT_URI ||
      env.LINKEDIN_REDIRECT_URI ||
      `${env.APP_URL}/api/auth/linkedin/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/settings?error=Missing+LinkedIn+client+credentials', request.url)
      );
    }

    logger.info('Exchanging LinkedIn authorization code for access token');

    // 1. Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      logger.error('LinkedIn token exchange failed', { status: tokenRes.status, body: errText });
      return NextResponse.redirect(
        new URL(`/settings?error=Token+exchange+failed:+${encodeURIComponent(errText.slice(0, 100))}`, request.url)
      );
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      scope?: string;
    };

    logger.info('Successfully obtained LinkedIn access token. Fetching user info...');

    // 2. Fetch User Profile to get Person URN (sub) and Name
    let userInfo: { sub?: string; name?: string; email?: string; picture?: string } = {};
    try {
      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (userRes.ok) {
        userInfo = (await userRes.json()) as typeof userInfo;
        logger.info('LinkedIn user info fetched successfully', { name: userInfo.name, sub: userInfo.sub });
      } else {
        logger.warn('Failed to fetch userinfo from LinkedIn, status: ' + userRes.status);
      }
    } catch (userErr) {
      logger.warn('Error fetching LinkedIn userinfo', { error: String(userErr) });
    }

    let memberId = userInfo.sub;
    let accountName = userInfo.name || 'LinkedIn Member';

    // If userinfo didn't return sub (e.g. only w_member_social scope), try /v2/me
    if (!memberId) {
      try {
        const meRes = await fetch('https://api.linkedin.com/v2/me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (meRes.ok) {
          const meData = (await meRes.json()) as { id?: string; localizedFirstName?: string; localizedLastName?: string };
          if (meData.id) {
            memberId = meData.id;
            accountName = `${meData.localizedFirstName || ''} ${meData.localizedLastName || ''}`.trim() || accountName;
            logger.info('LinkedIn member ID fetched via /v2/me fallback', { memberId, accountName });
          }
        }
      } catch (meErr) {
        logger.warn('Error fetching LinkedIn /v2/me fallback', { error: String(meErr) });
      }
    }

    if (!memberId) {
      if (process.env.LINKEDIN_AUTHOR_URN && process.env.LINKEDIN_AUTHOR_URN !== 'urn:li:person:your-member-id') {
        memberId = process.env.LINKEDIN_AUTHOR_URN.replace('urn:li:person:', '');
      } else {
        memberId = 'member';
      }
    }

    const authorUrn = memberId.startsWith('urn:li:') ? memberId : `urn:li:person:${memberId}`;

    // 3. Encrypt and store token in database (Account model)
    const encryptedToken = encryptSecret(tokenData.access_token);
    const encryptedRefresh = tokenData.refresh_token ? encryptSecret(tokenData.refresh_token) : null;
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000);

    await prisma.account.upsert({
      where: { platform: 'LINKEDIN' },
      create: {
        platform: 'LINKEDIN',
        accountId: memberId,
        accountName,
        username: userInfo.email || undefined,
        avatarUrl: userInfo.picture || undefined,
        accessTokenEnc: encryptedToken,
        refreshTokenEnc: encryptedRefresh,
        tokenExpiresAt: expiresAt,
        scopes: JSON.stringify(tokenData.scope ? tokenData.scope.split(' ') : ['openid', 'profile', 'w_member_social']),
      },
      update: {
        accountId: memberId,
        accountName,
        username: userInfo.email || undefined,
        avatarUrl: userInfo.picture || undefined,
        accessTokenEnc: encryptedToken,
        refreshTokenEnc: encryptedRefresh,
        tokenExpiresAt: expiresAt,
        scopes: JSON.stringify(tokenData.scope ? tokenData.scope.split(' ') : ['openid', 'profile', 'w_member_social']),
        updatedAt: new Date(),
      },
    });

    // 4. Update process.env in-memory so services can immediately use it
    process.env.LINKEDIN_ACCESS_TOKEN = tokenData.access_token;
    process.env.LINKEDIN_AUTHOR_URN = authorUrn;

    // 5. Automatically write back into .env file
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');

        // Replace or append LINKEDIN_ACCESS_TOKEN
        if (envContent.includes('LINKEDIN_ACCESS_TOKEN=')) {
          envContent = envContent.replace(/LINKEDIN_ACCESS_TOKEN=.*/, `LINKEDIN_ACCESS_TOKEN="${tokenData.access_token}"`);
        } else {
          envContent += `\nLINKEDIN_ACCESS_TOKEN="${tokenData.access_token}"`;
        }

        // Replace or append LINKEDIN_AUTHOR_URN
        if (envContent.includes('LINKEDIN_AUTHOR_URN=')) {
          envContent = envContent.replace(/LINKEDIN_AUTHOR_URN=.*/, `LINKEDIN_AUTHOR_URN="${authorUrn}"`);
        } else {
          envContent += `\nLINKEDIN_AUTHOR_URN="${authorUrn}"`;
        }

        fs.writeFileSync(envPath, envContent, 'utf8');
        logger.info('Updated .env with live LinkedIn access token and author URN');
      }
    } catch (fsErr) {
      logger.warn('Could not write tokens back to .env file', { error: String(fsErr) });
    }

    logger.info('🎉 LinkedIn account successfully connected via 1-Click OAuth!', { accountName, authorUrn });
    return NextResponse.redirect(
      new URL(`/settings?connected=linkedin&name=${encodeURIComponent(accountName)}`, request.url)
    );
  } catch (err) {
    logger.error('Unexpected error in LinkedIn OAuth callback', err);
    return NextResponse.redirect(
      new URL(`/settings?error=Unexpected+OAuth+error:+${encodeURIComponent(String(err))}`, request.url)
    );
  }
}
