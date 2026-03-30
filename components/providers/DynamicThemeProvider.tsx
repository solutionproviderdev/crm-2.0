"use client"

import * as React from "react";
import { ThemeProviderProps } from "next-themes";
import { ThemeProvider } from "./theme-provider";

export function DynamicThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <ThemeProvider {...props}>{children}</ThemeProvider>;
}
