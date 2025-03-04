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
import { Router } from '@angular/router';
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
import { PanelModule } from 'primeng/panel';
import { IftaLabelModule } from 'primeng/iftalabel';
import { FluidModule } from 'primeng/fluid';
import { TooltipModule } from 'primeng/tooltip';

// Registrar o locale
registerLocaleData(localePt);

@Component({
    selector: 'app-product-list',
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
        ConfirmDialogModule,
        PanelModule,
        IftaLabelModule,
        FluidModule,
        TooltipModule
    ],
    templateUrl: './product-list.component.html',
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
export class ProductList implements OnInit {
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

    filters: {[prop: string]: any} = {};
    page: {
        total: number;
        limit: number;
        offset: number;
        sort?: string;
    } = {total: 0, limit: 50, offset: 0, sort: 'st_product'};
    loading: boolean = false;

    constructor(
        private productService: ProductService,
        private companyService: CompanyService,
        private brandService: BrandService,
        private categoryService: CategoryService,
        private subCategoryService: SubCategoryService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.statuses = [
            { label: 'Ativo', value: 'ACTIVE' },
            { label: 'Inativo', value: 'INACTIVE' }
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

        this.filters['st_status'] = this.statuses[0];
    }

    loadBrands(clientId: string) {
        if (!clientId) {
            this.brands = [];
            return;
        }
        this.brandService.getBrands().subscribe({
            next: (data) => {
                this.brands = data.list.filter(b => b.id_client === clientId);
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
        if (clientId) {
            this.brandService.getBrands().subscribe({
                next: (brands) => {
                    this.brands = brands.list.filter(brand => brand.id_client === clientId);
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
        this.router.navigate(['/cadastro/produto/detalhe', 'novo']);
    }

    editProduct(product: ProductResponse) {
        this.router.navigate(['/cadastro/produto/detalhe', product.id_product]);
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
                            this.loadData();
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
                        this.loadData();
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
                    this.loadData();
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
                    this.loadData();
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

    loadData(event?: any) {
        if (!event) {
            event = {first: this.page.offset, rows: this.page.limit};
        }

        this.loading = true;
        const {st_status, ...query} = this.filters;
        if (this.filters['st_status'].value !== 'ALL')
            query['st_status'] = this.filters['st_status'].value;
        query['page.limit'] = event.rows;
        query['page.offset'] = event.first;
        query['page.sort'] = `${event.sortField || this.page.sort}${event.sortOrder !== -1 ? '.asc' : '.desc'}`;

        this.productService
            .getProducts(query)
            .subscribe({
                next: (data) => {
                    this.products.set(data.list);
                    this.page = data.page;
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Erro ao carregar produtos',
                        life: 3000
                    });
                    console.error('Erro ao carregar produtos:', error);
                },
                complete: () => {
                    this.loading = false;
                }
            });
    }

    clearFilters(dt: any) {
        this.filters = {
            st_status: this.statuses[0],
        };
        dt.reset();
    }
}
