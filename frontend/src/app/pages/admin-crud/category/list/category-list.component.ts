import { Component, EventEmitter, OnInit, signal, ViewChild } from '@angular/core';
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
import { DropdownModule } from 'primeng/dropdown';
import { CategoryService } from '../../../../pages/service/category.service';
import { CategoryResponse } from '../../../../pages/models/category.model';
import { Column, ExportColumn, Page } from '../../../../pages/models/global.model';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
@Component({
    selector: 'app-category-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
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
        DropdownModule
    ],
    templateUrl: './category-list.component.html',
    providers: [MessageService, CategoryService, ConfirmationService]
})
export class CategoryList implements OnInit {
    categoryDialog: boolean = false;

    categories = signal<CategoryResponse[]>([]);
    
    // Propriedades de paginação
    page: {
        total: number;
        limit: number;
        offset: number;
        sort?: string;
    } = {total: 0, limit: 50, offset: 0, sort: 'st_category'};
    searchTerm: string = '';
    loading: boolean = false;

    category!: CategoryResponse;

    selectedCategories!: CategoryResponse[] | null;

    submitted: boolean = false;

    statusOptions = [
        { label: 'Ativo', value: 'active' },
        { label: 'Inativo', value: 'inactive' }
    ];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    filterChange = new EventEmitter<string>(); // Emissor de eventos

