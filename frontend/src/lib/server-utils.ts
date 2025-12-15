import { cookies } from 'next/headers';
import type { Language } from './language-utils';
import type { Theme } from './theme-utils';

/**
 * Check if user has consented to cookies (server-side only)
 */
export async function hasCookieConsent(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const consentCookie = cookieStore.get('kambase-cookie-consent')?.value;
    return consentCookie === 'true';
  } catch (error) {
    console.warn('Failed to check cookie consent:', error);
    return false;
  }
}

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
 * @param skipConsentCheck Skip cookie consent check for critical operations
 */
export async function getLanguageFromCookie(skipConsentCheck = false): Promise<Language> {
  // Check cookie consent first (unless skipped for critical operations)
  if (!skipConsentCheck) {
    const hasConsent = await hasCookieConsent();
    if (!hasConsent) {
      return DEFAULT_LANGUAGE;
    }
  }

  try {
    const cookieStore = await cookies();
    const languageCookie = cookieStore.get('language-storage')?.value;

    if (languageCookie) {
      // Try to parse as JSON first (from Zustand)
      try {
        const parsed = JSON.parse(languageCookie);
        const language = parsed?.state?.language;

        if (language === 'fa' || language === 'en') {
          return language as Language;
        }
      } catch {
        // If JSON parsing fails, treat as plain string (fallback from middleware)
        if (languageCookie === 'fa' || languageCookie === 'en') {
          return languageCookie as Language;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to parse language from cookie:', error);
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Get theme from cookie (server-side only)
 * @param skipConsentCheck Skip cookie consent check for critical operations
 */
export async function getThemeFromCookie(skipConsentCheck = false): Promise<Theme> {
  // Check cookie consent first (unless skipped for critical operations)
  if (!skipConsentCheck) {
    const hasConsent = await hasCookieConsent();
    if (!hasConsent) {
      return DEFAULT_THEME;
    }
  }

  try {
    const cookieStore = await cookies();
    const themeCookie = cookieStore.get('theme-storage')?.value;

    if (themeCookie) {
      // Try to parse as JSON first (from Zustand)
      try {
        const parsed = JSON.parse(themeCookie);
        const theme = parsed?.state?.theme;

        if (theme === 'dark' || theme === 'light') {
          return theme as Theme;
        }
      } catch {
        // If JSON parsing fails, treat as plain string (fallback from middleware)
        if (themeCookie === 'dark' || themeCookie === 'light') {
          return themeCookie as Theme;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to parse theme from cookie:', error);
  }

  return DEFAULT_THEME;
}
