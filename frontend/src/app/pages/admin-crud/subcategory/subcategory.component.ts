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
import { Product, ProductService } from '../../service/product.service';
import { CategoryService } from '../../service/category.service';
import { CategoryResponse } from '../../../layout/models/category.model';
import { SubCategoryService } from '../../service/sub-category.service';
import { SubCategoryResponse } from '../../../layout/models/sub-category.model';
import { forkJoin } from 'rxjs';
import { SubCategoryRequest } from '../../../layout/models/sub-category.model';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

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
    templateUrl: './subcategory.component.html',
    providers: [MessageService, ProductService, ConfirmationService, CategoryService, SubCategoryService]
})
export class SubCategoryCrud implements OnInit {
    productDialog: boolean = false;
    subCategoryDialog: boolean = false;

    products = signal<Product[]>([]);
    product!: Product;
    selectedProducts!: Product[] | null;
    submitted: boolean = false;
    statuses: any[] = [
        { label: 'ATIVO', value: 'ATIVO' },
        { label: 'INATIVO', value: 'INATIVO' }
    ];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    categories = signal<CategoryResponse[]>([]);
    subCategories = signal<SubCategoryResponse[]>([]);
    selectedSubCategories!: SubCategoryResponse[] | null;

    subCategory: SubCategoryResponse = {} as SubCategoryResponse;

    constructor(
        private productService: ProductService,
        private categoryService: CategoryService,
        private subCategoryService: SubCategoryService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadSubCategoryData();
    }

    loadSubCategoryData() {
        this.categoryService.getCategories().subscribe(
            (data) => {
                this.categories.set(data);
                
                // Para cada categoria, buscar suas subcategorias
                data.forEach(category => {
                    this.subCategoryService.getSubCategories(category.id_category).subscribe(
                        (subCategories) => {
                            const currentSubCategories = this.subCategories();
                            this.subCategories.set([...currentSubCategories, ...subCategories]);
                        },
                        (error) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erro',
                                detail: `Erro ao carregar subcategorias da categoria ${category.st_category}`,
                                life: 3000
                            });
                        }
                    );
                });
            },
            (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar categorias',
                    life: 3000
                });
            }
        );

        this.cols = [
            { field: 'id_subcategory', header: 'ID' },
            { field: 'id_category', header: 'Categoria' },
            { field: 'st_subcategory', header: 'Descrição' },
            { field: 'st_status', header: 'Status' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.subCategory = {} as SubCategoryResponse;
        this.submitted = false;
        this.subCategoryDialog = true;
    }

    editProduct(product: Product) {
        this.product = { ...product };
        this.productDialog = true;
    }

    deleteSelectedProducts() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected products?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.products.set(this.products().filter((val) => !this.selectedProducts?.includes(val)));
                this.selectedProducts = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Products Deleted',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.subCategoryDialog = false;
        this.submitted = false;
    }

    deleteProduct(product: Product) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + product.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.products.set(this.products().filter((val) => val.id !== product.id));
                this.product = {};
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Product Deleted',
                    life: 3000
                });
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.products().length; i++) {
            if (this.products()[i].id === id) {
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

    getSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        switch (status) {
            case 'ATIVO':
                return 'success';
            case 'INATIVO':
                return 'danger';
            default:
                return 'info';
        }
    }

    saveProduct() {
        this.submitted = true;
        let _products = this.products();
        if (this.product.name?.trim()) {
            if (this.product.id) {
                _products[this.findIndexById(this.product.id)] = this.product;
                this.products.set([..._products]);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Product Updated',
                    life: 3000
                });
            } else {
                this.product.id = this.createId();
                this.product.image = 'product-placeholder.svg';
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Product Created',
                    life: 3000
                });
                this.products.set([..._products, this.product]);
            }

            this.productDialog = false;
            this.product = {};
        }
    }

    getCategoryName(categoryId: string): string {
        const category = this.categories().find(cat => cat.id_category === categoryId);
        return category ? category.st_category : categoryId;
    }

    editSubCategory(subCategory: SubCategoryResponse) {
        this.subCategory = { ...subCategory };
        this.subCategoryDialog = true;
    }

    deleteSubCategory(subCategory: SubCategoryResponse) {
        this.confirmationService.confirm({
            message: `Tem certeza que deseja excluir a subcategoria ${subCategory.st_subcategory}?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.subCategoryService.deleteSubCategory(subCategory.id_category, subCategory.id_subcategory).subscribe(
                    () => {
                        this.subCategories.set(this.subCategories().filter(sc => sc.id_subcategory !== subCategory.id_subcategory));
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Subcategoria excluída com sucesso',
                            life: 3000
                        });
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao excluir subcategoria',
                            life: 3000
                        });
                    }
                );
            }
        });
    }

    deleteSelectedSubCategories() {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir as subcategorias selecionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedSubCategories) {
                    const deletePromises = this.selectedSubCategories.map(subCategory =>
                        this.subCategoryService.deleteSubCategory(subCategory.id_category, subCategory.id_subcategory)
                    );

                    // Executar todas as exclusões em paralelo
                    forkJoin(deletePromises).subscribe(
                        () => {
                            this.subCategories.set(
                                this.subCategories().filter(
                                    sc => !this.selectedSubCategories?.some(
                                        selected => selected.id_subcategory === sc.id_subcategory
                                    )
                                )
                            );
                            this.selectedSubCategories = null;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Sucesso',
                                detail: 'Subcategorias excluídas com sucesso',
                                life: 3000
                            });
                        },
                        (error) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erro',
                                detail: 'Erro ao excluir subcategorias',
                                life: 3000
                            });
                        }
                    );
                }
            }
        });
    }

    saveSubCategory() {
        this.submitted = true;

        if (this.subCategory.st_subcategory?.trim() && this.subCategory.id_category && this.subCategory.st_status) {
            const subCategoryRequest: SubCategoryRequest = {
                id_category: this.subCategory.id_category,
                st_subcategory: this.subCategory.st_subcategory,
                st_status: this.subCategory.st_status
            };

            if (this.subCategory.id_subcategory) {
                // Atualizar subcategoria existente
                this.subCategoryService.putSubCategory(
                    this.subCategory.id_category,
                    this.subCategory.id_subcategory,
                    subCategoryRequest
                ).subscribe(
                    (response) => {
                        const index = this.subCategories().findIndex(
                            sc => sc.id_subcategory === this.subCategory.id_subcategory
                        );
                        if (index > -1) {
                            const updatedSubCategories = this.subCategories();
                            updatedSubCategories[index] = response;
                            this.subCategories.set([...updatedSubCategories]);
                        }

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Subcategoria atualizada com sucesso',
                            life: 3000
                        });
                        this.subCategoryDialog = false;
                        this.subCategory = {} as SubCategoryResponse;
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao atualizar subcategoria',
                            life: 3000
                        });
                    }
                );
            } else {
                // Criar nova subcategoria
                this.subCategoryService.postSubCategory(
                    this.subCategory.id_category,
                    subCategoryRequest
                ).subscribe(
                    (response) => {
                        this.subCategories.set([...this.subCategories(), response]);
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Subcategoria criada com sucesso',
                            life: 3000
                        });
                        this.subCategoryDialog = false;
                        this.subCategory = {} as SubCategoryResponse;
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao criar subcategoria',
                            life: 3000
                        });
                    }
                );
            }
        }
    }
}
