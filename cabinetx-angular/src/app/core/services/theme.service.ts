import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const THEME_KEY = 'cabinetx_theme';

type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly themeSubject = new BehaviorSubject<ThemeMode>(this.loadInitialTheme());
  readonly theme$ = this.themeSubject.asObservable();

  toggle(): void {
    const next = this.themeSubject.value === 'light' ? 'dark' : 'light';
    this.applyTheme(next);
  }

  private loadInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const initial = stored ?? 'light';
    this.applyTheme(initial);
    return initial;
  }

  private applyTheme(theme: ThemeMode): void {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
    this.themeSubject.next(theme);
  }
}
