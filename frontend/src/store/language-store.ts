import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import faTranslations from '@/locales/fa.json';
import enTranslations from '@/locales/en.json';
import { Language, getLanguageFromLocalStorage, getLanguageFromDocumentCookie } from '@/lib/language-utils';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

// Flatten nested JSON structure to dot notation
const flattenTranslations = (obj: any, prefix = ''): Record<string, string> => {
  const result: Record<string, string> = {};
  
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenTranslations(value, newKey));
    } else {
      result[newKey] = value as string;
    }
  }
  
  return result;
};

const translations: Record<Language, Record<string, string>> = {
  fa: flattenTranslations(faTranslations),
  en: flattenTranslations(enTranslations),
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: getLanguageFromDocumentCookie() || getLanguageFromLocalStorage(),
      setLanguage: (lang) => {
        if (typeof document !== 'undefined') {
          document.documentElement.lang = lang;
          document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
        }
        set({ language: lang });
      },
      t: (key: string, params?: Record<string, string>) => {
        const lang = get().language;
        let translation = translations[lang][key] || key;
        
        // Replace parameters like {name} with actual values
        if (params) {
          Object.keys(params).forEach((param) => {
            translation = translation.replace(`{${param}}`, params[param]);
          });
        }
        
        return translation;
      },
    }),
    {
      name: 'language-storage',
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
    }
  )
);

