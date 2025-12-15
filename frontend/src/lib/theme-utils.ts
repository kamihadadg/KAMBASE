export type Theme = 'dark' | 'light';

export const DEFAULT_THEME: Theme = 'dark';

/**
 * Get theme from localStorage (client-side)
 */
export function getThemeFromLocalStorage(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  try {
    const themeStorage = localStorage.getItem('theme-storage');
    if (themeStorage) {
      const parsed = JSON.parse(themeStorage);
      const theme = parsed?.state?.theme;

      if (theme === 'dark' || theme === 'light') {
        return theme as Theme;
      }
    }
  } catch (error) {
    console.warn('Failed to parse theme from localStorage:', error);
  }

  return DEFAULT_THEME;
}

/**
 * Get theme from document cookie (client-side)
 */
export function getThemeFromDocumentCookie(): Theme {
  if (typeof document === 'undefined') return DEFAULT_THEME;

  try {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('theme-storage='))
      ?.split('=')[1];

    if (cookieValue) {
      const parsed = JSON.parse(decodeURIComponent(cookieValue));
      const theme = parsed?.state?.theme;

      if (theme === 'dark' || theme === 'light') {
        return theme as Theme;
      }
    }
  } catch (error) {
    console.warn('Failed to parse theme from document cookie:', error);
  }

  return DEFAULT_THEME;
}
