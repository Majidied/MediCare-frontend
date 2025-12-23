import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { MedecinDashboardComponent } from './features/medecin/dashboard/medecin-dashboard.component';
import { SecretaireDashboardComponent } from './features/secretaire/dashboard/secretaire-dashboard.component';
import { DashboardLayoutComponent } from './shared/components/dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
	{ path: '', component: LoginComponent },
	{
		path: 'dashboard',
		component: DashboardLayoutComponent,
		canActivate: [AuthGuard],
		children: [
			{
				path: 'admin',
				component: AdminDashboardComponent,
				canActivate: [AuthGuard],
				data: { role: 'admin' },
			},
			{
				path: 'medecin',
				component: MedecinDashboardComponent,
				canActivate: [AuthGuard],
				data: { role: 'medecin' },
			},
			{
				path: 'secretaire',
				component: SecretaireDashboardComponent,
				canActivate: [AuthGuard],
				data: { role: 'secretaire' },
			},
			{ path: '', pathMatch: 'full', redirectTo: 'admin' },
		],
	},
	{ path: '**', redirectTo: '' },
];
