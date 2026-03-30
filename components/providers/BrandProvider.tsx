"use client";

import * as React from "react";
import type { SiteSettings } from "@/lib/types";

interface BrandProviderProps {
  settings: SiteSettings;
  children: React.ReactNode;
}

export function BrandProvider({ settings, children }: BrandProviderProps) {
  React.useEffect(() => {
    const root = document.documentElement;
    
    // Override the CSS variables declared in globals.css :root.
    // These cascade to any component using var(--brand-primary) or
    // var(--brand-secondary), enabling per-org dynamic branding
    // without changing any Tailwind classes.
    if (settings.primary_color) {
      root.style.setProperty("--brand-primary", settings.primary_color);
      root.style.setProperty("--brand-primary-light", `${settings.primary_color}20`);
    }
    
    if (settings.secondary_color) {
      root.style.setProperty("--brand-secondary", settings.secondary_color);
    }
  }, [settings.primary_color, settings.secondary_color]);

  return <>{children}</>;
}
