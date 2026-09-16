import { VoiceProfileData } from './types';
import { prisma } from '@/packages/database';
import { logger } from '@/packages/config';

export class VoiceProfileService {
  /**
   * Retrieves the active or default voice profile
   */
  public static async getActiveProfile(): Promise<VoiceProfileData> {
    const profile = await prisma.voiceProfile.findFirst({
      where: { isDefault: true },
    });

    if (profile) {
      return {
        id: profile.id,
        name: profile.name,
        tone: JSON.parse(profile.tone),
        audience: JSON.parse(profile.audience),
        technicalDepth: profile.technicalDepth,
        humorLevel: profile.humorLevel,
        emojiLevel: profile.emojiLevel,
        preferredStructure: JSON.parse(profile.preferredStructure),
        avoidPhrases: JSON.parse(profile.avoidPhrases),
        preferredTopics: JSON.parse(profile.preferredTopics),
      };
    }

    // Default fallback
    return {
      name: 'Default Technical Voice',
      tone: ['technical', 'practical', 'conversational', 'confident but not exaggerated'],
      audience: ['software developers', 'ai engineers', 'engineering leaders', 'technical founders'],
      technicalDepth: 7,
      humorLevel: 2,
      emojiLevel: 1,
      preferredStructure: [
        'Hook',
        'What Happened',
        'What Changed',
        'Why Developers Care',
        'Developer Impact',
        'Technical Insight',
        'Discussion Question',
      ],
      avoidPhrases: [
        'This changes everything',
        'The future is here',
        'Game changer',
        'Revolutionary',
        'Mind blown',
        'Crazy new AI',
      ],
      preferredTopics: ['ai-agents', 'mcp', 'llms', 'inference', 'ai-coding-agents'],
    };
  }

  /**
   * Updates or creates a voice profile
   */
  public static async updateProfile(id: string, data: Partial<VoiceProfileData>) {
    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.technicalDepth !== undefined) updateData.technicalDepth = data.technicalDepth;
    if (data.humorLevel !== undefined) updateData.humorLevel = data.humorLevel;
    if (data.emojiLevel !== undefined) updateData.emojiLevel = data.emojiLevel;
    if (data.tone) updateData.tone = JSON.stringify(data.tone);
    if (data.audience) updateData.audience = JSON.stringify(data.audience);
    if (data.preferredStructure) updateData.preferredStructure = JSON.stringify(data.preferredStructure);
    if (data.avoidPhrases) updateData.avoidPhrases = JSON.stringify(data.avoidPhrases);
    if (data.preferredTopics) updateData.preferredTopics = JSON.stringify(data.preferredTopics);

    return prisma.voiceProfile.update({
      where: { id },
      data: updateData,
    });
  }
}
