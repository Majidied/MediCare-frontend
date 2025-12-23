import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    ThemeToggleComponent,
  ],
  template: `
    <mat-sidenav-container class="min-h-screen">
      <mat-sidenav mode="side" opened class="w-64 glass-panel text-[var(--color-foreground)]">
        <div class="p-4 flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold shadow-lg">
            CX
          </div>
          <div>
            <div class="font-semibold">CabinetX</div>
            <div class="text-sm text-[var(--color-muted-foreground)]">Système Médical</div>
          </div>
        </div>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard/admin" *ngIf="role() === 'admin'">Dashboard Admin</a>
          <a mat-list-item routerLink="/dashboard/medecin" *ngIf="role() === 'medecin'">Dashboard Médecin</a>
          <a mat-list-item routerLink="/dashboard/secretaire" *ngIf="role() === 'secretaire'">Dashboard Secrétaire</a>
        </mat-nav-list>
        <div class="mt-auto p-4 text-sm text-[var(--color-muted-foreground)]">
          Connecté en tant que <span class="font-semibold">{{ role() }}</span>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="min-h-screen bg-transparent">
        <mat-toolbar class="glass-panel mx-4 my-3 rounded-xl px-4 text-[var(--color-foreground)]">
          <div class="flex items-center gap-2">
            <mat-icon class="text-[var(--color-primary)]">health_and_safety</mat-icon>
            <span class="font-semibold">CabinetX</span>
          </div>
          <span class="flex-1"></span>
          <button
            mat-icon-button
            [matBadge]="notifCount()"
            matBadgeColor="warn"
            matBadgeHidden="notifCount() === 0"
            aria-label="Notifications"
          >
            <mat-icon>notifications</mat-icon>
          </button>
          <app-theme-toggle class="ml-2"></app-theme-toggle>
          <button mat-button [matMenuTriggerFor]="menu" class="ml-2">
            {{ userName() }}
            <mat-icon>expand_more</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Déconnexion</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <main class="p-4">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      mat-sidenav-container { background: transparent; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationsService);

  private readonly patientBadge = toSignal(this.notifications.unreadPatientCount$, {
    initialValue: 0,
  });

  private readonly billingBadge = toSignal(this.notifications.unreadBillingCount$, {
    initialValue: 0,
  });

  readonly userName = computed(() => this.auth.currentUserSnapshot?.name ?? '');
  readonly role = computed(() => this.auth.currentUserSnapshot?.role ?? '');
  readonly notifCount = computed(() =>
    this.role() === 'medecin'
      ? this.patientBadge()
      : this.role() === 'secretaire'
        ? this.billingBadge()
        : 0
  );

  logout(): void {
    this.auth.logout();
  }
}
