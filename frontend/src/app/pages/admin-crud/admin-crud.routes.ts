import { Routes } from '@angular/router';
import { Crud } from '../old/crud/crud';
import { CategoryCrud } from './category/category.component';
import { CompanyCrud } from './company/company.component';
import { ProductCrud } from './products/product.component';
import { SubCategoryCrud } from './subcategory/subcategory.component';
import { UserCrud } from './users/user.component';
import { BrandCrud } from './brand/brand.component';

export default [
    { path: 'categoria', component: CategoryCrud },
    { path: 'subcategoria', component: SubCategoryCrud },
    { path: 'cliente', component: CompanyCrud },
    { path: 'marca', component: BrandCrud },
    { path: 'produto', component: ProductCrud },
    { path: 'usuario', component: UserCrud },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
