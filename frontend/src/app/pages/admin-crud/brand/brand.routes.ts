import { Routes } from '@angular/router';

export default [
    { path: '', redirectTo: 'lista', pathMatch: 'full' },
    { path: 'lista', loadComponent: () => import('./list/brand-list.component').then(c => c.BrandList) },
    { path: 'detalhe/:id', loadComponent: () => import('./detail/brand-view.component').then(c => c.BrandView) }
] as Routes;
