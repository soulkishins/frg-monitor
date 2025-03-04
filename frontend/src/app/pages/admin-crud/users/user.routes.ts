import { Routes } from '@angular/router';

export default [
    { path: '', redirectTo: 'lista', pathMatch: 'full' },
    { path: 'lista', loadComponent: () => import('./list/user-list.component').then(c => c.UserList) },
    { path: 'detalhe/:id', loadComponent: () => import('./detail/user-view.component').then(c => c.UserView) }
] as Routes;
