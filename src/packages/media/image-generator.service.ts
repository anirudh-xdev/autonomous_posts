import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { ImageGenerationOptions, GeneratedImageResult } from './types';
import { logger } from '@/packages/config';

export class ImageGeneratorService {
  private outputDir: string;
  private hfToken: string;

  constructor() {
    this.outputDir = path.resolve(process.cwd(), 'public', 'generated-images');
    this.hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || '';
    this.ensureOutputDir();
  }

  private ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Crafts a tailored, high-signal technical diagram or visual prompt for developer social media.
   */
  public craftPrompt(options: ImageGenerationOptions): string {
    if (options.customPrompt && options.customPrompt.trim().length > 10) {
      return options.customPrompt.trim();
    }

    const topic = options.topic || 'Artificial Intelligence Engineering';
    const title = options.title;
    const visual = options.visualConcept ? `${title} — ${options.visualConcept}` : title;

    // Technical diagram aesthetic optimized for LinkedIn & Twitter preview cards
    return (
      `Modern high-fidelity technical system architecture diagram representing "${visual}". ` +
      `Topic: ${topic}. Sleek dark mode palette, deep navy and obsidian background, glowing emerald and electric amber telemetry lines. ` +
      `Isometric modular node layout, clean vector interfaces, minimal futuristic software engineering blueprint, hyper-detailed, 8k resolution, crisp clean design.`
    );
  }

  /**
   * Generates a free AI visual image and saves it as a static asset in public/generated-images/
   */
  async generatePostImage(options: ImageGenerationOptions): Promise<GeneratedImageResult> {
    this.ensureOutputDir();
    const prompt = this.craftPrompt(options);
    const filename = `visual-${Date.now()}-${randomUUID().slice(0, 8)}.png`;
    const fullLocalPath = path.join(this.outputDir, filename);
    const publicUrl = `/generated-images/${filename}`;

    const requestedProvider = options.provider || process.env.IMAGE_PROVIDER || 'auto';
    const hasHfToken = Boolean(this.hfToken && this.hfToken.trim().length > 5);

    logger.info(`🎨 ImageGeneratorService: generating image for "${options.title.slice(0, 60)}"`, {
      provider: requestedProvider,
      hasHfToken,
    });

    // 1. Try Hugging Face FLUX.1-schnell if requested or auto with token
    if ((requestedProvider === 'huggingface' || requestedProvider === 'auto') && hasHfToken) {
      try {
        logger.info('Calling Hugging Face Serverless FLUX.1-schnell model...');
        const hfRes = await fetch(
          'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.hfToken}`,
            },
            body: JSON.stringify({ inputs: prompt }),
          }
        );

        if (hfRes.ok) {
          const buffer = Buffer.from(await hfRes.arrayBuffer());
          fs.writeFileSync(fullLocalPath, buffer);
          logger.info(`✅ Image successfully generated via Hugging Face FLUX: ${publicUrl}`);

          return {
            imageUrl: publicUrl,
            fullLocalPath,
            promptUsed: prompt,
            provider: 'huggingface',
            model: 'black-forest-labs/FLUX.1-schnell',
            width: 1200,
            height: 630,
          };
        }

        const errBody = await hfRes.text().catch(() => '');
        logger.warn(`Hugging Face image generation responded with HTTP ${hfRes.status}: ${errBody}. Falling back to zero-key serverless FLUX.`);
      } catch (hfErr) {
        logger.warn('Hugging Face image generation failed, falling back to zero-key serverless FLUX', hfErr);
      }
    }

    // 2. Zero-key serverless FLUX fallback (Pollinations AI FLUX engine)
    logger.info('Calling Zero-Key Serverless FLUX Image Engine...');
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=630&model=flux&nologo=true&seed=${seed}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const polRes = await fetch(pollinationsUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      if (!polRes.ok) {
        throw new Error(`Zero-key image server responded with HTTP ${polRes.status}`);
      }

      const buffer = Buffer.from(await polRes.arrayBuffer());
      fs.writeFileSync(fullLocalPath, buffer);
      logger.info(`✅ Image successfully generated via Serverless FLUX: ${publicUrl}`);

      return {
        imageUrl: publicUrl,
        fullLocalPath,
        promptUsed: prompt,
        provider: 'pollinations',
        model: 'flux-serverless',
        width: 1200,
        height: 630,
      };
    } catch (polErr: any) {
      clearTimeout(timeoutId);
      logger.error('Failed to generate image from serverless provider', polErr);
      throw new Error(`Free image generation failed: ${polErr?.message || String(polErr)}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const imageGeneratorService = new ImageGeneratorService();
