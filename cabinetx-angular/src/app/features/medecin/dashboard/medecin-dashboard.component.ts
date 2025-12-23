import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-medecin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <mat-card class="glass-panel neon-border">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-[var(--color-muted-foreground)]">Consultations du jour</div>
            <div class="text-2xl font-semibold">14</div>
          </div>
          <mat-icon class="text-[var(--color-primary)]">monitor_heart</mat-icon>
        </div>
      </mat-card>
      <mat-card class="glass-panel neon-border">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-[var(--color-muted-foreground)]">Patients actifs</div>
            <div class="text-2xl font-semibold">58</div>
          </div>
          <mat-icon class="text-[var(--color-primary)]">groups</mat-icon>
        </div>
      </mat-card>
      <mat-card class="glass-panel neon-border">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-[var(--color-muted-foreground)]">RDV aujourd'hui</div>
            <div class="text-2xl font-semibold">11</div>
          </div>
          <mat-icon class="text-[var(--color-primary)]">schedule</mat-icon>
        </div>
      </mat-card>
      <mat-card class="glass-panel neon-border">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-[var(--color-muted-foreground)]">Ordonnances</div>
            <div class="text-2xl font-semibold">7</div>
          </div>
          <mat-icon class="text-[var(--color-primary)]">description</mat-icon>
        </div>
      </mat-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedecinDashboardComponent {}
