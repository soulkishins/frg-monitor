import { Routes } from '@angular/router';
import { canMatchGuard } from '../service/auth.guard';

export default [
    { path: 'categoria', loadComponent: () => import('./category/category.component').then(c => c.CategoryCrud), canMatch: [canMatchGuard] },
    { path: 'subcategoria', loadComponent: () => import('./subcategory/subcategory.component').then(c => c.SubCategoryCrud), canMatch: [canMatchGuard] },
    { path: 'cliente', loadComponent: () => import('./company/company.component').then(c => c.CompanyCrud), canMatch: [canMatchGuard] },
    { path: 'marca', loadComponent: () => import('./brand/brand.component').then(c => c.BrandCrud), canMatch: [canMatchGuard] },
    { path: 'produto', loadComponent: () => import('./products/product.component').then(c => c.ProductCrud), canMatch: [canMatchGuard] },
    { path: 'usuario', loadComponent: () => import('./users/user.component').then(c => c.UserCrud), canMatch: [canMatchGuard] },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
