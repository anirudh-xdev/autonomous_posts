import { z } from 'zod';

export const QualityAuditResultSchema = z.object({
  factualAccuracy: z.preprocess((v) => (typeof v === 'number' ? v : parseFloat(String(v)) || 90), z.number().min(0).max(100)),
  originality: z.preprocess((v) => (typeof v === 'number' ? v : parseFloat(String(v)) || 90), z.number().min(0).max(100)),
  developerValue: z.preprocess((v) => (typeof v === 'number' ? v : parseFloat(String(v)) || 90), z.number().min(0).max(100)),
  writingQuality: z.preprocess((v) => (typeof v === 'number' ? v : parseFloat(String(v)) || 90), z.number().min(0).max(100)),
  sourceConfidence: z.preprocess((v) => (typeof v === 'number' ? v : parseFloat(String(v)) || 90), z.number().min(0).max(100)),
  spamScore: z.preprocess((v) => (typeof v === 'number' ? v : parseFloat(String(v)) || 0), z.number().min(0).max(100)),
  overallScore: z.preprocess((v) => (typeof v === 'number' ? v : parseFloat(String(v)) || 88), z.number().min(0).max(100)),
  passed: z.preprocess((v) => (typeof v === 'boolean' ? v : String(v).toLowerCase() === 'true'), z.boolean()),
  feedback: z.preprocess((v) => (Array.isArray(v) ? v.map(String) : [String(v || '')]), z.array(z.string())),
  checks: z.preprocess((v) => (typeof v === 'object' && v !== null ? v : {}), z.record(z.boolean())),
});

export type QualityAuditResult = z.infer<typeof QualityAuditResultSchema>;

export interface DeterministicCheckResult {
  passed: boolean;
  violations: string[];
  spamScore: number;
}
