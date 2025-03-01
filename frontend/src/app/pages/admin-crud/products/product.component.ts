import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
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
import { ProductResponse, Brand, Subcategory, Category, Client } from '../../models/product.model';
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
import { LOCALE_ID } from '@angular/core';

// Registrar o locale
registerLocaleData(localePt);

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
    providers: [
        MessageService, 
        ProductService, 
        CompanyService, 
        BrandService, 
        CategoryService, 
        SubCategoryService, 
        ConfirmationService,
        { provide: LOCALE_ID, useValue: 'pt-BR' }
    ]
})
export class ProductCrud implements OnInit {
    productDialog: boolean = false;

    products = signal<ProductResponse[]>([]);

    product!: ProductResponse;

    selectedProducts!: ProductResponse[] | null;

    submitted: boolean = false;

    statuses!: any[];

    // Novas propriedades para variedades e preços
    currentVariety: string = '';
    currentPrice: number = 0;
    varietyList: Array<{variety: string, price: number, status?: string}> = [];
    selectedVarietyIndex: number = -1;

    // Getter para lista filtrada
    get filteredVarietyList() {
        return this.varietyList.filter(v => v.status !== 'deleted');
    }

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
        this.loadClients();
        this.loadCategories();

        this.statuses = [
            { label: 'ATIVO', value: 'ACTIVE' },
            { label: 'INATIVO', value: 'INACTIVE' }
        ];

        this.cols = [
            { field: 'brand.client.st_name', header: 'Cliente' },
            { field: 'brand.st_brand', header: 'Marca' },
            { field: 'subcategory.category.st_category', header: 'Categoria' },
            { field: 'subcategory.st_subcategory', header: 'Subcategoria' },
            { field: 'st_product', header: 'Produto' },
            { field: 'st_status', header: 'Status' }
        ];

