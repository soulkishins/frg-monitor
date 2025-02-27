import { Routes } from '@angular/router';

export default [
    { path: 'lista', loadComponent: () => import('./list/advertisement-list.component').then(c => c.AdvertisementList) },
    { path: 'detalhe/:id', loadComponent: () => import('./detail/advertisement-view.component').then(c => c.AdvertisementDetail) },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
