import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Theme utility classes
export const themeClasses = {
  bg: {
    primary: 'bg-gray-900 dark:bg-gray-900 bg-white',
    secondary: 'bg-gray-800 dark:bg-gray-800 bg-gray-100',
    container: 'bg-gray-950 dark:bg-gray-950 bg-gray-50',
  },
  text: {
    primary: 'text-white dark:text-white text-gray-900',
    secondary: 'text-gray-300 dark:text-gray-300 text-gray-700',
    muted: 'text-gray-400 dark:text-gray-400 text-gray-600',
  },
  border: {
    default: 'border-gray-800 dark:border-gray-800 border-gray-200',
    input: 'border-gray-700 dark:border-gray-700 border-gray-300',
  },
  input: 'bg-gray-900 dark:bg-gray-900 bg-white border border-gray-700 dark:border-gray-700 border-gray-300 text-white dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 placeholder-gray-400',
};

