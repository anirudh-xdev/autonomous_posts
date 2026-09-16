import { z } from 'zod';

const toStringHelper = (val: unknown): string => {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    return val.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join('\n');
  }
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    return (
      (obj.description as string) ||
      (obj.delta as string) ||
      (obj.summary as string) ||
      (obj.text as string) ||
      (obj.value as string) ||
      JSON.stringify(obj)
    );
  }
  return String(val || '');
};

const toStringArrayHelper = (val: unknown): string[] => {
  if (!Array.isArray(val)) {
    if (typeof val === 'string') return [val];
    if (val && typeof val === 'object') return [toStringHelper(val)];
    return [];
  }
  return val.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      return (
        (obj.fact as string) ||
        (obj.claim as string) ||
        (obj.text as string) ||
        (obj.description as string) ||
        (obj.title as string) ||
        JSON.stringify(obj)
      );
    }
    return String(item);
  });
};

const toCredibilityScore = (val: unknown): number => {
  if (typeof val === 'number') {
    return Math.min(10, Math.max(0, val));
  }
  if (typeof val === 'string') {
    const lower = val.toLowerCase();
    if (lower.startsWith('high')) return 9.0;
    if (lower.startsWith('med')) return 7.0;
    if (lower.startsWith('low')) return 4.0;
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) return Math.min(10, Math.max(0, parsed));
  }
  return 8.0;
};

export const ResearchSourceItemSchema = z.object({
  title: z.preprocess((v) => String(v || 'Source'), z.string().min(1)),
  url: z.preprocess((v) => String(v || 'https://example.com'), z.string()),
  credibility: z.preprocess(toCredibilityScore, z.number().min(0).max(10)),
});

export type ResearchSourceItem = z.infer<typeof ResearchSourceItemSchema>;

export const ResearchReportDataSchema = z.object({
  keyFacts: z.preprocess(toStringArrayHelper, z.array(z.string().min(1)).min(2)),
  whatChanged: z.preprocess(toStringHelper, z.string().min(10)),
  whyItMatters: z.preprocess(toStringHelper, z.string().min(10)),
  developerImpact: z.preprocess(toStringHelper, z.string().min(10)),
  uncertainties: z.preprocess(toStringArrayHelper, z.array(z.string())),
  sources: z.preprocess(
    (v) => (Array.isArray(v) ? v : []),
    z.array(ResearchSourceItemSchema).min(1)
  ),
  confidence: z.preprocess(
    (v) => (typeof v === 'string' ? parseFloat(v) || 80 : typeof v === 'number' ? v : 80),
    z.number().min(0).max(100)
  ),
});

export type ResearchReportData = z.infer<typeof ResearchReportDataSchema>;

export interface ResearchOptions {
  forceRefresh?: boolean;
  minConfidence?: number;
}

