import { Routes } from '@angular/router';
import { Crud } from '../old/crud/crud';

export default [
    { path: 'anuncio', component: Crud },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
