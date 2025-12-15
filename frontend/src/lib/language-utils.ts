export type Language = 'fa' | 'en';

export const DEFAULT_LANGUAGE: Language = 'fa';
export const LANGUAGES = ['fa', 'en'] as const;

/**
 * Get language from localStorage (client-side)
 */
export function getLanguageFromLocalStorage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    const languageStorage = localStorage.getItem('language-storage');
    if (languageStorage) {
      const parsed = JSON.parse(languageStorage);
      const language = parsed?.state?.language;

      if (LANGUAGES.includes(language as Language)) {
        return language as Language;
      }
    }
  } catch (error) {
    console.warn('Failed to parse language from localStorage:', error);
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Get language from document cookie (client-side)
 */
export function getLanguageFromDocumentCookie(): Language {
  if (typeof document === 'undefined') return DEFAULT_LANGUAGE;

  try {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('language-storage='))
      ?.split('=')[1];

    if (cookieValue) {
      const parsed = JSON.parse(decodeURIComponent(cookieValue));
      const language = parsed?.state?.language;

      if (LANGUAGES.includes(language as Language)) {
        return language as Language;
      }
    }
  } catch (error) {
    console.warn('Failed to parse language from document cookie:', error);
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Get HTML attributes for language
 */
export function getLanguageAttributes(language: Language) {
  return {
    lang: language,
    dir: language === 'fa' ? 'rtl' : 'ltr',
  };
}
