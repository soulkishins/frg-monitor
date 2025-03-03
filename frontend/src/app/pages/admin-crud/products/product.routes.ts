import { Routes } from '@angular/router';

export default [
    { path: '', redirectTo: 'lista', pathMatch: 'full' },
    { path: 'lista', loadComponent: () => import('./list/product-list.component').then(c => c.ProductList) },
    { path: 'detalhe', loadComponent: () => import('./detail/product-view.component').then(c => c.ProductView) },
    { path: 'detalhe/:id', loadComponent: () => import('./detail/product-view.component').then(c => c.ProductView) }
] as Routes;
