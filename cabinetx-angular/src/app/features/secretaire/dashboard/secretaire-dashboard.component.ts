import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-secretaire-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <mat-card class="glass-panel neon-border">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-[var(--color-muted-foreground)]">RDV du jour</div>
            <div class="text-2xl font-semibold">22</div>
          </div>
          <mat-icon class="text-[var(--color-primary)]">event_available</mat-icon>
        </div>
      </mat-card>
      <mat-card class="glass-panel neon-border">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-[var(--color-muted-foreground)]">Patients en attente</div>
            <div class="text-2xl font-semibold">8</div>
          </div>
          <mat-icon class="text-[var(--color-primary)]">schedule</mat-icon>
        </div>
      </mat-card>
      <mat-card class="glass-panel neon-border">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-[var(--color-muted-foreground)]">RDV à confirmer</div>
            <div class="text-2xl font-semibold">5</div>
          </div>
          <mat-icon class="text-[var(--color-primary)]">pending_actions</mat-icon>
        </div>
      </mat-card>
      <mat-card class="glass-panel neon-border">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-[var(--color-muted-foreground)]">Factures en attente</div>
            <div class="text-2xl font-semibold">3</div>
          </div>
          <mat-icon class="text-[var(--color-primary)]">receipt_long</mat-icon>
        </div>
      </mat-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretaireDashboardComponent {}
