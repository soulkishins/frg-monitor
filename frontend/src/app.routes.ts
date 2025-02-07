import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/old/documentation/documentation';
import { Landing } from './app/pages/old/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard },
            { path: 'cadastro', loadChildren: () => import('./app/pages/admin-crud/admin-crud.routes') },
            { path: 'monitoramento', loadChildren: () => import('./app/pages/monitor/monitor-crud.routes') },
            { path: 'uikit', loadChildren: () => import('./app/pages/old/uikit/uikit.routes') },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
