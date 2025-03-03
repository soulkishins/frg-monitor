import { Routes } from '@angular/router';

export default [
    { path: '', redirectTo: 'lista', pathMatch: 'full' },
    { path: 'lista', loadComponent: () => import('./list/subcategory-list.component').then(c => c.SubCategoryList) },
    { path: 'detalhe', loadComponent: () => import('./detail/subcategory-view.component').then(c => c.SubCategoryView) },
    { path: 'detalhe/:id', loadComponent: () => import('./detail/subcategory-view.component').then(c => c.SubCategoryView) }
] as Routes;
