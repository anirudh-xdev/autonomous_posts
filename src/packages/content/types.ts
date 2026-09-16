import { z } from 'zod';

export const LinkedInPostSchema = z.object({
  hook: z.string().min(10),
  text: z.string().min(100).max(3000),
});

export const XPostSchema = z.object({
  hook: z.string().min(5),
  text: z.string().min(20).max(280),
  isThread: z.boolean().default(false),
  posts: z.array(z.string().min(10).max(280)).optional(),
});

export const ContentGenerationResultSchema = z.object({
  linkedin: LinkedInPostSchema,
  x: XPostSchema,
  reasoning: z.object({
    angle: z.string(),
    developerInsight: z.string(),
  }),
});

export type ContentGenerationResult = z.infer<typeof ContentGenerationResultSchema>;

export interface VoiceProfileData {
  id?: string;
  name: string;
  tone: string[];
  audience: string[];
  technicalDepth: number; // 1 - 10
  humorLevel: number;     // 1 - 10
  emojiLevel: number;     // 1 - 10
  preferredStructure: string[];
  avoidPhrases: string[];
  preferredTopics: string[];
}

export interface GenerateContentOptions {
  customAngle?: string;
  forceRegenerate?: boolean;
  model?: string;
}
