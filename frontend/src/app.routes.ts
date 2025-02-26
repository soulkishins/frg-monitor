import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { canActivateGuard, canMatchGuard } from './app/pages/service/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard, canActivate: [canActivateGuard] },
            { path: 'cadastro', loadChildren: () => import('./app/pages/admin-crud/admin-crud.routes') },
            { path: 'monitoramento', loadChildren: () => import('./app/pages/monitor/monitor-crud.routes') },
            { path: 'uikit', loadChildren: () => import('./app/pages/old/uikit/uikit.routes') },
            { path: 'pages', loadChildren: () => import('./app/pages/old/pages.routes') }
        ]
    },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
