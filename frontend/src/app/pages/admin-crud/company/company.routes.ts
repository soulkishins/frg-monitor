import { Routes } from '@angular/router';

export default [
    { path: '', redirectTo: 'lista', pathMatch: 'full' },
    { path: 'lista', loadComponent: () => import('./list/company-list.component').then(c => c.CompanyList) },
    { path: 'detalhe/:id', loadComponent: () => import('./detail/company-view.component').then(c => c.CompanyView) }
] as Routes;
