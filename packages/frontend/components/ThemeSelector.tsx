import { useTheme } from '../hooks/useTheme';
import type { ThemeOption } from '@packing-list/model';
import { Palette, Monitor, Sun, Moon } from 'lucide-react';

export function ThemeSelector() {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  const getThemeIcon = (theme: ThemeOption) => {
    switch (theme) {
      case 'system':
        return Monitor;
      case 'light':
        return Sun;
      case 'dark':
      case 'night':
      case 'black':
        return Moon;
      default:
        return Palette;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Palette className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Choose Your Theme</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {availableThemes.map((theme) => {
          const Icon = getThemeIcon(theme.value);
          const isSelected = currentTheme === theme.value;

          return (
            <button
              key={theme.value}
              onClick={() => setTheme(theme.value)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200 
                hover:scale-105 hover:shadow-lg
                ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-base-300 hover:border-primary/50'
                }
              `}
            >
              {/* Theme Preview */}
              <div
                className="mb-3 relative overflow-hidden rounded-md h-16"
                data-theme={theme.value}
              >
                <div
                  className={`h-full w-full bg-base-100 flex items-center justify-center relative`}
                >
                  <div className={`w-6 h-6 rounded-full bg-primary`} />
                  <div
                    className={`absolute top-1 left-1 w-2 h-2 rounded-full bg-base-content`}
                  />
                  <div
                    className={`absolute bottom-1 right-1 w-3 h-1 rounded bg-accent opacity-60`}
                  />
                </div>
              </div>

              {/* Theme Info */}
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{theme.label}</span>
                </div>
                <p className="text-xs text-base-content/60">
                  {theme.description}
                </p>
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-primary-content rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="alert alert-info">
        <div className="flex items-start gap-2">
          <Palette className="w-4 h-4 mt-0.5" />
          <div>
            <p className="font-medium">Theme Settings</p>
            <p className="text-sm">
              Your theme preference is automatically saved and synced across all
              your devices. The &ldquo;System&rdquo; option will follow your
              device&apos;s dark/light mode setting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
