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
import { CategoryService } from '../../service/category.service';
import { CategoryResponse } from '../../models/category.model';
import { SubCategoryService } from '../../service/sub-category.service';
import { SubCategoryResponse } from '../../models/sub-category.model';
import { forkJoin } from 'rxjs';
import { SubCategoryRequest } from '../../models/sub-category.model';
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
    templateUrl: './subcategory.component.html',
    providers: [MessageService, ConfirmationService, CategoryService, SubCategoryService]
})
export class SubCategoryCrud implements OnInit {
    subCategoryDialog: boolean = false;

    categories = signal<CategoryResponse[]>([]);
    subCategories = signal<SubCategoryResponse[]>([]);
    selectedSubCategories!: SubCategoryResponse[] | null;

    subCategory: SubCategoryResponse = {} as SubCategoryResponse;

    submitted: boolean = false;
    statuses: any[] = [
        { label: 'ATIVO', value: 'ATIVO' },
        { label: 'INATIVO', value: 'INATIVO' }
    ];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
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

    hideDialog() {
        this.subCategoryDialog = false;
        this.submitted = false;
    }

    getCategoryName(categoryId: string): string {
        const category = this.categories().find(cat => cat.id_category === categoryId);
        return category ? category.st_category : categoryId;
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
