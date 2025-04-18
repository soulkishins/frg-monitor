import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
import { CategoryService } from '../../../../pages/service/category.service';
import { CategoryResponse } from '../../../../pages/models/category.model';
import { SubCategoryService } from '../../../../pages/service/sub-category.service';
import { SubCategoryResponse } from '../../../../pages/models/sub-category.model';
import { debounceTime, distinctUntilChanged, forkJoin, Subject, switchMap, takeUntil } from 'rxjs';
import { SubCategoryRequest } from '../../../../pages/models/sub-category.model';
import { Column, ExportColumn } from '../../../../pages/models/global.model';

@Component({
    selector: 'app-subcategory-view',
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
    templateUrl: './subcategory-view.component.html',
    providers: [MessageService, ConfirmationService, CategoryService, SubCategoryService]
})
export class SubCategoryView implements OnInit {
    subCategoryDialog: boolean = false;
    isEditing: boolean = false;

    categories = signal<CategoryResponse[]>([]);
    subCategories = signal<SubCategoryResponse[]>([]);
    selectedSubCategories!: SubCategoryResponse[] | null;

    subCategory: SubCategoryResponse = {} as SubCategoryResponse;

    submitted: boolean = false;
    statuses: any[] = [
        { label: 'Ativo', value: 'ACTIVE' },
        { label: 'Inativo', value: 'INACTIVE' }
    ];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    page: {
        total: number;
        limit: number;
        offset: number;
        sort?: string;
    } = {total: 0, limit: 50, offset: 0, sort: 'st_category'};

    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();
    loading: boolean = false;    

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private categoryService: CategoryService,
        private subCategoryService: SubCategoryService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadCategories();
        this.route.params.subscribe(params => {
            const id = params['id'];
            if (id) {
                this.isEditing = true;
                this.loadSubCategory(id);
            } else {
                this.isEditing = false;
                this.subCategory = {} as SubCategoryResponse;
            }
        });

        this.searchSubject.pipe(
            takeUntil(this.destroy$),
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(query => {
                this.loading = true;
                return this.categoryService.getCategories({
                    "st_category": query,
                    "page.limit": this.page.limit,
                    "page.sort": "st_category.asc"
                });
            })
        ).subscribe({
            next: (categories) => {
                this.categories.set(categories.list);
                this.loading = false;
            },
            error: (error) => {
                console.error('Erro ao buscar categorias:', error);
                this.loading = false;
            }
        });
    }

    loadCategories() {
        this.categoryService.getCategories({"page.limit": this.page.limit,"page.sort": "st_category.asc"}).subscribe(
            (data) => {
                this.categories.set(data.list);
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
    }

    loadSubCategory(id: string) {
        this.subCategoryService.getSubCategory(id).subscribe(
            (data) => {
                this.subCategory = data;
                if (data.category?.st_category) {
                    this.filterCategories({ filter: data.category.st_category });
                }
            },
            (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar subcategoria',
                    life: 3000
                });
            }
        );
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.subCategory = {} as SubCategoryResponse;
        this.submitted = false;
        this.isEditing = false;
    }

    goBack() {
        this.router.navigate(['/cadastro/subcategoria/lista']);
    }

    getCategoryName(categoryId: string): string {
        const category = this.categories().find(cat => cat.id_category === categoryId);
        return category ? category.st_category : categoryId;
    }

    getSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'INACTIVE':
                return 'danger';
            default:
                return 'info';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'ACTIVE':
                return 'Ativo';
            case 'INACTIVE':
                return 'Inativo';
            default:
                return status;
        }
    }

    editSubCategory(subCategory: SubCategoryResponse) {
        this.subCategory = { ...subCategory };
        this.isEditing = true;
    }

    deleteSubCategory(subCategory: SubCategoryResponse) {
        this.confirmationService.confirm({
            message: `Tem certeza que deseja excluir a subcategoria ${subCategory.st_subcategory}?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.subCategoryService.deleteSubCategory(subCategory.id_subcategory).subscribe(
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

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    deleteSelectedSubCategories() {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir as subcategorias selecionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedSubCategories) {
                    const deletePromises = this.selectedSubCategories.map(subCategory =>
                        this.subCategoryService.deleteSubCategory(subCategory.id_subcategory)
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

            if (this.isEditing) {
                this.subCategoryService.putSubCategory(this.subCategory.id_subcategory, subCategoryRequest).subscribe(
                    () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Subcategoria atualizada com sucesso',
                            life: 3000
                        });
                        this.router.navigate(['/cadastro/subcategoria/lista']);
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
                this.subCategoryService.postSubCategory(subCategoryRequest).subscribe(
                    () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Subcategoria criada com sucesso',
                            life: 3000
                        });
                        this.router.navigate(['/cadastro/subcategoria/lista']);
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

    filterCategories(event: any) {
        const query = event.filter.toLowerCase();
        this.searchSubject.next(query);
    }

}
