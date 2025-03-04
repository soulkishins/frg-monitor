import { Routes } from '@angular/router';

export default [
    { path: '', redirectTo: 'lista', pathMatch: 'full' },
    { path: 'lista', loadComponent: () => import('./list/keyword-list.component').then(c => c.KeywordList) },
    { path: 'detalhe/:id', loadComponent: () => import('./detail/keyword-view.component').then(c => c.KeywordView) }
] as Routes;
