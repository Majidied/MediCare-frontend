import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FloatingMedicalElementsComponent } from '../../../shared/components/floating-medical-elements/floating-medical-elements.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FloatingMedicalElementsComponent,
  ],
  template: `
    <div class="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
      <app-floating-medical-elements class="absolute inset-0 opacity-15" [count]="18"></app-floating-medical-elements>
      <div class="absolute inset-0 bg-grid-pattern opacity-12"></div>
      <div class="floating-blob absolute -left-10 top-16 h-80 w-80 rounded-full bg-[var(--color-primary)]/16 animate-pulse-slow"></div>
      <div class="floating-blob absolute right-12 bottom-16 h-72 w-72 rounded-full bg-[var(--color-accent)]/12 animate-pulse-slow animation-delay-1000"></div>

      <div class="relative z-10 w-full max-w-xl px-4">
        <div class="glass-card rounded-[26px] p-10 shadow-xl glow-primary space-y-8">
          <div class="text-center space-y-3">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/25 glow-accent">
              <svg class="w-8 h-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 class="text-4xl font-bold tracking-tight text-[var(--color-primary)]">CabinetX</h1>
            <p class="text-sm text-[var(--color-muted-foreground)]">Connectez-vous à votre espace médical</p>
          </div>

          <form class="space-y-5" [formGroup]="form" (ngSubmit)="onSubmit()">
            <label class="space-y-2 block">
              <span class="text-sm font-medium">Email</span>
              <input
                type="email"
                formControlName="email"
                placeholder="medecin@cabinetx.com"
                class="w-full rounded-xl border border-[var(--color-border)]/80 bg-white/60 px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition"
                required
              />
            </label>

            <label class="space-y-2 block">
              <span class="text-sm font-medium">Mot de passe</span>
              <input
                type="password"
                formControlName="password"
                placeholder="••••••••"
                class="w-full rounded-xl border border-[var(--color-border)]/80 bg-white/60 px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition"
                required
              />
            </label>

            <div class="min-h-[20px] text-sm text-[var(--color-error)]" *ngIf="error">{{ error }}</div>

            <button
              type="submit"
              class="w-full rounded-xl bg-[var(--color-primary)] text-white font-semibold py-3 shadow-lg shadow-[var(--color-primary)]/35 hover:shadow-[var(--color-primary)]/50 hover:-translate-y-[1px] transition disabled:opacity-60 disabled:cursor-not-allowed"
              [disabled]="form.invalid"
            >
              Se connecter
            </button>
          </form>

          <div class="text-center text-sm text-[var(--color-muted-foreground)] space-y-1">
            <div class="font-semibold text-[var(--color-foreground)]">Comptes de démonstration:</div>
            <div>Médecin: medecin@cabinetx.com / medecin123</div>
            <div>Secrétaire: secretaire@cabinetx.com / secretaire123</div>
            <div>Admin: admin@cabinetx.com / admin123</div>
          </div>
        </div>

        <p class="text-center text-xs text-[var(--color-muted-foreground)] mt-6">CabinetX - Gestion médicale du futur</p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  error: string | null = null;

  onSubmit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.value;
    if (!email || !password) return;

    this.auth.login(email, password).subscribe({
      next: (user) => {
        this.error = null;
        this.router.navigate(['/dashboard', user.role]);
      },
      error: (err) => {
        this.error = err?.message ?? 'Impossible de se connecter';
      },
    });
  }
}
