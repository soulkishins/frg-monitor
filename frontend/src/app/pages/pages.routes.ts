import { Routes } from '@angular/router';
import { Documentation } from './old/documentation/documentation';
import { Crud } from './old/crud/crud';
import { Empty } from './old/empty/empty';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'empty', component: Empty },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
