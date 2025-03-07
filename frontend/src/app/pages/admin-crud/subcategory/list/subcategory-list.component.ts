import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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
import { SubCategoryService } from '../../../../pages/service/sub-category.service';
import { SubCategoryResponse } from '../../../../pages/models/sub-category.model';
import { forkJoin } from 'rxjs';
import { SubCategoryRequest } from '../../../../pages/models/sub-category.model';
import { Column, ExportColumn } from '../../../../pages/models/global.model';

@Component({
    selector: 'app-subcategory-list',
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
    templateUrl: './subcategory-list.component.html',
    providers: [MessageService, ConfirmationService, SubCategoryService]
})
export class SubCategoryList implements OnInit {
    subCategoryDialog: boolean = false;

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

    constructor(
        private subCategoryService: SubCategoryService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    exportCSV() {
        const data = this.subCategories().map(subCategory => ({
            'Categoria': subCategory.category?.st_category || '',
            'Subcategoria': subCategory.st_subcategory,
            'Status': this.getStatusLabel(subCategory.st_status)
        }));
        
        const csvContent = this.convertToCSV(data);
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'lista_subcategorias.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        this.loadSubCategoryData();
    }

    loadSubCategoryData() {
        this.subCategoryService.getSubCategories().subscribe(
            (response) => {
                this.subCategories.set(response.list);
            },
            (error: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar subcategorias',
                    life: 3000
                });
            }
        );

        this.cols = [
            { field: 'id_subcategory', header: 'ID' },
            { field: 'st_subcategory', header: 'Subcategoria' },
            { field: 'category.st_category', header: 'Categoria' },
            { field: 'st_status', header: 'Status' },
            { field: 'st_created_by', header: 'Criado por' },
            { field: 'dt_created', header: 'Data Criação' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.router.navigate(['/cadastro/subcategoria/detalhe']);
    }

    hideDialog() {
        this.subCategoryDialog = false;
        this.submitted = false;
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
        this.router.navigate(['/cadastro/subcategoria/detalhe', subCategory.id_subcategory]);
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
                    (error: any) => {
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
                        this.subCategoryService.deleteSubCategory(subCategory.id_subcategory)
                    );

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
                        (error: any) => {
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
                this.subCategoryService.putSubCategory(this.subCategory.id_subcategory, subCategoryRequest).subscribe(
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
                    (error: any) => {
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
                    (error: any) => {
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
