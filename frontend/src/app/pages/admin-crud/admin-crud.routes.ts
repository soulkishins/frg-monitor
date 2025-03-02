import { Routes } from '@angular/router';
import { canMatchGuard } from '../service/auth.guard';

export default [
    { path: 'categoria', loadChildren: () => import('./category/category.routes'), canMatch: [canMatchGuard] },
    { path: 'subcategoria', loadChildren: () => import('./subcategory/subcategory.routes'), canMatch: [canMatchGuard] },
    { path: 'cliente', loadChildren: () => import('./company/company.routes'), canMatch: [canMatchGuard] },
    { path: 'marca', loadChildren: () => import('./brand/brand.routes'), canMatch: [canMatchGuard] },
    { path: 'produto', loadChildren: () => import('./products/product.routes'), canMatch: [canMatchGuard] },
    { path: 'usuario', loadComponent: () => import('./users/user.component').then(c => c.UserCrud), canMatch: [canMatchGuard] },
    { path: 'palavra-chave', loadChildren: () => import('./palavra-chave/keyword.routes'), canMatch: [canMatchGuard] },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
