import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { BrandService } from '../../../../pages/service/brand.service';
import { Brand } from '../../../../pages/models/brand.model';
import { CompanyService } from '../../../../pages/service/company.service';
import { CompanyResponse } from '../../../../pages/models/company.model';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';

@Component({
    selector: 'app-brand-view',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        SelectModule
    ],
    templateUrl: './brand-view.component.html',
    providers: [MessageService, BrandService, CompanyService]
})
export class BrandView implements OnInit, OnDestroy {
    brandDialog: boolean = false;
    isEditing: boolean = false;
    brand: Brand = {
        id: undefined,
        client_id: undefined,
        client_name: undefined,
        name: undefined,
        status: 'ACTIVE'
    };
    submitted: boolean = false;
    statuses!: any[];
    clients: any[] = [];
    filteredClients: any[] = [];

    page: {
        total: number;
        limit: number;
        offset: number;
        sort?: string;
    } = {total: 0, limit: 50, offset: 0, sort: 'st_name'};

    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();
    loading: boolean = false;

    constructor(
        private brandService: BrandService,
        private companyService: CompanyService,
        private messageService: MessageService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        // Carregar os dados iniciais (clientes e status)
        this.companyService.getClients({"page.limit": this.page.limit,"page.sort": "st_name.asc"}).subscribe({
            next: (companies) => {
                // Configurar clientes para o dropdown
                this.clients = companies.list.map((company: CompanyResponse) => ({
                    label: company.st_name,
                    value: company.id
                }));
                this.filteredClients = [...this.clients];

                // Após carregar os clientes, verifica se é edição
                const brandId = this.route.snapshot.paramMap.get('id');
                if (brandId && brandId !== 'novo') {
                    this.isEditing = true;
                    this.brandService.getBrand(brandId).subscribe({
                        next: (response) => {
                            this.brand = {
                                id: response.id_brand,
                                name: response.st_brand,
                                status: response.st_status,
                                client_id: response.id_client,
                                client_name: response.client.st_name
                            };
                            // Após carregar a marca, filtrar o cliente correspondente
                            if (this.brand.client_name) {
                                this.filterClients({ filter: this.brand.client_name });
                            }
                        },
                        error: (error) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erro',
                                detail: 'Erro ao carregar marca',
                                life: 3000
                            });
                            console.error('Erro ao carregar marca:', error);
                        }
                    });
                } else {
                    this.brand = {
                        id: undefined,
                        client_id: undefined,
                        client_name: undefined,
                        name: undefined,
                        status: 'ACTIVE'
                    };
                }
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

        // Configurar status
        this.statuses = [
            { label: 'Ativo', value: 'ACTIVE' },
            { label: 'Inativo', value: 'INACTIVE' }
        ];

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
                this.filteredClients = companies.list.map((company: CompanyResponse) => ({
                    label: company.st_name,
                    value: company.id
                }));
                this.loading = false;
            },
            error: (error) => {
                console.error('Erro ao buscar clientes:', error);
                this.loading = false;
            }
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    openNew() {
        this.brand = {};
        this.submitted = false;
        this.brandDialog = true;
    }

    deleteSelectedBrands() {
        this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Marcas excluídas',
            life: 3000
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
        this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Marca excluída',
            life: 3000
        });
    }

    goBack() {
        this.router.navigate(['/cadastro/marca/lista']);
    }

    saveBrand() {
        this.submitted = true;

        if (this.brand.name?.trim() && this.brand.client_id && this.brand.status) {
            if (this.brand.id) {
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
                        this.router.navigate(['/cadastro/marca/lista']);
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
            } else {
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
                        this.router.navigate(['/cadastro/marca/lista']);
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

    filterClients(event: any) {
        const query = event.filter.toLowerCase();
        this.searchSubject.next(query);
    }
}
