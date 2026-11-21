"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-3">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Theme</legend>
        {THEMES.map((option) => {
          const Icon = option.icon;

          return (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-[2px] border border-border px-3 py-2 text-sm text-muted-foreground transition-colors select-none hover:bg-muted/40 hover:text-foreground has-checked:border-highlight has-checked:bg-muted/60 has-checked:font-medium has-checked:text-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring/40"
            >
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={mounted && theme === option.value}
                onChange={() => setTheme(option.value)}
                className="sr-only"
              />
              <Icon aria-hidden="true" className="size-3.5" />
              {option.label}
            </label>
          );
        })}
      </fieldset>

      <p className="text-xs leading-5 text-muted-foreground">
        System follows the light or dark setting on your device.
      </p>
    </div>
  );
}
