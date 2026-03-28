import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  const cycleMode = () => {
    const next = mode === 'auto' ? 'light' : mode === 'light' ? 'dark' : 'auto';
    setMode(next);
  };

  const icon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor;
  const Icon = icon;
  const label = mode === 'auto' ? 'Auto' : mode === 'light' ? 'Licht' : 'Donker';

  return (
    <button
      onClick={cycleMode}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
      style={{ fontSize: '13px', fontWeight: 500 }}
      title={`Thema: ${label}`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}
