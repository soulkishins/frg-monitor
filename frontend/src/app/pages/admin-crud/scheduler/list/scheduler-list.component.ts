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
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

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
    } = {total: 0, limit: 50, offset: 0, sort: 'st_keyword'};
    searchTerm: string = '';
    loading: boolean = false;

    scheduler!: SchedulerResponse;

    selectedSchedulers!: SchedulerResponse[] | null;

    submitted: boolean = false;

    statusOptions = [
        { label: 'Ativo', value: 'active' },
        { label: 'Inativo', value: 'inactive' }
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

    exportCSV() {
        const data = this.schedulers().map(scheduler => ({
            'Palavra-chave': scheduler.st_keyword || '',
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
                this.schedulers.set(data.list);   
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
            { field: 'st_keyword', header: 'Palavra-chave' },
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
        this.router.navigate(['/cadastro/agendador/detalhe', 'novo']);
    }

    editScheduler(scheduler: SchedulerResponse) {
        this.router.navigate(['/cadastro/agendador/detalhe', scheduler.id_keyword]);
    }

    deleteSelectedSchedulers() {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir os agendamentos selecionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedSchedulers) {
                    const deletePromises = this.selectedSchedulers.map(scheduler => 
                        this.schedulerService.deleteScheduler(scheduler.id_keyword).toPromise()
                    );

                    Promise.all(deletePromises)
                        .then(() => {
                            this.schedulers.set(this.schedulers().filter((val) => !this.selectedSchedulers?.includes(val)));
                            this.selectedSchedulers = null;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Sucesso',
                                detail: 'Agendamentos Excluídos',
                                life: 3000
                            });
                        })
                        .catch(() => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erro',
                                detail: 'Erro ao excluir agendamentos',
                                life: 3000
                            });
                        });
                }
            }
        });
    }

    hideDialog() {
        this.schedulerDialog = false;
        this.submitted = false;
    }

    deleteScheduler(scheduler: SchedulerResponse) {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir o agendamento ' + scheduler.st_keyword + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.schedulerService.deleteScheduler(scheduler.id_keyword).subscribe(
                    (response) => {
                        this.schedulers.set(this.schedulers().filter((val) => val.id_keyword !== scheduler.id_keyword));
                        this.scheduler = {} as SchedulerResponse;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Agendamento Excluído',
                            life: 3000
                        });
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao excluir agendamento',
                            life: 3000
                        });
                    }
                );
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.schedulers().length; i++) {
            if (this.schedulers()[i].id_keyword === id) {
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

    navigateToSchedulers() {
        this.router.navigate(['/cadastro/agendador/lista']);
    }

    getStatusLabel(status: string): string {
        return status === 'active' ? 'Ativo' : 'Inativo';
    }
}
