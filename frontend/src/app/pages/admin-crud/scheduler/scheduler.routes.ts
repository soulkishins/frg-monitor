import { Routes } from '@angular/router';

export default [
    { path: '', redirectTo: 'lista', pathMatch: 'full' },
    { path: 'lista', loadComponent: () => import('./list/scheduler-list.component').then(c => c.SchedulerList) },
    { path: 'detalhe/:id', loadComponent: () => import('./detail/scheduler-view.component').then(c => c.SchedulerView) }
] as Routes;
