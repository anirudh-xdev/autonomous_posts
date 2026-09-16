import fs from 'fs';
import path from 'path';
import { logger, NotFoundError } from '@/packages/config';

export interface PromptTemplate {
  version: string;
  description: string;
  system: string;
  userTemplate: string;
}

export class PromptManager {
  private static promptsDir = path.resolve(process.cwd(), 'prompts');
  private static cache = new Map<string, PromptTemplate>();

  public static getPrompt(nameWithVersion: string): PromptTemplate {
    if (this.cache.has(nameWithVersion)) {
      return this.cache.get(nameWithVersion)!;
    }

    const filePath = path.join(this.promptsDir, `${nameWithVersion}.json`);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError(`Prompt template '${nameWithVersion}' at ${filePath}`);
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const template = JSON.parse(content) as PromptTemplate;
      this.cache.set(nameWithVersion, template);
      return template;
    } catch (err) {
      logger.error(`Failed to parse prompt template ${nameWithVersion}`, err);
      throw err;
    }
  }

  public static render(
    template: PromptTemplate,
    variables: Record<string, string | number | boolean | unknown>
  ): { system: string; user: string } {
    const interpolate = (text: string): string => {
      return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const val = variables[key];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val, null, 2);
        return String(val);
      });
    };

    return {
      system: interpolate(template.system),
      user: interpolate(template.userTemplate),
    };
  }
}
