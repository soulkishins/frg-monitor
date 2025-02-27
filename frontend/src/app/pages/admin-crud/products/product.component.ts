import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProductService } from '../../service/product.service';
import { ProductResponse } from '../../models/product.model';
import { CompanyService } from '../../service/company.service';
import { BrandService } from '../../service/brand.service';
import { CompanyResponse } from '../../models/company.model';
import { BrandResponse } from '../../models/brand.model';
import { CategoryService } from '../../service/category.service';
import { SubCategoryService } from '../../service/sub-category.service';
import { CategoryResponse } from '../../models/category.model';
import { SubCategoryResponse } from '../../models/sub-category.model';
import { forkJoin } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { ProductRequest } from '../../models/product.model';
import { Column, ExportColumn } from '../../models/global.model';

@Component({
    selector: 'app-crud',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        RadioButtonModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule
    ],
    templateUrl: './product.component.html',
    providers: [MessageService, ProductService, CompanyService, BrandService, CategoryService, SubCategoryService, ConfirmationService]
})
export class ProductCrud implements OnInit {
    productDialog: boolean = false;

    products = signal<ProductResponse[]>([]);

    product!: ProductResponse;

    selectedProducts!: ProductResponse[] | null;

    submitted: boolean = false;

    statuses!: any[];

    clients: CompanyResponse[] = [];
    brands: BrandResponse[] = [];
    categories: CategoryResponse[] = [];
    subcategories: SubCategoryResponse[] = [];

    selectedClient: string = '';
    selectedBrand: string = '';
    selectedCategory: string = '';

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    vl_floor_price: number = 0;

    constructor(
        private productService: ProductService,
        private companyService: CompanyService,
        private brandService: BrandService,
        private categoryService: CategoryService,
        private subCategoryService: SubCategoryService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadProductData();
    }

