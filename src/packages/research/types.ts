import { z } from 'zod';

export const ResearchSourceItemSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  credibility: z.number().min(0).max(10),
});

export type ResearchSourceItem = z.infer<typeof ResearchSourceItemSchema>;

export const ResearchReportDataSchema = z.object({
  keyFacts: z.array(z.string().min(1)).min(2),
  whatChanged: z.string().min(10),
  whyItMatters: z.string().min(10),
  developerImpact: z.string().min(10),
  uncertainties: z.array(z.string()),
  sources: z.array(ResearchSourceItemSchema).min(1),
  confidence: z.number().min(0).max(100),
});

export type ResearchReportData = z.infer<typeof ResearchReportDataSchema>;

export interface ResearchOptions {
  forceRefresh?: boolean;
  minConfidence?: number;
}
