import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@packing-list/state';
import { selectUserTheme } from '@packing-list/state';
import type { ThemeOption } from '@packing-list/model';

// Available daisy-ui themes
export const AVAILABLE_THEMES = [
  {
    value: 'system',
    label: 'System',
    description: 'Follow system preference',
  },
  { value: 'light', label: 'Light', description: 'Clean and bright' },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
  {
    value: 'cupcake',
    label: 'Cupcake',
    description: 'Sweet and colorful',
  },
  {
    value: 'bumblebee',
    label: 'Bumblebee',
    description: 'Bright yellow theme',
  },
  {
    value: 'emerald',
    label: 'Emerald',
    description: 'Fresh green theme',
  },
  {
    value: 'corporate',
    label: 'Corporate',
    description: 'Professional blue',
  },
  {
    value: 'synthwave',
    label: 'Synthwave',
    description: 'Retro neon vibes',
  },
  { value: 'retro', label: 'Retro', description: 'Vintage styling' },
  {
    value: 'cyberpunk',
    label: 'Cyberpunk',
    description: 'Futuristic neon',
  },
  {
    value: 'valentine',
    label: 'Valentine',
    description: 'Pink and romantic',
  },
  {
    value: 'halloween',
    label: 'Halloween',
    description: 'Spooky orange',
  },
  { value: 'garden', label: 'Garden', description: 'Natural green' },
  {
    value: 'forest',
    label: 'Forest',
    description: 'Deep forest green',
  },
  { value: 'aqua', label: 'Aqua', description: 'Ocean blue theme' },
  { value: 'lofi', label: 'Lofi', description: 'Calm and muted' },
  { value: 'pastel', label: 'Pastel', description: 'Soft pastels' },
  {
    value: 'fantasy',
    label: 'Fantasy',
    description: 'Magical purples',
  },
  {
    value: 'wireframe',
    label: 'Wireframe',
    description: 'Minimal black & white',
  },
  { value: 'black', label: 'Black', description: 'Pure black theme' },
  {
    value: 'luxury',
    label: 'Luxury',
    description: 'Elegant gold accents',
  },
  {
    value: 'dracula',
    label: 'Dracula',
    description: 'Dark purple theme',
  },
  { value: 'cmyk', label: 'CMYK', description: 'Print colors' },
  {
    value: 'autumn',
    label: 'Autumn',
    description: 'Warm fall colors',
  },
  {
    value: 'business',
    label: 'Business',
    description: 'Professional look',
  },
  { value: 'acid', label: 'Acid', description: 'Bright lime green' },
  {
    value: 'lemonade',
    label: 'Lemonade',
    description: 'Fresh yellow',
  },
  { value: 'night', label: 'Night', description: 'Deep dark theme' },
  {
    value: 'coffee',
    label: 'Coffee',
    description: 'Warm brown tones',
  },
  { value: 'winter', label: 'Winter', description: 'Cool blue theme' },
  { value: 'dim', label: 'Dim', description: 'Dimmed dark theme' },
  { value: 'nord', label: 'Nord', description: 'Arctic inspired' },
  {
    value: 'sunset',
    label: 'Sunset',
    description: 'Warm orange sunset',
  },
] as const;

export function useTheme() {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectUserTheme);

  const setTheme = (theme: ThemeOption) => {
    console.log('🎨 [THEME] Setting theme to:', theme);
    dispatch({
      type: 'UPDATE_USER_PREFERENCES',
      payload: { theme },
    });
  };

  // Apply theme to document
  useEffect(() => {
    const applyTheme = (theme: ThemeOption) => {
      if (theme === 'system') {
        // Remove data-theme attribute to let system preference take over
        document.documentElement.removeAttribute('data-theme');
        console.log('🎨 [THEME] Applied system theme');
      } else {
        // Set specific theme
        document.documentElement.setAttribute('data-theme', theme);
        console.log('🎨 [THEME] Applied theme:', theme);
      }
    };

    applyTheme(currentTheme);
  }, [currentTheme]);

  return {
    currentTheme,
    setTheme,
    availableThemes: AVAILABLE_THEMES,
  };
}
