import { Injectable, Logger } from '@nestjs/common';

/** The languages the customer menu offers, minus the source language. */
export const TARGET_LANGS = ['en', 'ru', 'ko'] as const;
export type TargetLang = (typeof TARGET_LANGS)[number];

export interface Translated {
  name?: string;
  description?: string;
}
export type TranslationMap = Partial<Record<TargetLang, Translated>>;

const LANG_NAMES: Record<TargetLang, string> = {
  en: 'English',
  ru: 'Russian',
  ko: 'Korean',
};

/**
 * Translates menu text out of Uzbek using Gemini.
 *
 * Dish names are transliterated rather than translated - a guest who reads
 * "플로프" and says "Palov" is understood by the waiter, whereas one who reads
 * "fried rice" is not, and it is not fried rice. Descriptions are translated
 * properly, because that is the part carrying meaning.
 *
 * Every failure path returns nothing rather than throwing: a translation that
 * did not happen must never stop an owner saving their menu.
 */
@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  private get apiKey(): string {
    return process.env.GEMINI_API_KEY || '';
  }

  private get model(): string {
    return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }

  get configured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Returns translations for one dish, or {} if translation is unavailable.
   * `description` may be empty, in which case only the name is translated.
   */
  async translateMenuText(name: string, description = ''): Promise<TranslationMap> {
    if (!this.configured || !name.trim()) return {};

    const prompt = [
      'You translate restaurant menu entries from Uzbek.',
      '',
      'Rules:',
      '- The dish NAME is a proper noun. Transliterate it into the target',
      "  script; do not translate its meaning. Uzbek \"Palov\" becomes Russian",
      '  "Плов" and Korean "플로프", never "fried rice" or "볶음밥".',
      '- If the name is a generic word rather than a dish name (for example',
      '  "Choy", "Suv"), translate it normally.',
      '- The DESCRIPTION is ordinary prose. Translate it naturally and keep it',
      '  about the same length.',
      '- Reply with JSON only, no code fence and no commentary.',
      '',
      `Target languages: ${TARGET_LANGS.map((l) => `${l} (${LANG_NAMES[l]})`).join(', ')}`,
      '',
      'Reply exactly in this shape:',
      '{"en":{"name":"...","description":"..."},"ru":{...},"ko":{...}}',
      '',
      `NAME: ${name}`,
      `DESCRIPTION: ${description || '(none)'}`,
    ].join('\n');

    const raw = await this.callGemini(prompt);
    if (!raw) return {};

    const parsed = this.parseJson(raw);
    if (!parsed) {
      this.logger.warn(`Unparseable translation reply for "${name}"`);
      return {};
    }

    // Keep only the languages and fields we asked for, as strings.
    const out: TranslationMap = {};
    for (const lang of TARGET_LANGS) {
      const entry = parsed[lang];
      if (!entry || typeof entry !== 'object') continue;
      const translated: Translated = {};
      if (typeof entry.name === 'string' && entry.name.trim()) {
        translated.name = entry.name.trim();
      }
      if (typeof entry.description === 'string' && entry.description.trim()) {
        translated.description = entry.description.trim();
      }
      if (translated.name || translated.description) out[lang] = translated;
    }
    return out;
  }

  /** Category names are a name with no description. */
  async translateCategoryName(name: string): Promise<Record<string, { name?: string }>> {
    const map = await this.translateMenuText(name, '');
    const out: Record<string, { name?: string }> = {};
    for (const lang of TARGET_LANGS) {
      if (map[lang]?.name) out[lang] = { name: map[lang]!.name };
    }
    return out;
  }

  private async callGemini(prompt: string): Promise<string | null> {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent` +
      `?key=${encodeURIComponent(this.apiKey)}`;

    // A slow translator must not hold a menu save open indefinitely.
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 20_000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
        signal: abort.signal,
      });
      if (!res.ok) {
        const body = await res.text();
        this.logger.warn(`Gemini ${res.status}: ${body.slice(0, 200)}`);
        return null;
      }
      const json: any = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      return typeof text === 'string' ? text : null;
    } catch (err: any) {
      this.logger.warn(
        err?.name === 'AbortError'
          ? 'Gemini timed out'
          : `Gemini call failed: ${err?.message}`,
      );
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Tolerates a stray code fence even though we ask for bare JSON. */
  private parseJson(raw: string): any | null {
    const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start < 0 || end <= start) return null;
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
  }
}
