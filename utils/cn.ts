import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Default tailwind-merge configuration handles most cases, 
// using extend here in case we need to add custom classes later,
// but for Tailwind v4 we generally just use twMerge without modification unless specific custom scales exist.
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
