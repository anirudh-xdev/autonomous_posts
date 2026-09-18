import { z } from 'zod';

const trimToMax = (max: number) => (val: unknown): string => {
  const str = String(val || '').trim();
  if (str.length <= max) return str;
  const truncated = str.slice(0, max);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > max * 0.8 ? truncated.slice(0, lastSpace) : truncated;
};

export const LinkedInPostSchema = z.object({
  hook: z.preprocess((v) => String(v || 'Engineering Deep Dive'), z.string().min(5)),
  text: z.preprocess((v) => String(v || ''), z.string().min(50).max(4000)),
});

export const XPostSchema = z.object({
  hook: z.preprocess((v) => String(v || 'Tech Insight'), z.string().min(3)),
  text: z.preprocess(trimToMax(280), z.string().min(10).max(280)),
  isThread: z.preprocess((v) => Boolean(v), z.boolean().default(false)),
  posts: z.preprocess(
    (v) => (Array.isArray(v) ? v.map((p) => trimToMax(280)(p)) : undefined),
    z.array(z.string().min(10).max(280)).optional()
  ),
});

export const VisualReferenceSchema = z.object({
  type: z.preprocess(
    (v) => String(v || 'concept_diagram').toLowerCase(),
    z.enum([
      'architecture_diagram',
      'product_screenshot',
      'benchmark_chart',
      'official_image',
      'concept_diagram',
    ])
  ),
  title: z.preprocess((v) => String(v || 'Technical Visual'), z.string().min(3)),
  description: z.preprocess((v) => String(v || ''), z.string().min(10)),
  suggestedSourceUrl: z.preprocess(
    (v) => (v ? String(v) : undefined),
    z.string().url().optional().or(z.literal(''))
  ).optional(),
  reasonWhyHelpful: z.preprocess((v) => String(v || ''), z.string().min(5)),
});

export type VisualReference = z.infer<typeof VisualReferenceSchema>;

export const ContentGenerationResultSchema = z.object({
  linkedin: LinkedInPostSchema,
  x: XPostSchema,
  visuals: z.preprocess(
    (v) => (Array.isArray(v) ? v : []),
    z.array(VisualReferenceSchema)
  ).default([]),
  reasoning: z.object({
    angle: z.preprocess((v) => String(v || 'Technical architecture'), z.string()),
    developerInsight: z.preprocess((v) => String(v || 'Practical developer workflow'), z.string()),
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
