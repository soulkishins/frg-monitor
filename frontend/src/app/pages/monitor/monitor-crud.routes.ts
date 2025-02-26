import { Routes } from '@angular/router';

export default [
    { path: 'anuncio', loadComponent: () => import('../old/crud/crud').then(c => c.Crud) },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