    constructor(
        private categoryService: CategoryService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    async exportCSV() {
        try {
            this.messageService.add({
                key: 'export',
                severity: 'info',
                summary: 'Exportação em andamento',
                detail: 'Exportação em andamento, aguarde alguns instantes...',
                closable: false,
                sticky: true,
                icon: 'pi pi-spin pi-spinner'
            });

            const initialParams: { [key: string]: string | number } = {
                'page.limit': 1,
                'page.offset': 0
            };

            if (this.page.sort) {
                initialParams['page.sort'] = this.page.sort;
            }

            const initialData = await this.categoryService.getCategories(initialParams).toPromise();
            const totalRecords = initialData?.page.total || 0;
            
            if (totalRecords === 0) {
                this.messageService.clear('export');
                this.messageService.add({
                    severity: 'info',
                    summary: 'Informação',
                    detail: 'Não há registros para exportar',
                    life: 3000
                });
                return;
            }

            const limit = this.page.limit;
            const totalPages = Math.ceil(totalRecords / limit);
            
            let allCategories: CategoryResponse[] = [];

            for (let page = 0; page < totalPages; page++) {
                const params: { [key: string]: string | number } = {
                    'page.limit': limit,
                    'page.offset': page * limit
                };

                if (this.page.sort) {
                    params['page.sort'] = this.page.sort;
                }

                const data = await this.categoryService.getCategories(params).toPromise();
                if (data?.list) {
                    allCategories = [...allCategories, ...data.list];
                }
            }

            const data = allCategories.map(category => ({
                'Descrição': category.st_category,
                'Status': category.st_status,
                'Data Criação': category.dt_created,
                'Criado por': category.st_created_by
            }));
            
            const csvContent = this.convertToCSV(data);
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', 'lista_categorias.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Aguardar um pequeno intervalo para garantir que o download foi iniciado
            await new Promise(resolve => setTimeout(resolve, 100));

            this.messageService.clear('export');
            this.messageService.add({
                key: 'export',
                severity: 'success',
                summary: 'Sucesso',
                detail: `Exportação concluída com ${totalRecords} registros`,
                life: 3000
            });
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            this.messageService.clear('export');
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Erro ao exportar os dados',
                life: 3000
            });
        }
    }

    private convertToCSV(data: any[]): string {
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header] || '';
                return `"${value}"`;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    }

    ngOnInit() {
        this.filterChange.pipe(
            debounceTime(500), // Espera 500ms para evitar chamadas excessivas
            distinctUntilChanged(),
            switchMap(value => value)
        ).subscribe(response => {
            this.dt.reset();
        });        
    }

    loadCategoryData(event?: any) {
        if (this.loading) {
            return;
        }

        if (!event) {
            event = {first: this.page.offset, rows: this.page.limit};
        }

        this.loading = true;
        const params: any = {};
        params['page.limit'] = event.rows;
        params['page.offset'] = event.first;

        const baseSort = (event.sortField || this.page.sort).replace(/\.(asc|desc)$/, '');
        params['page.sort'] = `${baseSort}${event.sortOrder === 1 ? '.asc' : '.desc'}`;

        if (this.searchTerm) {
            params['st_category'] = this.searchTerm;
        }

        this.categoryService.getCategories(params).subscribe({
            next: (data: Page<CategoryResponse>) => {
                this.categories.set(data.list);
                this.page = data.page;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar categorias',
                    life: 3000
                });
                console.error('Erro ao carregar categorias:', error);
            },
            complete: () => {
                this.loading = false;
            }
        });

        this.cols = [
            { field: 'st_category', header: 'Nome' },
            { field: 'st_status', header: 'Status' },
            { field: 'dt_created', header: 'Data Criação' },
            { field: 'st_created_by', header: 'Criado por' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchTerm = value;
        this.page.offset = 0;
        
        this.filterChange.emit(value);
        if (value === '') {
            this.dt.reset();
        }
    }

    openNew() {
        this.router.navigate(['/cadastro/categoria/detalhe', 'novo']);
    }

    editCategory(category: CategoryResponse) {
        this.router.navigate(['/cadastro/categoria/detalhe', category.id_category]);
    }

    deleteSelectedCategories() {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir as categorias selecionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedCategories) {
                    // Criar um array de Promises para todas as exclusões
                    const deletePromises = this.selectedCategories.map(category => 
                        this.categoryService.deleteCategory(category.id_category).toPromise()
                    );

                    // Executar todas as exclusões em paralelo
                    Promise.all(deletePromises)
                        .then(() => {
                            this.categories.set(this.categories().filter((val) => !this.selectedCategories?.includes(val)));
                            this.selectedCategories = null;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Sucesso',
                                detail: 'Categorias Excluídas',
                                life: 3000
                            });
                        })
                        .catch(() => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erro',
                                detail: 'Erro ao excluir categorias',
                                life: 3000
                            });
                        });
                }
            }
        });
    }

    hideDialog() {
        this.categoryDialog = false;
        this.submitted = false;
    }

    deleteCategory(category: CategoryResponse) {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir a categoria ' + category.st_category + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.categoryService.deleteCategory(category.id_category).subscribe(
                    (response) => {
                        this.categories.set(this.categories().filter((val) => val.id_category !== category.id_category));
                        this.category = {} as CategoryResponse;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Categoria Excluída',
                            life: 3000
                        });
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao excluir categoria',
                            life: 3000
                        });
                    }
                );
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.categories().length; i++) {
            if (this.categories()[i].id_category === id) {
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

    navigateToCategories() {
        this.router.navigate(['/cadastro/categoria/lista']);
    }

    saveCategory() {
        this.submitted = true;
        
        if (this.category.st_category?.trim() && this.category.st_status) {
            const categoryRequest = {
                st_category: this.category.st_category,
                st_status: this.category.st_status
            };

            if (this.category.id_category) {
                // Atualizar categoria existente
                this.categoryService.putCategory(this.category.id_category, categoryRequest).subscribe(
                    (response) => {
                        const index = this.findIndexById(this.category.id_category);
                        const _categories = this.categories();
                        _categories[index] = response;
                        this.categories.set([..._categories]);

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Categoria Atualizada',
                            life: 3000
                        });
                        this.categoryDialog = false;
                        this.category = {} as CategoryResponse;
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao atualizar categoria',
                            life: 3000
                        });
                    }
                );
            } else {
                // Criar nova categoria
                this.categoryService.postCategory(categoryRequest).subscribe(
                    (response) => {
                        const _categories = this.categories();
                        this.categories.set([..._categories, response]);

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Categoria Criada',
                            life: 3000
                        });
                        this.categoryDialog = false;
                        this.category = {} as CategoryResponse;
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao criar categoria',
                            life: 3000
                        });
                    }
                );
            }
        }
    }

}
