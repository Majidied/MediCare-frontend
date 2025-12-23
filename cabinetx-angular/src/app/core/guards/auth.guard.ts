import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {
    const requiredRole = route.data['role'] as string | undefined;

    return this.auth.isLoading$.pipe(
      filter((loading) => !loading),
      take(1),
      switchMap(() => this.auth.currentUser$),
      map((user) => {
        if (!user) {
          this.router.navigate(['/']);
          return false;
        }

        if (requiredRole && user.role !== requiredRole) {
          this.router.navigate([`/dashboard/${user.role}`]);
          return false;
        }

        return true;
      })
    );
  }
}
