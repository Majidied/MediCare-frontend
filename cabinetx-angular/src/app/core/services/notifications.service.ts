import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { BillingNotification, PatientNotification } from '../models/notification.model';
import { MockDataService } from './mock-data.service';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly mockData = inject(MockDataService);

  private readonly patientNotificationsSubject = new BehaviorSubject<PatientNotification[]>(
    this.mockData.getPatientNotifications()
  );
  readonly patientNotifications$ = this.patientNotificationsSubject.asObservable();

  private readonly billingNotificationsSubject = new BehaviorSubject<BillingNotification[]>(
    this.mockData.getBillingNotifications()
  );
  readonly billingNotifications$ = this.billingNotificationsSubject.asObservable();

  readonly unreadPatientCount$ = this.patientNotifications$.pipe(
    map((notifications) => notifications.filter((n) => !n.isRead).length)
  );

  readonly unreadBillingCount$ = this.billingNotifications$.pipe(
    map((notifications) => notifications.filter((n) => !n.isProcessed).length)
  );

  markPatientNotificationAsRead(id: string): void {
    const updated = this.patientNotificationsSubject.value.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    this.patientNotificationsSubject.next(updated);
  }

  markBillingNotificationAsProcessed(id: string): void {
    const updated = this.billingNotificationsSubject.value.map((n) =>
      n.id === id ? { ...n, isProcessed: true, invoiceGenerated: true } : n
    );
    this.billingNotificationsSubject.next(updated);
  }
}
