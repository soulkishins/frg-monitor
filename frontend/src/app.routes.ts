import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { canActivateGuard } from './app/pages/service/auth.guard';
import { Scrapers } from './app/pages/tools/scrapers';
import { CaptchaSolver } from './app/pages/tools/captcha-solver';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard, canActivate: [canActivateGuard] },
            { path: 'cadastro', loadChildren: () => import('./app/pages/admin-crud/admin-crud.routes') },
            { path: 'anuncio', loadChildren: () => import('./app/pages/advertisement/advertisement.routes') }
        ]
    },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    {
        path: 'tools',
        component: AppLayout,
        children: [
            { path: 'scrapers', component: Scrapers },
            { path: 'captcha-solver', component: CaptchaSolver },
            { path: '**', redirectTo: '/tools/scrapers' }
        ]
    },
    { path: '**', redirectTo: '/notfound' }
];
