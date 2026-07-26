import type { Lang } from '@/lib/i18n';
import type { Translations } from '@/types';

interface Translatable {
  name: string;
  description?: string;
  translations?: Translations | null;
}

/**
 * What a dish is called in the guest's language, and what it is called on the
 * menu the staff know.
 *
 * The original is always Uzbek and always present; a translation may be
 * missing because it has not been generated yet, because translation is not
 * configured, or because the language is Uzbek itself. In every one of those
 * cases the guest sees the Uzbek name and nothing looks broken.
 */
export function localizedName(entry: Translatable, lang: Lang): {
  primary: string;
  /** The Uzbek original, when it differs from what is shown above it. */
  original: string | null;
} {
  const translated = lang === 'uz' ? null : entry.translations?.[lang]?.name?.trim();
  if (!translated || translated === entry.name) {
    return { primary: entry.name, original: null };
  }
  return { primary: translated, original: entry.name };
}

/** Descriptions carry meaning rather than identity, so no original is kept. */
export function localizedDescription(entry: Translatable, lang: Lang): string {
  if (lang === 'uz') return entry.description ?? '';
  return entry.translations?.[lang]?.description?.trim() || entry.description || '';
}

/** Categories have a name and nothing else. */
export function localizedCategory(
  category: { name: string; translations?: Translations | null },
  lang: Lang,
): string {
  if (lang === 'uz') return category.name;
  return category.translations?.[lang]?.name?.trim() || category.name;
}
