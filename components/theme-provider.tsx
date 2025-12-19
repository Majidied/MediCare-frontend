"use client"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"
import { useTheme as useNextTheme } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" enableSystem={false} disableTransitionOnChange={false} {...props}>
      {children}
    </NextThemesProvider>
  )
}

export { useNextTheme as useTheme }
