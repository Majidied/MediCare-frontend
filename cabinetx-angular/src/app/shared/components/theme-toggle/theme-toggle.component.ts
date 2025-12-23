import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe, NgClass } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, AsyncPipe, NgClass],
  template: `
    <button mat-icon-button (click)="theme.toggle()" [ngClass]="'neon-border'" aria-label="Basculer le thème">
      <mat-icon class="text-[var(--color-foreground)]" aria-hidden="true">
        {{ (theme.theme$ | async) === 'light' ? 'dark_mode' : 'light_mode' }}
      </mat-icon>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  constructor(readonly theme: ThemeService) {}
}
