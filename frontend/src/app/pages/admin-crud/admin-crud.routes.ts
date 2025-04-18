import { Routes } from '@angular/router';
import { canMatchGuard } from '../service/auth.guard';
import { Profile } from './profile/profile.component';

export default [
    { path: 'categoria', loadChildren: () => import('./category/category.routes'), canMatch: [canMatchGuard] },
    { path: 'subcategoria', loadChildren: () => import('./subcategory/subcategory.routes'), canMatch: [canMatchGuard] },
    { path: 'cliente', loadChildren: () => import('./company/company.routes'), canMatch: [canMatchGuard] },
    { path: 'marca', loadChildren: () => import('./brand/brand.routes'), canMatch: [canMatchGuard] },
    { path: 'produto', loadChildren: () => import('./products/product.routes'), canMatch: [canMatchGuard] },
    { path: 'usuario', loadChildren: () => import('./users/user.routes'), canMatch: [canMatchGuard] },
    { path: 'palavra-chave', loadChildren: () => import('./keyword/keyword.routes'), canMatch: [canMatchGuard] },
    { path: 'agendador', loadChildren: () => import('./scheduler/scheduler.routes'), canMatch: [canMatchGuard] },
    { path: 'perfil', component: Profile, canMatch: [canMatchGuard] },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
