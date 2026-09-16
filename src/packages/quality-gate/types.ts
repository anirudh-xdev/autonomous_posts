import { z } from 'zod';

export const QualityAuditResultSchema = z.object({
  factualAccuracy: z.number().min(0).max(100),
  originality: z.number().min(0).max(100),
  developerValue: z.number().min(0).max(100),
  writingQuality: z.number().min(0).max(100),
  sourceConfidence: z.number().min(0).max(100),
  spamScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  passed: z.boolean(),
  feedback: z.array(z.string()),
  checks: z.record(z.boolean()),
});

export type QualityAuditResult = z.infer<typeof QualityAuditResultSchema>;

export interface DeterministicCheckResult {
  passed: boolean;
  violations: string[];
  spamScore: number;
}
