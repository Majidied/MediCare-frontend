import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, delay, map, of, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { MockDataService } from './mock-data.service';

const STORAGE_KEY = 'cabinetx_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private readonly isLoadingSubject = new BehaviorSubject<boolean>(true);
  readonly isLoading$ = this.isLoadingSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  login(email: string, password: string): Observable<User> {
    const user = this.mockData.getUserByCredentials(email, password);

    if (!user) {
      return throwError(() => new Error('Identifiants invalides'));
    }

    this.persistUser(user);
    return of(user).pipe(delay(300));
  }

  logout(): void {
    if (this.canUseStorage()) {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  get currentUserSnapshot(): User | null {
    return this.currentUserSubject.value;
  }

  private loadUserFromStorage(): void {
    if (!this.canUseStorage()) {
      this.isLoadingSubject.next(false);
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        this.currentUserSubject.next(parsed);
      } catch (error) {
        console.error('Unable to parse stored user', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    this.isLoadingSubject.next(false);
  }

  private persistUser(user: User): void {
    this.currentUserSubject.next(user);
    if (this.canUseStorage()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }

  private canUseStorage(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
