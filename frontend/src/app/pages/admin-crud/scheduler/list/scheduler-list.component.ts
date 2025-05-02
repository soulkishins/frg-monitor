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
import { Column, ExportColumn, Page } from '../../../models/global.model';
import { Router, RouterModule } from '@angular/router';
import { SchedulerService } from '../../../service/scheduler.service';
import { SchedulerResponse } from '../../../models/scheduler.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
    selector: 'app-scheduler-list',
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
    templateUrl: './scheduler-list.component.html',
    providers: [MessageService, SchedulerService, ConfirmationService]
})
export class SchedulerList implements OnInit {
    schedulerDialog: boolean = false;

    schedulers = signal<SchedulerResponse[]>([]);
    
    // Propriedades de paginação
    page: {
        total: number;
        limit: number;
        offset: number;
        sort?: string;
    } = {total: 0, limit: 50, offset: 0, sort: 'st_brand'};
    searchTerm: string = '';
    loading: boolean = false;

    scheduler!: SchedulerResponse;

    selectedSchedulers!: SchedulerResponse[] | null;

    submitted: boolean = false;

    statusOptions = [
        { label: 'Ativo', value: 'enable' },
        { label: 'Inativo', value: 'disable' }
    ];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    filterChange = new EventEmitter<string>();

    constructor(
        private schedulerService: SchedulerService,
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

            const initialData = await this.schedulerService.getSchedulers(initialParams).toPromise();
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
            
            let allSchedulers: SchedulerResponse[] = [];

            for (let page = 0; page < totalPages; page++) {
                const params: { [key: string]: string | number } = {
                    'page.limit': limit,
                    'page.offset': page * limit
                };

                if (this.page.sort) {
                    params['page.sort'] = this.page.sort;
                }

                const data = await this.schedulerService.getSchedulers(params).toPromise();
                if (data?.list) {
                    allSchedulers = [...allSchedulers, ...data.list];
                }
            }

            const data = allSchedulers.map(scheduler => ({
                'Marca': scheduler.st_brand || '',
                'Status': this.getStatusLabel(scheduler.st_status)
            }));
            
            const csvContent = this.convertToCSV(data);
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', 'lista_agendamentos.csv');
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
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(() => {
            this.loadSchedulerData();
        });         
    }

    loadSchedulerData(event?: any) {
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

        this.schedulerService.getSchedulers(params).subscribe({
            next: (data: Page<SchedulerResponse>) => {
                this.selectedSchedulers = null;
                const mappedData = data.list.map(item => ({
                    ...item,
                    brand: item.st_brand,
                    status: item.st_status
                }));
                this.schedulers.set(mappedData);   
                this.page = data.page;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar agendamentos',
                    life: 3000
                });
                console.error('Erro ao carregar agendamentos:', error);
            },
            complete: () => {
                this.loading = false;
            }
        });

        this.cols = [
            { field: 'brand', header: 'Marca' },
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
        this.router.navigate(['/cadastro/agendador/detalhe', 'novo']);
    }

    editScheduler(scheduler: SchedulerResponse) {
        this.router.navigate(['/cadastro/agendador/detalhe', scheduler.id_brand]);
    }

    hideDialog() {
        this.schedulerDialog = false;
        this.submitted = false;
    }

    navigateToSchedulers() {
        this.router.navigate(['/cadastro/agendador/lista']);
    }

    getStatusLabel(status: string): string {
        return status === 'enable' ? 'Ativo' : 'Inativo';
    }

    startCrawler(scheduler: SchedulerResponse) {
        this.schedulerService.startCrawler({
            id_brand: scheduler.id_brand
        }).subscribe({
            next: (response) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Crawler iniciado com sucesso',
                    life: 3000
                });
            },
            error: (error) => {
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
