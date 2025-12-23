import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <mat-card class="glass-panel neon-border">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-[var(--color-muted-foreground)]">Utilisateurs</div>
            <div class="text-2xl font-semibold">128</div>
          </div>
          <mat-icon class="text-[var(--color-primary)]">group</mat-icon>
        </div>
      </mat-card>
      <mat-card class="glass-panel neon-border">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-[var(--color-muted-foreground)]">Cabinets actifs</div>
            <div class="text-2xl font-semibold">12</div>
          </div>
          <mat-icon class="text-[var(--color-primary)]">business</mat-icon>
        </div>
      </mat-card>
      <mat-card class="glass-panel neon-border">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-[var(--color-muted-foreground)]">RDV du jour</div>
            <div class="text-2xl font-semibold">36</div>
          </div>
          <mat-icon class="text-[var(--color-primary)]">event</mat-icon>
        </div>
      </mat-card>
      <mat-card class="glass-panel neon-border">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-[var(--color-muted-foreground)]">Revenus mensuels</div>
            <div class="text-2xl font-semibold">€42k</div>
          </div>
          <mat-icon class="text-[var(--color-primary)]">savings</mat-icon>
        </div>
      </mat-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {}
