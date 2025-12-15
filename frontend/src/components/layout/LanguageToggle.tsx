'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguageStore } from '@/store/language-store';

const languages = [
  { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  // در آینده می‌توان زبان‌های بیشتری اضافه کرد:
  // { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  // { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
];

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((lang) => lang.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative z-30" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 space-x-reverse px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm"
      >
        <span>{currentLanguage.flag}</span>
        <span className="text-gray-900 dark:text-gray-300">{currentLanguage.name}</span>
        <svg
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-auto right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[50] min-w-[120px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as 'fa' | 'en');
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-2 space-x-reverse px-4 py-2 text-sm transition ${
                language === lang.code
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${lang.code === languages[0].code ? 'rounded-t-lg' : ''} ${
                lang.code === languages[languages.length - 1].code ? 'rounded-b-lg' : ''
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

