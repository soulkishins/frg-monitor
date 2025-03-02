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
import { BrandService } from '../../service/brand.service';
import { Brand, BrandResponse } from '../../models/brand.model';
import { CompanyService } from '../../service/company.service';
import { CompanyResponse } from '../../models/company.model';
import { forkJoin } from 'rxjs';
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
    templateUrl: './brand.component.html',
    providers: [MessageService, BrandService, CompanyService, ConfirmationService]
})
export class BrandCrud implements OnInit {
    brandDialog: boolean = false;

    brands = signal<Brand[]>([]);

    brand!: Brand;

    selectedBrands!: Brand[] | null;

    submitted: boolean = false;

    statuses!: any[];

    clients: any[] = [];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private brandService: BrandService,
        private companyService: CompanyService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadBrandData();
    }

    loadBrandData() {
        forkJoin({
            companies: this.companyService.getClients(),
            brands: this.brandService.getBrands()
        }).subscribe({
            next: ({ companies, brands }) => {
                // Configurar clientes para o dropdown
                this.clients = companies.list.map((company: CompanyResponse) => ({
                    label: company.st_name,
                    value: company.id
                }));

                // Criar um Map de empresas para acesso rápido
                const companyMap = new Map(companies.list.map((company: CompanyResponse) => [company.id, company]));
                
                // Configurar marcas
                this.brands.set(brands.map((brand: BrandResponse) => ({
                    id: brand.id_brand,
                    name: brand.st_brand,
                    status: brand.st_status,
                    client_name: companyMap.get(brand.id_client)?.st_name || 'Cliente não encontrado'
                })));
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar os dados',
                    life: 3000
                });
                console.error('Erro ao carregar dados:', error);
            }
        });

        this.statuses = [
            { label: 'Ativo', value: 'ACTIVE' },
            { label: 'Inativo', value: 'INACTIVE' }
        ];

        this.cols = [
            { field: 'id', header: 'ID' },
            { field: 'name', header: 'Nome' },
            { field: 'status', header: 'Status' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.brand = {};
        this.submitted = false;
        this.brandDialog = true;
    }

    deleteSelectedBrands() {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir as marcas selecionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.brands.set(this.brands().filter((val) => !this.selectedBrands?.includes(val)));
                this.selectedBrands = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Marcas excluídas',
                    life: 3000
                });
            }
        });
    }

    editBrand(brand: Brand) {
        this.brand = { ...brand };
        // Encontrar o ID do cliente baseado no client_name
        const client = this.clients.find(c => c.label === brand.client_name);
        if (client) {
            this.brand.client_id = client.value;
        }
        this.brandDialog = true;
    }

    deleteBrand(brand: Brand) {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir a marca ' + brand.name + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (brand.id) {
                    this.brandService.deleteBrand(brand.id).subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Sucesso',
                                detail: 'Marca excluída',
                                life: 3000
                            });
                            this.loadBrandData(); // Recarregar os dados
                            this.brand = {};
                        },
                        error: (error) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erro',
                                detail: 'Erro ao excluir marca',
                                life: 3000
                            });
                            console.error('Erro ao excluir marca:', error);
                        }
                    });
                }
            }
        });
    }

    hideDialog() {
        this.brandDialog = false;
        this.submitted = false;
    }

    saveBrand() {
        this.submitted = true;

        if (this.brand.name?.trim() && this.brand.client_id && this.brand.status) {
            if (this.brand.id) {
                const index = this.findIndexById(this.brand.id);
                if (index >= 0) {
                    // Criar brandRequest para atualização
                    const brandRequest = {
                        st_brand: this.brand.name,
                        st_status: this.brand.status,
                        id_client: this.brand.client_id
                    };

                    this.brandService.putBrand(this.brand.id, brandRequest).subscribe({
                        next: (response) => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Sucesso',
                                detail: 'Marca atualizada',
                                life: 3000
                            });
                            this.loadBrandData(); // Recarregar os dados
                            this.brandDialog = false;
                            this.brand = {};
                        },
                        error: (error) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erro',
                                detail: 'Erro ao atualizar marca',
                                life: 3000
                            });
                            console.error('Erro ao atualizar marca:', error);
                        }
                    });
                }
            } else {
                // Criar nova marca
                const brandRequest = {
                    st_brand: this.brand.name,
                    st_status: this.brand.status,
                    id_client: this.brand.client_id
                };

                this.brandService.postBrand(brandRequest).subscribe({
                    next: (response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Marca criada',
                            life: 3000
                        });
                        this.loadBrandData(); // Recarregar os dados
                        this.brandDialog = false;
                        this.brand = {};
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao criar marca',
                            life: 3000
                        });
                        console.error('Erro ao criar marca:', error);
                    }
                });
            }
        }
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.brands().length; i++) {
            if (this.brands()[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    }

    createId(): string {
        let id = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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
}
