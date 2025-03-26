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
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../service/product.service';
import { ProductResponse} from '../../../models/product.model';
import { CompanyService } from '../../../service/company.service';
import { BrandService } from '../../../service/brand.service';
import { CompanyResponse } from '../../../models/company.model';
import { BrandResponse } from '../../../models/brand.model';
import { CategoryService } from '../../../service/category.service';
import { SubCategoryService } from '../../../service/sub-category.service';
import { CategoryResponse } from '../../../models/category.model';
import { SubCategoryResponse } from '../../../models/sub-category.model';
import { forkJoin } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { ProductRequest } from '../../../models/product.model';
import { Column, ExportColumn } from '../../../models/global.model';
import { LOCALE_ID } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

// Registrar o locale
registerLocaleData(localePt);

@Component({
    selector: 'app-product-view',
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
    templateUrl: './product-view.component.html',
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
export class ProductView implements OnInit {
    productDialog: boolean = false;
    isEditing: boolean = false;

    products = signal<ProductResponse[]>([]);

    product!: ProductResponse;

    selectedProducts!: ProductResponse[] | null;

    submitted: boolean = false;

    statuses!: any[];

    // Novas propriedades para variedades e preços
    currentVariety: string = '';
    currentPrice: number = 0;
    varietyList: Array<{seq: number, variety?: string, price?: number, status?: string}> = [];
    selectedVarietyIndex: number = -1;

    // Getter para lista filtrada
    get filteredVarietyList() {
        return this.varietyList.filter(v => v.status !== 'deleted');
    }

    clients: CompanyResponse[] = [];
    filteredClients: CompanyResponse[] = [];
    brands: BrandResponse[] = [];
    filteredBrands: BrandResponse[] = [];
    categories: CategoryResponse[] = [];
    subcategories: SubCategoryResponse[] = [];

    selectedClient: string = '';
    selectedBrand: string = '';
    selectedCategory: string = '';

    loading: boolean = false;
    loadingBrands: boolean = false;

    page: {
        total: number;
        limit: number;
        offset: number;
        sort?: string;
    } = {total: 0, limit: 50, offset: 0, sort: 'st_name'};

    private searchSubject = new Subject<string>();
    private searchBrandSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

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
        private confirmationService: ConfirmationService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadClients();
        this.loadCategories();

        this.statuses = [
            { label: 'Ativo', value: 'ACTIVE' },
            { label: 'Inativo', value: 'INACTIVE' }
        ];

        this.loadProductData();

        this.cols = [
            { field: 'brand.client.st_name', header: 'Cliente' },
            { field: 'brand.st_brand', header: 'Marca' },
            { field: 'subcategory.category.st_category', header: 'Categoria' },
            { field: 'subcategory.st_subcategory', header: 'Subcategoria' },
            { field: 'st_product', header: 'Produto' },
            { field: 'st_status', header: 'Status' }
        ];

        this.exportColumns = this.cols.map(col => ({ title: col.header, dataKey: col.field }));

        // Configurar o debounce para busca de clientes
        this.searchSubject.pipe(
            takeUntil(this.destroy$),
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(query => {
                this.loading = true;
                return this.companyService.getClients({ 
                    "st_name": query, 
                    "page.limit": this.page.limit, 
                    "page.sort": "st_name.asc" 
                });
            })
        ).subscribe({
            next: (companies) => {
                this.filteredClients = companies.list;
                this.loading = false;
            },
            error: (error) => {
                console.error('Erro ao buscar clientes:', error);
                this.loading = false;
            }
        });

        // Configurar o debounce para busca de marcas
        this.searchBrandSubject.pipe(
            takeUntil(this.destroy$),
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(query => {
                this.loadingBrands = true;
                const clientName = this.clients.find(c => c.id === this.selectedClient)?.st_name || '';
                return this.brandService.getBrands({ 
                    "st_brand": query, 
                    "page.limit": this.page.limit, 
                    "page.sort": "st_brand.asc",
                    "st_client_name": clientName
                });
            })
        ).subscribe({
            next: (brands) => {
                this.filteredBrands = brands.list;
                this.loadingBrands = false;
            },
            error: (error) => {
                console.error('Erro ao buscar marcas:', error);
                this.loadingBrands = false;
            }
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadClients() {
        this.loading = true;
        this.companyService.getClients({"page.limit": this.page.limit,"page.sort": "st_name.asc"}).subscribe({
            next: (clients) => {
                this.clients = clients.list;
                this.filteredClients = [...this.clients];
                this.loading = false;
            },
            error: (error) => {
                console.error('Erro ao carregar clientes:', error);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar clientes', life: 3000 });
                this.loading = false;
            }
        });
    }

    filterClients(event: any) {
        const query = event.filter.toLowerCase();
        this.searchSubject.next(query);
    }

    filterBrands(event: any) {
        const query = event.filter.toLowerCase();
        this.searchBrandSubject.next(query);
    }

    loadBrands(clientId: string) {
        if (!clientId) {
            this.brands = [];
            return;
        }
        const clientName = this.clients.find(c => c.id === clientId)?.st_name || '';
        if (clientName) {
            this.brandService.getBrands({
                "page.limit": this.page.limit,
                "page.sort": "st_brand.asc",
                "st_client_name": clientName
            }).subscribe({
                next: (data) => {
                    this.brands = data.list;
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
    }

    loadCategories() {
        this.categoryService.getCategories().subscribe({
            next: (categories) => {
                this.categories = categories.list;
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
                this.subcategories = data.list.filter(sc => sc.id_category === categoryId);
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
        this.selectedClient = clientId;
        this.product.id_brand = '';
        this.filteredBrands = [];
        
        if (clientId) {
            const clientName = this.clients.find(c => c.id === clientId)?.st_name || '';
            if (clientName) {
                this.brandService.getBrands({
                    "page.limit": this.page.limit,
                    "page.sort": "st_brand.asc",
                    "st_client_name": clientName
                }).subscribe({
                    next: (brands) => {
                        this.brands = brands.list;
                        this.filteredBrands = [...this.brands];
                    },
                    error: (error) => {
                        console.error('Erro ao carregar marcas:', error);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar marcas', life: 3000 });
                    }
                });
            }
        } else {
            this.brands = [];
        }
    }

    onCategoryChange(event: any) {
        const categoryId = event.value;
        if (categoryId) {
            this.subCategoryService.getSubCategories().subscribe({
                next: (subcategories) => {
                    this.subcategories = subcategories.list.filter(subcategory => subcategory.id_category === categoryId);
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
        this.product = {} as ProductResponse;
        this.submitted = false;
        this.productDialog = true;
        this.isEditing = false;
        this.varietyList = [];
        this.selectedVarietyIndex = -1;
        this.currentVariety = '';
        this.currentPrice = 0;
        this.selectedClient = '';
        this.selectedCategory = '';
    }

    editProduct(product: ProductResponse) {
        this.product = { ...product };
        this.productDialog = true;
        this.isEditing = true;
        
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
            const clientName = this.product.brand.client.st_name || '';
            if (clientName) {
                this.brandService.getBrands({
                    "page.limit": this.page.limit,
                    "page.sort": "st_brand.asc",
                    "st_client_name": clientName
                }).subscribe({
                    next: (brands) => {
                        this.brands = brands.list;
                        this.filteredBrands = [...this.brands];
                    },
                    error: (error) => {
                        console.error('Erro ao carregar marcas:', error);
                        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar marcas', life: 3000 });
                    }
                });
            }
        }

        // Carregar categoria e subcategoria
        if (this.product.subcategory?.category) {
            this.selectedCategory = this.product.subcategory.category.id_category;
            this.subCategoryService.getSubCategories().subscribe({
                next: (subcategories) => {
                    // this.subcategories = subcategories.filter(sc => sc.id_category === this.product.subcategory?.category?.id_category);
                },
                error: (error) => {
                    console.error('Erro ao carregar subcategorias:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar subcategorias', life: 3000 });
                }
            });
        }
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

    goBack() {
        this.router.navigate(['/cadastro/produto/lista']);
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

        if (!this.product.st_product || !this.product.st_status || 
            !this.product.id_brand || !this.product.id_subcategory) {
            return;
        }

        // Validar variedades existentes
        let existingVarieties: any[] = [];
        try {
            existingVarieties = this.product.st_variety ? JSON.parse(this.product.st_variety) : [];
        } catch (error) {
            console.error('Erro ao parsear variedades existentes:', error);
            existingVarieties = [];
        }

        // Marcar como deletadas as variedades que não estão mais na lista
        existingVarieties.forEach(existingVariety => {
            const stillExists = this.varietyList.some(v => 
                v.variety === existingVariety.variety && 
                v.price === existingVariety.price
            );
            if (!stillExists) {
                existingVariety.status = 'deleted';
            }
        });

        // Adicionar novas variedades à lista existente
        this.varietyList.forEach(newVariety => {
            const exists = existingVarieties.some(v => 
                v.variety === newVariety.variety && 
                v.price === newVariety.price
            );
            if (!exists) {
                existingVarieties.push(newVariety);
            }
        });

        // Converter a lista de variedades para JSON string
        this.product.st_variety = JSON.stringify(existingVarieties);

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
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto atualizado', life: 3000 });
                    this.router.navigate(['/cadastro/produto/lista']);
                },
                error: (error) => {
                    console.error('Erro ao atualizar produto:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar produto', life: 3000 });
                }
            });
        } else {
            this.productService.postProduct(productRequest).subscribe({
                next: (response) => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto criado', life: 3000 });
                    this.router.navigate(['/cadastro/produto/lista']);
                },
                error: (error) => {
                    console.error('Erro ao criar produto:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao criar produto', life: 3000 });
                }
            });
        }
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
                    seq: this.varietyList[this.selectedVarietyIndex].seq,
                    variety: this.currentVariety,
                    price: Number(this.currentPrice),
                    status: 'active'
                };
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Variedade atualizada', life: 3000 });
            } else {
                // Adiciona nova linha
                this.varietyList.push({
                    seq: this.varietyList.length + 1,
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
        this.varietyList.splice(index, 1);
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

    loadProductData() {
        const productId = this.route.snapshot.params['id'];
        if (productId && productId !== 'novo') {
            this.isEditing = true;
            this.productService.getProduct(productId).subscribe({
                next: (response) => {
                    this.product = response;
                    
                    // Carregar lista de variedades do JSON
                    try {
                        const parsedVarieties = response.st_variety ? JSON.parse(response.st_variety) : [];
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
                        // Filtrar o combo de clientes com base no nome do cliente
                        if (this.product.brand.client.st_name) {
                            this.filterClients({ filter: this.product.brand.client.st_name });
                        }
                        this.loadBrands(this.selectedClient);
                    }

                    // Carregar categoria e subcategoria
                    if (this.product.subcategory?.category) {
                        this.selectedCategory = this.product.subcategory.category.id_category;
                        this.loadSubcategories(this.selectedCategory);
                    }
                    
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto carregado', life: 3000 });
                },
                error: (error) => {
                    console.error('Erro ao carregar produto:', error);
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar produto', life: 3000 });
                    this.router.navigate(['../'], { relativeTo: this.route });
                }
            });
        } else {
            // Inicializa um novo produto
            this.isEditing = false;
            this.product = {} as ProductResponse;
            this.product.st_status = 'ACTIVE';
            this.varietyList = [];
        }
    }
}
