import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme, type ThemeMode } from "../../lib/theme";

const icon: Record<ThemeMode, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
};

const label: Record<ThemeMode, string> = {
  light: "ライト",
  dark: "ダーク",
  system: "自動",
};

const next: Record<ThemeMode, ThemeMode> = {
  light: "dark",
  dark: "system",
  system: "light",
};

export const ThemeToggle = () => {
  const { mode, setMode } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setMode(next[mode])}
      className="btn-icon"
      title={`テーマ：${label[mode]}（クリックで切替）`}
      aria-label={`テーマ切替（現在: ${label[mode]}）`}
    >
      {icon[mode]}
    </button>
  );
};
