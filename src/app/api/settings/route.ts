import { NextResponse } from 'next/server';
import { prisma } from '@/packages/database';
import { VoiceProfileService } from '@/packages/content';
import { env, logger } from '@/packages/config';

export async function GET() {
  try {
    const voice = await VoiceProfileService.getActiveProfile();
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, unknown> = {};
    for (const s of settings) {
      settingsMap[s.key] = JSON.parse(s.value);
    }

    const integrations = {
      linkedin: {
        configured: Boolean(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET),
        mode: env.LINKEDIN_CLIENT_ID ? 'Official API' : 'Mock Mode (awaiting credentials)',
      },
      x: {
        configured: Boolean(env.X_CLIENT_ID && env.X_CLIENT_SECRET),
        mode: env.X_CLIENT_ID ? 'Official API v2' : 'Mock Mode (awaiting credentials)',
      },
      llm: {
        provider: env.LLM_PROVIDER,
        configured: Boolean(env.LLM_API_KEY || env.LLM_PROVIDER === 'mock'),
      },
      queue: {
        redisConfigured: Boolean(env.REDIS_URL),
        mode: env.REDIS_URL ? 'BullMQ (Redis)' : 'In-Memory Async Event Queue',
      },
      database: {
        type: 'SQLite / PostgreSQL (Prisma)',
      },
    };

    return NextResponse.json({
      success: true,
      voice,
      settings: settingsMap,
      integrations,
    });
  } catch (err) {
    logger.error('API GET /api/settings failed', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      voice?: {
        name?: string;
        technicalDepth?: number;
        humorLevel?: number;
        emojiLevel?: number;
        tone?: string[];
        audience?: string[];
        avoidPhrases?: string[];
        preferredStructure?: string[];
        preferredTopics?: string[];
      };
      settings?: Record<string, unknown>;
    };

    if (body.voice) {
      const activeVoice = await prisma.voiceProfile.findFirst({ where: { isDefault: true } });
      if (activeVoice) {
        await VoiceProfileService.updateProfile(activeVoice.id, body.voice);
      }
    }

    if (body.settings) {
      for (const [key, value] of Object.entries(body.settings)) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: JSON.stringify(value) },
          create: { key, value: JSON.stringify(value) },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    logger.error('API PATCH /api/settings failed', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
