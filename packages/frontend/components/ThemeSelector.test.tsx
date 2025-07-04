import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { ThemeSelector } from './ThemeSelector';
import * as themeHook from '../hooks/useTheme';

vi.mock('../hooks/useTheme', () => ({
  useTheme: vi.fn(),
}));

describe('ThemeSelector Component', () => {
  const setTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (themeHook.useTheme as unknown as vi.Mock).mockReturnValue({
      currentTheme: 'light',
      setTheme,
      availableThemes: [
        { value: 'light', label: 'Light', description: '' },
        { value: 'dark', label: 'Dark', description: '' },
      ],
    });
  });

  it('switches theme on button click', () => {
    render(<ThemeSelector />);
    fireEvent.click(screen.getByText('Dark'));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });
});
