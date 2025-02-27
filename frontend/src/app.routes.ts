import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { canActivateGuard } from './app/pages/service/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard, canActivate: [canActivateGuard] },
            { path: 'cadastro', loadChildren: () => import('./app/pages/admin-crud/admin-crud.routes') },
            { path: 'anuncio', loadChildren: () => import('./app/pages/advertisement/advertisement.routes') },
            { path: 'uikit', loadChildren: () => import('./app/pages/old/uikit/uikit.routes') },
            { path: 'pages', loadChildren: () => import('./app/pages/old/pages.routes') }
        ]
    },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