        this.exportColumns = this.cols.map(col => ({ title: col.header, dataKey: col.field }));
    }

    loadProductData() {
        this.productService.getProducts().subscribe({
            next: (products) => {
                this.products.set(products);
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produtos carregados', life: 3000 });
            },
            error: (error) => {
                console.error('Erro ao carregar produtos:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar produtos', life: 3000 });
            }
        });
    }

    loadClients() {
        this.companyService.getClients().subscribe({
            next: (clients) => {
                this.clients = clients;
            },
            error: (error) => {
                console.error('Erro ao carregar clientes:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar clientes', life: 3000 });
            }
        });
    }

    loadBrands(clientId: string) {
        if (!clientId) {
            this.brands = [];
            return;
        }
        this.brandService.getBrands().subscribe({
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
            next: (categories) => {
                this.categories = categories;
            },
            error: (error) => {
                console.error('Erro ao carregar categorias:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar categorias', life: 3000 });
            }
        });
    }

    loadSubcategories(categoryId: string) {
        if (!categoryId) {
            this.subcategories = [];
            return;
        }
        this.subCategoryService.getSubCategories().subscribe({
            next: (data) => {
                this.subcategories = data.filter(sc => sc.id_category === categoryId);
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
        const clientId = event.value;
        if (clientId) {
            this.brandService.getBrands().subscribe({
                next: (brands) => {
                    this.brands = brands.filter(brand => brand.id_client === clientId);
                },
                error: (error) => {
                    console.error('Erro ao carregar marcas:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar marcas', life: 3000 });
                }
            });
        } else {
            this.brands = [];
        }
        this.product.id_brand = '';
    }

    onCategoryChange(event: any) {
        const categoryId = event.value;
        if (categoryId) {
            this.subCategoryService.getSubCategories().subscribe({
                next: (subcategories) => {
                    this.subcategories = subcategories.filter(subcategory => subcategory.id_category === categoryId);
                },
                error: (error) => {
                    console.error('Erro ao carregar subcategorias:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar subcategorias', life: 3000 });
                }
            });
        } else {
            this.subcategories = [];
        }
        this.product.id_subcategory = '';
    }

    openNew() {
        const emptyCategory: Category = {
            id_category: '',
            st_category: '',
            st_status: '',
            dt_created: '',
            st_created_by: '',
            dt_modified: '',
            st_modified_by: ''
        };

        const emptyClient: Client = {
            id: '',
            st_name: '',
            st_document: '',
            st_status: '',
            dt_created: '',
            st_created_by: '',
            dt_modified: '',
            st_modified_by: ''
        };

        const emptyBrand: Brand = {
            id_brand: '',
            id_client: '',
            st_brand: '',
            st_status: '',
            client: emptyClient,
            dt_created: '',
            st_created_by: '',
            dt_modified: '',
            st_modified_by: ''
        };

        const emptySubcategory: Subcategory = {
            id_subcategory: '',
            id_category: '',
            st_subcategory: '',
            st_status: '',
            category: emptyCategory,
            dt_created: '',
            st_created_by: '',
            dt_modified: '',
            st_modified_by: ''
        };

        this.product = {
            id_product: '',
            id_brand: '',
            id_subcategory: '',
            st_product: '',
            st_variety: '',
            st_status: 'ACTIVE',
            dt_created: new Date().toISOString(),
            st_created_by: '',
            dt_modified: '',
            st_modified_by: '',
            subcategory: emptySubcategory,
            brand: emptyBrand
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
        this.varietyList = [];
        this.currentVariety = '';
        this.currentPrice = 0;
        this.selectedVarietyIndex = -1;
    }

    editProduct(product: ProductResponse) {
        this.product = { ...product };
        
        // Carregar lista de variedades do JSON
        try {
            const parsedVarieties = product.st_variety ? JSON.parse(product.st_variety) : [];
            // Filtrar apenas variedades não deletadas ou manter o status existente
            this.varietyList = parsedVarieties.map((v: any) => ({
                ...v,
                status: v.status || 'active'
            }));
        } catch (error) {
            console.error('Erro ao parsear variedades:', error);
            this.varietyList = [];
        }
        
        // Carregar cliente e marca
        if (this.product.brand?.client) {
            this.selectedClient = this.product.brand.client.id;
            this.brandService.getBrands().subscribe({
                next: (brands) => {
                    this.brands = brands.filter(b => b.id_client === this.product.brand?.client?.id);
                },
                error: (error) => {
                    console.error('Erro ao carregar marcas:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar marcas', life: 3000 });
                }
            });
        }

        // Carregar categoria e subcategoria
        if (this.product.subcategory?.category) {
            this.selectedCategory = this.product.subcategory.category.id_category;
            this.subCategoryService.getSubCategories().subscribe({
                next: (subcategories) => {
                    this.subcategories = subcategories.filter(sc => sc.id_category === this.product.subcategory?.category?.id_category);
                },
                error: (error) => {
                    console.error('Erro ao carregar subcategorias:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar subcategorias', life: 3000 });
                }
            });
        }

        this.productDialog = true;
    }

    deleteSelectedProducts() {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir os produtos selecionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedProducts) {
                    const deleteRequests = this.selectedProducts.map(product =>
                        this.productService.deleteProduct(product.id_product)
                    );

                    forkJoin(deleteRequests).subscribe({
                        next: () => {
                            this.loadProductData();
                            this.selectedProducts = null;
                            this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produtos excluídos', life: 3000 });
                        },
                        error: (error) => {
                            console.error('Erro ao excluir produtos:', error);
                            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir produtos', life: 3000 });
                        }
                    });
                }
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
                this.productService.deleteProduct(product.id_product).subscribe({
                    next: () => {
                        this.loadProductData();
                        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto excluído', life: 3000 });
                    },
                    error: (error) => {
                        console.error('Erro ao excluir produto:', error);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao excluir produto', life: 3000 });
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

    getSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'INACTIVE':
                return 'danger';
            default:
                return 'warn';
        }
    }

    getStatusLabel(status: string): string {
        return status === 'ACTIVE' ? 'ATIVO' : 'INATIVO';
    }

    saveProduct() {
        this.submitted = true;

        if (!this.product.st_product || !this.product.st_status || 
            !this.product.id_brand || !this.product.id_subcategory) {
            return;
        }

        // Converter a lista de variedades para JSON string
        this.product.st_variety = JSON.stringify(this.varietyList);

        const productRequest: ProductRequest = {
            id_brand: this.product.id_brand,
            id_subcategory: this.product.id_subcategory,
            st_product: this.product.st_product,
            st_variety: this.product.st_variety,
            st_status: this.product.st_status
        };

        if (this.product.id_product) {
            this.productService.putProduct(this.product.id_product, productRequest).subscribe({
                next: (response) => {
                    this.loadProductData();
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto atualizado', life: 3000 });
                },
                error: (error) => {
                    console.error('Erro ao atualizar produto:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar produto', life: 3000 });
                }
            });
        } else {
            this.productService.postProduct(productRequest).subscribe({
                next: (response) => {
                    this.loadProductData();
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto criado', life: 3000 });
                },
                error: (error) => {
                    console.error('Erro ao criar produto:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao criar produto', life: 3000 });
                }
            });
        }

        this.productDialog = false;
        this.product = {} as ProductResponse;
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    // Método para adicionar ou atualizar variedade na lista
    addVariety() {
        if (this.currentVariety && this.currentPrice > 0) {
            if (this.selectedVarietyIndex > -1) {
                // Atualiza a linha existente
                this.varietyList[this.selectedVarietyIndex] = {
                    variety: this.currentVariety,
                    price: Number(this.currentPrice),
                    status: 'active'
                };
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Variedade atualizada', life: 3000 });
            } else {
                // Adiciona nova linha
                this.varietyList.push({
                    variety: this.currentVariety,
                    price: Number(this.currentPrice),
                    status: 'active'
                });
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Variedade adicionada', life: 3000 });
            }
            this.currentVariety = '';
            this.currentPrice = 0;
            this.selectedVarietyIndex = -1;
        } else {
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Preencha a variedade e o preço', life: 3000 });
        }
    }

    // Método para remover variedade da lista
    removeVariety(index: number, event: Event) {
        event.stopPropagation(); // Evita que o evento de clique da linha seja disparado
        this.varietyList[index].status = 'deleted';
        if (this.selectedVarietyIndex === index) {
            this.currentVariety = '';
            this.currentPrice = 0;
            this.selectedVarietyIndex = -1;
        }
    }

    // Método para selecionar variedade da lista
    selectVariety(variety: {variety: string, price: number, status?: string}, index: number) {
        if (variety.status !== 'deleted') {
            this.currentVariety = variety.variety;
            this.currentPrice = variety.price;
            this.selectedVarietyIndex = index;
            this.messageService.add({ severity: 'info', summary: 'Selecionado', detail: 'Variedade selecionada para edição', life: 3000 });
        }
    }
}
