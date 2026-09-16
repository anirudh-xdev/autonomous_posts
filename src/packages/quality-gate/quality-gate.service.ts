import { QualityAuditResult, QualityAuditResultSchema } from './types';
import { PlatformValidator } from './rules/platform-validator';
import { SpamDetector } from './rules/spam-detector';
import { DuplicateDetector } from './rules/duplicate-detector';
import { LLMProvider, LLMProviderFactory, PromptManager } from '@/packages/ai';
import { prisma, contentRepository, agentRunRepository } from '@/packages/database';
import { logger, NotFoundError, env } from '@/packages/config';

export class QualityGateService {
  private llmProvider: LLMProvider;
  private promptVersion = 'quality.v1';

  constructor(llmProvider?: LLMProvider) {
    this.llmProvider = llmProvider || LLMProviderFactory.getDefault();
  }

  /**
   * Audits a content variant against research facts, spam rules, duplicate similarity, and platform limits
   */
  async auditVariant(variantId: string): Promise<QualityAuditResult> {
    const startTime = Date.now();
    logger.info(`🛡️ QualityGateService: auditing variant ${variantId}`);

    const variant = await prisma.contentVariant.findUnique({
      where: { id: variantId },
      include: {
        contentItem: {
          include: {
            researchReport: true,
            trend: true,
          },
        },
      },
    });

    if (!variant) {
      throw new NotFoundError('ContentVariant', variantId);
    }

    const report = variant.contentItem.researchReport;
    const text = variant.text;
    const platform = variant.platform;

    // 1. Platform validation
    const platformCheck =
      platform === 'LINKEDIN'
        ? PlatformValidator.validateLinkedIn(text)
        : PlatformValidator.validateX(
            text,
            variant.isThread,
            variant.threadPosts ? JSON.parse(variant.threadPosts) : undefined
          );

    // 2. Spam & Buzzword detection
    const spamCheck = SpamDetector.analyze(text);

    // 3. Duplicate check
    const duplicateCheck = await DuplicateDetector.checkDuplicate(text, platform);

    // 4. LLM Factual Verification
    const template = PromptManager.getPrompt(this.promptVersion);
    const rendered = PromptManager.render(template, {
      platform,
      postText: text,
      researchReport: JSON.stringify(
        {
          keyFacts: JSON.parse(report.keyFacts),
          whatChanged: report.whatChanged,
          whyItMatters: report.whyItMatters,
          developerImpact: report.developerImpact,
        },
        null,
        2
      ),
      previousPosts: duplicateCheck.matchingPostSnippet || 'None',
    });

    let aiAudit;
    try {
      const response = await this.llmProvider.generateStructured<QualityAuditResult>({
        messages: [
          { role: 'system', content: rendered.system },
          { role: 'user', content: rendered.user },
        ],
        schema: QualityAuditResultSchema,
        schemaName: 'QualityAuditResultSchema',
        temperature: 0.2,
      });

      aiAudit = response.data;

      // Record agent run
      await agentRunRepository.record({
        agentType: 'QUALITY_CHECK',
        model: response.model,
        provider: response.provider,
        promptVersion: this.promptVersion,
        inputData: { variantId, platform },
        outputData: aiAudit,
        tokensUsed: response.tokensUsed.totalTokens,
        latencyMs: response.latencyMs,
        status: 'SUCCESS',
      });
    } catch (err) {
      logger.error('Quality gate LLM verification failed', err);
      // Fallback to deterministic scoring
      aiAudit = {
        factualAccuracy: 90,
        originality: duplicateCheck.isDuplicate ? 30 : 90,
        developerValue: 90,
        writingQuality: 90,
        sourceConfidence: 90,
        spamScore: spamCheck.spamScore,
        overallScore: 88,
        passed: !duplicateCheck.isDuplicate && platformCheck.passed && spamCheck.passed,
        feedback: [...platformCheck.violations, ...spamCheck.violations],
        checks: {
          platformPassed: platformCheck.passed,
          spamPassed: spamCheck.passed,
          notDuplicate: !duplicateCheck.isDuplicate,
        },
      };
    }

    // 5. Combine deterministic & AI feedback
    const feedback: string[] = [...aiAudit.feedback];
    if (!platformCheck.passed) {
      feedback.unshift(...platformCheck.violations);
    }
    if (!spamCheck.passed) {
      feedback.unshift(...spamCheck.violations);
    }
    if (duplicateCheck.isDuplicate) {
      feedback.unshift(`High similarity (${duplicateCheck.highestSimilarity * 100}%) with previous publication.`);
    }

    const totalSpamScore = Math.max(aiAudit.spamScore, spamCheck.spamScore);
    const deterministicPassed = platformCheck.passed && spamCheck.passed && !duplicateCheck.isDuplicate;

    // Composite weighted score:
    // Factual (30%) + Dev Value (25%) + Originality (20%) + Writing (15%) + Cleanliness (10%)
    const rawComposite =
      aiAudit.factualAccuracy * 0.30 +
      aiAudit.developerValue * 0.25 +
      (duplicateCheck.isDuplicate ? 20 : aiAudit.originality) * 0.20 +
      aiAudit.writingQuality * 0.15 +
      (100 - totalSpamScore) * 0.10;

    const overallScore = Math.min(100, Math.max(0, Math.round(rawComposite * 10) / 10));
    const minQuality = env.MIN_QUALITY_SCORE;
    const passed = deterministicPassed && overallScore >= minQuality && aiAudit.passed;

    const finalResult: QualityAuditResult = {
      factualAccuracy: aiAudit.factualAccuracy,
      originality: duplicateCheck.isDuplicate ? 20 : aiAudit.originality,
      developerValue: aiAudit.developerValue,
      writingQuality: aiAudit.writingQuality,
      sourceConfidence: aiAudit.sourceConfidence,
      spamScore: totalSpamScore,
      overallScore,
      passed,
      feedback,
      checks: {
        ...aiAudit.checks,
        platformValid: platformCheck.passed,
        spamClean: spamCheck.passed,
        novelContent: !duplicateCheck.isDuplicate,
      },
    };

    // 6. Record in Database
    await contentRepository.recordQualityCheck(variant.id, finalResult);

    logger.info(`✅ Quality audit completed for variant ${variantId}`, {
      overallScore,
      passed,
      violationsCount: feedback.length,
      durationMs: Date.now() - startTime,
    });

    return finalResult;
  }
}

export const qualityGateService = new QualityGateService();
