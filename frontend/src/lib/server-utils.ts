import { cookies } from 'next/headers';
import type { Language } from './language-utils';
import type { Theme } from './theme-utils';

export const DEFAULT_LANGUAGE: Language = 'fa';
export const DEFAULT_THEME: Theme = 'dark';

/**
 * Get HTML attributes for language
 */
export function getLanguageAttributes(language: Language) {
  return {
    lang: language,
    dir: language === 'fa' ? 'rtl' : 'ltr',
  };
}

/**
 * Get language from cookie (server-side only)
 */
export async function getLanguageFromCookie(): Promise<Language> {
  try {
    const cookieStore = await cookies();
    const languageCookie = cookieStore.get('language-storage')?.value;

    if (languageCookie) {
      const parsed = JSON.parse(languageCookie);
      const language = parsed?.state?.language;

      if (language === 'fa' || language === 'en') {
        return language as Language;
      }
    }
  } catch (error) {
    console.warn('Failed to parse language from cookie:', error);
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Get theme from cookie (server-side only)
 */
export async function getThemeFromCookie(): Promise<Theme> {
  try {
    const cookieStore = await cookies();
    const themeCookie = cookieStore.get('theme-storage')?.value;

    if (themeCookie) {
      const parsed = JSON.parse(themeCookie);
      const theme = parsed?.state?.theme;

      if (theme === 'dark' || theme === 'light') {
        return theme as Theme;
      }
    }
  } catch (error) {
    console.warn('Failed to parse theme from cookie:', error);
  }

  return DEFAULT_THEME;
}
