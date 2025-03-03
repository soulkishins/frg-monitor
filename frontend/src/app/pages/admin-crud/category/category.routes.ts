import { Routes } from '@angular/router';

export default [
    { path: '', redirectTo: 'lista', pathMatch: 'full' },
    { path: 'lista', loadComponent: () => import('./list/category-list.component').then(c => c.CategoryList) },
    { path: 'detalhe/:id', loadComponent: () => import('./detail/category-view.component').then(c => c.CategoryView) }
] as Routes;
