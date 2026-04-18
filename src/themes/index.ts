import type { Theme } from '@/types/presentation';

export const THEMES: Theme[] = [
  {
    id: 'editorial-ink',
    name: 'Editorial Ink',
    colors: { primary: '#0f172a', accent: '#b45309', bg: '#f5efe6', text: '#16110d', subtext: '#6b5f55' },
    fonts: { heading: 'Fraunces, serif', body: 'Manrope, sans-serif' },
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    colors: { primary: '#5146E5', bg: '#1a1a2e', text: '#ffffff', subtext: '#b0b0c8' },
    fonts: { heading: 'Outfit, sans-serif', body: 'Outfit, sans-serif' },
  },
  {
    id: 'clean-light',
    name: 'Clean Light',
    colors: { primary: '#2563eb', bg: '#ffffff', text: '#1f2937', subtext: '#6b7280' },
    fonts: { heading: 'Outfit, sans-serif', body: 'Outfit, sans-serif' },
  },
  {
    id: 'nature',
    name: 'Nature',
    colors: { primary: '#059669', bg: '#ecfdf5', text: '#064e3b', subtext: '#065f46' },
    fonts: { heading: 'Outfit, sans-serif', body: 'Outfit, sans-serif' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: { primary: '#f59e0b', bg: '#fffbeb', text: '#78350f', subtext: '#92400e' },
    fonts: { heading: 'Outfit, sans-serif', body: 'Outfit, sans-serif' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: { primary: '#8b5cf6', bg: '#0f0f1a', text: '#e2e8f0', subtext: '#94a3b8' },
    fonts: { heading: 'Outfit, sans-serif', body: 'Outfit, sans-serif' },
  },
];

export const DEFAULT_THEME = THEMES.find((theme) => theme.id === 'editorial-ink') || THEMES[0];

export const getThemeById = (id: string): Theme =>
  THEMES.find((t) => t.id === id) || DEFAULT_THEME;