    loadProductData() {
        this.categoryService.getCategories().pipe(
            mergeMap((categories: CategoryResponse[]) => {
                const subCategoryRequests = categories.map(category =>
                    this.subCategoryService.getSubCategories(category.id_category).pipe(
                        map(subcategories => ({ category, subcategories }))
                    )
                );
                return forkJoin(subCategoryRequests).pipe(
                    map(results => {
                        const categoryMap = new Map<string, string>();
                        const subcategoryMap = new Map<string, string>();
                        
                        results.forEach(({ category, subcategories }) => {
                            subcategories.forEach(subcategory => {
                                categoryMap.set(category.id_category, category.st_category);
                                subcategoryMap.set(subcategory.id_subcategory, subcategory.st_subcategory);
                            });
                        });
                        
                        return { categoryMap, subcategoryMap };
                    }),
                    mergeMap(({ categoryMap, subcategoryMap }) =>
                        this.companyService.getClients().pipe(
                            mergeMap((companies: CompanyResponse[]) => {
                                const brandRequests = companies.map(company =>
                                    this.brandService.getBrands(company.id).pipe(
                                        mergeMap((brands: BrandResponse[]) => {
                                            const productRequests = brands.map(brand =>
                                                this.productService.getProducts(company.id, brand.id_brand).pipe(
                                                    map(products => products.map(product => ({
                                                        ...product,
                                                        st_client: company.st_name,
                                                        st_brand: brand.st_brand,
                                                        st_category: categoryMap.get(product.id_subcategory.split('-')[0]) || '',
                                                        st_subcategory: subcategoryMap.get(product.id_subcategory) || ''
                                                    })))
                                                )
                                            );
                                            return forkJoin(productRequests).pipe(
                                                map(productsArrays => productsArrays.flat())
                                            );
                                        })
                                    )
                                );
                                return forkJoin(brandRequests);
                            })
                        )
                    )
                );
            })
        ).subscribe({
            next: (productsArrays) => {
                const uniqueProducts = new Map();
                productsArrays.flat().flat().forEach(product => {
                    uniqueProducts.set(product.id_product, product);
                });
                
                const allProducts = Array.from(uniqueProducts.values());
                this.products.set(allProducts);
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar produtos',
                    life: 3000
                });
                console.error('Erro ao carregar produtos:', error);
            }
        });

        this.statuses = [
            { label: 'Ativo', value: 'ACTIVE' },
            { label: 'Inativo', value: 'INACTIVE' }
        ];

        this.cols = [
            { field: 'id_product', header: 'ID' },
            { field: 'st_client', header: 'Cliente' },
            { field: 'st_brand', header: 'Marca' },
            { field: 'st_category', header: 'Categoria' },
            { field: 'st_subcategory', header: 'Subcategoria' },
            { field: 'st_product', header: 'Descrição' },
            { field: 'st_status', header: 'Status' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    loadClients() {
        this.companyService.getClients().subscribe({
            next: (data) => {
                this.clients = data;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar clientes',
                    life: 3000
                });
            }
        });
    }

    loadBrands(clientId: string) {
        if (!clientId) {
            this.brands = [];
            return;
        }
        this.brandService.getBrands(clientId).subscribe({
            next: (data) => {
                this.brands = data;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar marcas',
                    life: 3000
                });
            }
        });
    }

    loadCategories() {
        this.categoryService.getCategories().subscribe({
            next: (data) => {
                this.categories = data;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar categorias',
                    life: 3000
                });
            }
        });
    }

    loadSubcategories(categoryId: string) {
        if (!categoryId) {
            this.subcategories = [];
            return;
        }
        this.subCategoryService.getSubCategories(categoryId).subscribe({
            next: (data) => {
                this.subcategories = data;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar subcategorias',
                    life: 3000
                });
            }
        });
    }

    onClientChange(event: any) {
        this.selectedClient = event.value;
        this.loadBrands(event.value);
        this.selectedBrand = '';
        this.product.id_brand = '';
    }

    onCategoryChange(event: any) {
        this.selectedCategory = event.value;
        this.loadSubcategories(event.value);
        this.product.id_subcategory = '';
    }

    openNew() {
        this.product = {
            id_product: '',
            id_brand: '',
            id_subcategory: '',
            st_product: '',
            st_variety: '',
            st_status: 'ACTIVE',
            dt_created: new Date().toISOString(),
            st_created_by: '',
            dt_modified: null,
            st_modified_by: null
        };
        this.selectedClient = '';
        this.selectedBrand = '';
        this.selectedCategory = '';
        this.brands = [];
        this.subcategories = [];
        this.loadClients();
        this.loadCategories();
        this.submitted = false;
        this.productDialog = true;
    }

    editProduct(product: ProductResponse) {
        this.product = { ...product };
        
        // Carregar clientes e selecionar o cliente atual
        this.companyService.getClients().subscribe({
            next: (clients) => {
                this.clients = clients;
                const client = clients.find(c => c.st_name === product.st_client);
                if (client) {
                    this.selectedClient = client.id;
                    
                    // Carregar marcas do cliente selecionado
                    this.brandService.getBrands(client.id).subscribe({
                        next: (brands) => {
                            this.brands = brands;
                        },
                        error: (error) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erro',
                                detail: 'Erro ao carregar marcas',
                                life: 3000
                            });
                        }
                    });
                }
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar clientes',
                    life: 3000
                });
            }
        });

        // Carregar categorias e selecionar a categoria atual
        this.categoryService.getCategories().subscribe({
            next: (categories) => {
                this.categories = categories;
                const categoryId = product.id_subcategory.split('-')[0];
                this.selectedCategory = categoryId;
                
                // Carregar subcategorias da categoria selecionada
                this.subCategoryService.getSubCategories(categoryId).subscribe({
                    next: (subcategories) => {
                        this.subcategories = subcategories;
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao carregar subcategorias',
                            life: 3000
                        });
                    }
                });
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar categorias',
                    life: 3000
                });
            }
        });

        this.vl_floor_price = 0;
        this.productDialog = true;
    }

    deleteSelectedProducts() {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir os produtos selecionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.products.set(this.products().filter((val) => !this.selectedProducts?.includes(val)));
                this.selectedProducts = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Produtos Excluídos',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.productDialog = false;
        this.submitted = false;
    }

    deleteProduct(product: ProductResponse) {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir ' + product.st_product + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // Buscar o cliente e marca do produto selecionado
                this.companyService.getClients().pipe(
                    mergeMap((companies: CompanyResponse[]) => {
                        const company = companies.find(c => c.st_name === product.st_client);
                        if (!company) {
                            throw new Error('Cliente não encontrado');
                        }
                        return this.brandService.getBrands(company.id).pipe(
                            map(brands => {
                                const brand = brands.find(b => b.st_brand === product.st_brand);
                                if (!brand) {
                                    throw new Error('Marca não encontrada');
                                }
                                return { clientId: company.id, brandId: brand.id_brand };
                            })
                        );
                    })
                ).subscribe({
                    next: ({ clientId, brandId }) => {
                        this.productService.deleteProduct(clientId, brandId, product.id_product).subscribe({
                            next: () => {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Sucesso',
                                    detail: 'Produto Excluído',
                                    life: 3000
                                });
                                this.loadProductData(); // Recarrega a lista de produtos
                            },
                            error: (error) => {
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Erro',
                                    detail: 'Erro ao excluir produto',
                                    life: 3000
                                });
                                console.error('Erro ao excluir produto:', error);
                            }
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao buscar informações do cliente/marca',
                            life: 3000
                        });
                        console.error('Erro ao buscar informações:', error);
                    }
                });
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.products().length; i++) {
            if (this.products()[i].id_product === id) {
                index = i;
                break;
            }
        }
        return index;
    }

    createId(): string {
        let id = '';
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < 5; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    getSeverity(status: string) {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'INACTIVE':
                return 'danger';
            default:
                return 'info';
        }
    }

    getStatusLabel(status: string) {
        switch (status) {
            case 'ACTIVE':
                return 'Ativo';
            case 'INACTIVE':
                return 'Inativo';
            default:
                return status;
        }
    }

    saveProduct() {
        this.submitted = true;

        if (this.product.st_product?.trim() && this.selectedClient && this.product.id_brand && 
            this.product.id_subcategory && this.product.st_variety && this.vl_floor_price !== undefined) {
            
            const productRequest: ProductRequest = {
                id_brand: this.product.id_brand,
                id_subcategory: this.product.id_subcategory,
                st_product: this.product.st_product,
                st_variety: this.product.st_variety,
                st_status: this.product.st_status
            };

            if (this.product.id_product) {
                // Atualizar produto existente
                this.productService.putProduct(this.selectedClient, this.product.id_brand, this.product.id_product, productRequest)
                    .subscribe({
                        next: (response) => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Sucesso',
                                detail: 'Produto Atualizado',
                                life: 3000
                            });
                            this.loadProductData(); // Recarrega a lista de produtos
                        },
                        error: (error) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erro',
                                detail: 'Erro ao atualizar produto',
                                life: 3000
                            });
                            console.error('Erro ao atualizar produto:', error);
                        }
                    });
            } else {
                // Criar novo produto
                this.productService.postProduct(this.selectedClient, this.product.id_brand, productRequest)
                    .subscribe({
                        next: (response) => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Sucesso',
                                detail: 'Produto Criado',
                                life: 3000
                            });
                            this.loadProductData(); // Recarrega a lista de produtos
                        },
                        error: (error) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erro',
                                detail: 'Erro ao criar produto',
                                life: 3000
                            });
                            console.error('Erro ao criar produto:', error);
                        }
                    });
            }

            this.productDialog = false;
            this.product = {
                id_product: '',
                id_brand: '',
                id_subcategory: '',
                st_product: '',
                st_variety: '',
                st_status: '',
                dt_created: new Date().toISOString(),
                st_created_by: '',
                dt_modified: null,
                st_modified_by: null
            };
            this.vl_floor_price = 0;
        }
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }
}
