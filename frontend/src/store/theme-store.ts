import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Theme, getThemeFromLocalStorage, getThemeFromDocumentCookie } from '@/lib/theme-utils';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  applyTheme: (theme: Theme) => void;
}

const applyThemeToDocument = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getThemeFromDocumentCookie() || getThemeFromLocalStorage(),
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyThemeToDocument(newTheme);
        set({ theme: newTheme });
      },
      setTheme: (theme) => {
        applyThemeToDocument(theme);
        set({ theme });
      },
      applyTheme: (theme) => {
        applyThemeToDocument(theme);
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => {
        // Sync with cookie for SSR consistency
        if (typeof window !== 'undefined') {
          return {
            getItem: (name: string) => {
              const value = localStorage.getItem(name);
              // Also sync to cookie for SSR
              if (value) {
                document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
              }
              return value;
            },
            setItem: (name: string, value: string) => {
              localStorage.setItem(name, value);
              // Sync to cookie for SSR
              document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
            },
            removeItem: (name: string) => {
              localStorage.removeItem(name);
              // Remove from cookie
              document.cookie = `${name}=; path=/; max-age=0`;
            },
          };
        }
        return localStorage;
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme after rehydration
        if (state) {
          applyThemeToDocument(state.theme);
        }
      },
    }
  )
);

