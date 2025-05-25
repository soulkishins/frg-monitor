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
import { CheckboxModule } from 'primeng/checkbox';
import { BrandService } from '../../service/brand.service';
import { Brand } from '../../models/brand.model';
import { Column, ExportColumn } from '../../models/global.model';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { SchedulerService } from '../../service/scheduler.service';

interface BrandResponse {
    list: Array<{
        id_brand: string;
        st_brand: string;
        st_status: string;
        client: {
            st_name: string;
        };
    }>;
    page: {
        total: number;
        limit: number;
        offset: number;
        sort?: string;
    };
}

@Component({
    selector: 'app-brand',
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
        CheckboxModule
    ],
    templateUrl: './brand.component.html',
    providers: [MessageService, BrandService, ConfirmationService]
})
export class BrandComponent implements OnInit {
    brandDialog: boolean = false;
    crawlerDialog: boolean = false;
    selectedOptions: { [key: string]: boolean } = {
        mercadoLivre: false
    };

    crawlerOptions = [
        { label: 'Mercado Livre', value: 'mercadoLivre' }
    ];

    brands = signal<Brand[]>([]);
    
    // Propriedades de paginação
    page: {
        total: number;
        limit: number;
        offset: number;
        sort?: string;
    } = {total: 0, limit: 50, offset: 0, sort: 'st_brand'};
    searchTerm: string = '';
    loading: boolean = false;

    brand!: Brand;

    selectedBrands!: Brand[] | null;

    submitted: boolean = false;

    statuses!: any[];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    filterChange = new EventEmitter<string>(); // Emissor de eventos

    offsetScroll = 400; // Valor padrão similar ao usado no advertisement-list

    constructor(
        private brandService: BrandService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router,
        private schedulerService: SchedulerService
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

            const initialData = await this.brandService.getBrands(initialParams).toPromise();
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
            
            let allBrands: Brand[] = [];

            for (let page = 0; page < totalPages; page++) {
                const params: { [key: string]: string | number } = {
                    'page.limit': limit,
                    'page.offset': page * limit
                };

                if (this.page.sort) {
                    params['page.sort'] = this.page.sort;
                }

                const data = await this.brandService.getBrands(params).toPromise();
                if (data?.list) {
                    const mappedBrands: Brand[] = data.list.map((brand) => ({
                        id: brand.id_brand,
                        name: brand.st_brand,
                        status: brand.st_status,
                        client_name: brand.client.st_name
                    }));
                    allBrands = [...allBrands, ...mappedBrands];
                }
            }

            const data = allBrands.map(brand => ({
                'Cliente': brand.client_name,
                'Marca': brand.name,
                'Status': this.getStatusLabel(brand.status)
            }));
            
            const csvContent = this.convertToCSV(data);
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', 'lista_marcas.csv');
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

    loadBrandData(event?: any) {
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
            params['search_global'] = this.searchTerm;
        }

        this.brandService.getBrands(params).subscribe({
            next: (response: BrandResponse) => {
                this.brands.set(response.list.map((brand) => ({
                    id: brand.id_brand,
                    name: brand.st_brand,
                    status: brand.st_status,
                    client_name: brand.client.st_name
                })));
                this.page = response.page;
            },
            error: (error: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar os dados',
                    life: 3000
                });
                console.error('Erro ao carregar dados:', error);
            },
            complete: () => {
                this.loading = false;
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
        const value = (event.target as HTMLInputElement).value;
        this.searchTerm = value;
        this.page.offset = 0;
        
        this.filterChange.emit(value);
        if (value === '') {
            this.dt.reset();
        }
    }

    openNew() {
        this.router.navigate(['/cadastro/marca/detalhe','novo']);
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
        this.router.navigate(['/cadastro/marca/detalhe', brand.id]);
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
                        next: (response: any) => {
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
                        error: (error: any) => {
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
                    next: (value: any) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Marca criada',
                            life: 3000
                        });
                        this.loadBrandData();
                        this.brandDialog = false;
                        this.brand = {};
                    },
                    error: (error: any) => {
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

    getStatusLabel(status: string | undefined) {
        switch (status) {
            case 'ACTIVE':
                return 'Ativo';
            case 'INACTIVE':
                return 'Inativo';
            default:
                return status || 'Desconhecido';
        }
    }

    startCrawler(brand: Brand) {
        this.brand = brand;
        this.crawlerDialog = true;
    }

    hideCrawlerDialog() {
        this.crawlerDialog = false;
        this.selectedOptions = {
            mercadoLivre: false
        };
    }

    saveCrawlerOptions() {
        const selectedOptions = Object.entries(this.selectedOptions)
            .filter(([_, value]) => value)
            .map(([key]) => key);

        this.schedulerService.startCrawler({
            id_brand: this.brand.id,
            options: selectedOptions
        }).subscribe({
            next: (_: any) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Crawler iniciado com sucesso',
                    life: 3000
                });
                this.hideCrawlerDialog();
            },
            error: (_: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao iniciar crawler',
                    life: 3000
                });
            }
        });
    }
}
