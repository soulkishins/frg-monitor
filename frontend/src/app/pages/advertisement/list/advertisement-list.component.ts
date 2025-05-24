import { Component, OnInit, signal } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
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
import { IftaLabelModule } from 'primeng/iftalabel';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AdvertisementService } from '../../service/advertisement.service';
import { AdvertisementListDto } from '../../models/advertisement.model';
import { PanelModule } from 'primeng/panel';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { FluidModule } from 'primeng/fluid';
import { TooltipModule } from 'primeng/tooltip';
import { ContextMenuModule } from 'primeng/contextmenu';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Router } from '@angular/router';

registerLocaleData(localePt);

@Component({
    selector: 'app-crud',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        RadioButtonModule,
        InputNumberModule,
        IftaLabelModule,
        TooltipModule,
        FluidModule,
        MenuModule,
        TagModule,
        PanelModule,
        AvatarModule,
        InputIconModule,
        IconFieldModule,
        DialogModule,
        ToastModule,
        ConfirmDialogModule,
        ContextMenuModule,
        DatePickerModule
    ],
    templateUrl: './advertisement-list.component.html',
    styleUrls: ['./advertisement-list.component.scss'],
    providers: [MessageService, AdvertisementService, ConfirmationService]
})
export class AdvertisementList implements OnInit {
    filters: {[prop: string]: any} = {};
    page: {
        total: number;
        limit: number;
        offset: number;
        sort?: string;
    } = {total: 0, limit: 50, offset: 0, sort: 'st_name'};
    loading: boolean = false;

    advertisements = signal<AdvertisementListDto[]>([]);
    selectedAdvertisements: AdvertisementListDto[] = [];
    selectedAdvertisement: AdvertisementListDto | null = null;
    statuses!: any[];

    offsetScroll = 370;

    items!: MenuItem[];

    constructor(
        private advertisementService: AdvertisementService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    exportCSV() {
        console.log('exportCSV');
        this.messageService.add({ severity: 'success', summary: 'Success Message', detail: 'Message sent' });
    }

    ngOnInit() {
        this.statuses = this.advertisementService.getStatuses(true);
        this.filters = localStorage.getItem('advertisement-filters') ? JSON.parse(localStorage.getItem('advertisement-filters') || '{}') : {};
        if (!this.filters['st_status'])
        this.filters['st_status'] = this.statuses[0];

        this.items = [
            { label: 'Visualizar', icon: 'pi pi-eye', command: () => this.viewAdvertisement(this.selectedAdvertisement!) },
            { label: 'Abrir URL', icon: 'pi pi-external-link', command: () => this.openUrl(this.selectedAdvertisement!) }
        ];
    }

    loadData(event?: any) {
        console.log(event);

        if (!event) {
            event = {first: this.page.offset, rows: this.page.limit};
        }
        
        // Remover atributos que não possuem valor
        Object.keys(this.filters).forEach(key => {
            if (this.filters[key] === null || this.filters[key] === undefined || this.filters[key] === '') {
                delete this.filters[key];
            }
        });

        localStorage.setItem('advertisement-filters', JSON.stringify(this.filters));

        this.loading = true;
        const {st_status, ...query} = this.filters;
        if (this.filters['st_status'].value !== 'ALL')
        query['st_status'] = this.filters['st_status'].value;
        if (this.filters['dt_start'])
            query['dt_start'] = this.filters['dt_start'].toISOString().substring(0, 10);
        if (this.filters['dt_end'])
            query['dt_end'] = this.filters['dt_end'].toISOString().substring(0, 10);
        query['page.limit'] = event.rows;
        query['page.offset'] = event.first;
        query['page.sort'] = `${event.sortField || this.page.sort}${event.sortOrder !== -1 ? '.asc' : '.desc'}`;

        this.advertisementService
        .getAdvertisements(query)
        .subscribe({
            next: (data) => {
                this.advertisements.set(data.list);
                this.page = data.page;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar anúncios',
                    life: 3000
                });
                console.error('Erro ao carregar anúncios:', error);
            },
            complete: () => {
                this.loading = false;
            }
        });
    }

    clearFilters(dt: any) {
        this.filters = {
            st_status: this.statuses[0],
        };
        dt.reset();
    }

    onAfterCollapsedChange(event: any) {
        if (event.collapsed) {
            this.offsetScroll = 370;
        }
    }

    onBeforeCollapsedChange(event: any) {
        if (event.collapsed) {
            this.offsetScroll = 580;
        }
    }

    viewAdvertisement(advertisement: AdvertisementListDto) {
        this.router.navigate(['/anuncio', 'detalhe', advertisement.id_advertisement]);
    }

    updateStatusAdvertisements(status: string, statusLabel: string, successMessage: string) {
        this.advertisementService
        .updateStatusAdvertisements(this.selectedAdvertisements.map(ad => ad.id_advertisement), status)
        .subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: successMessage,
                    detail: 'Anúncios atualizados com sucesso!',
                    life: 3000
                });
            },
            error: (error: any) => {
                console.error('Erro ao atualizar status dos anúncios:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: `Erro ao atualizar o status dos anúncios para ${statusLabel}`,
                    life: 3000
                });
            }
        });
    }

    reviewedAdvertisement() {
        this.confirmationService.confirm({
            message: 'Confirmar a revisão dos anúncios selecionados?',
            header: 'Confirmar Revisão',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.updateStatusAdvertisements('REVIEWED', 'Revisado', 'Revisão Confirmada')
        });
    }

    toReviewAdvertisement() {
        this.confirmationService.confirm({
            message: 'Confirmar a revisão dos anúncios selecionados?',
            header: 'Confirmar Em Revisão',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.updateStatusAdvertisements('MANUAL', 'Em Revisão', 'Aguardando Revisão Confirmada')
        });
    }

    reportAdvertisements() {
        this.confirmationService.confirm({
            message: 'Confirmar a denúncia dos anúncios selecionados?',
            header: 'Confirmar Denúncia',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.updateStatusAdvertisements('REPORT', 'Marcado para Denúncia', 'Denúncia Confirmada')
        });
    }

    invalidateAdvertisements() {
        this.confirmationService.confirm({
            message: 'Confirmar a invalidade dos anúncios selecionados?',
            header: 'Confirmar Invalidação',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.updateStatusAdvertisements('INVALIDATE', 'Invalidado', 'Invalidação Confirmada')
        });
    }

    qualifyAdvertisements() {
        this.confirmationService.confirm({
            message: 'Confirmar a qualificação dos anúncios pela AI?',
            header: 'Confirmar Qualificação',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.sendQualification()
        });
    }

    sendQualification() {
        this.advertisementService
        .qualifyAdvertisements({
            "advertisements": this.selectedAdvertisements.map(ad => ad.id_advertisement),
            "scheduler_id": "00000000-0000-0000-0000-000000000000",
            "scheduler_date": new Date().toISOString(),
            "ai": true
        })
        .subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Qualificação em andamento', detail: 'Aguarde alguns instantes...' });
            },
            error: (error: any) => {
                console.error('Erro ao enviar a qualificação dos anúncios para a AI:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao enviar a qualificação dos anúncios para a AI',
                    life: 3000
                });
            }
        });
    }

    exportReported() {
        this.confirmationService.confirm({
            message: 'Confirmar a exportação dos anúncios denunciados?',
            header: 'Confirmar Exportação',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const key = this.getKey();
                this.advertisementService
                .exportAdvertisements(key)
                .subscribe({
                    next: () => {
                        this.messageService.add({
                            key: 'export',
                            severity: 'success',
                            summary: 'Exportação em andamento',
                            detail: 'Exportação em andamento, aguarde alguns instantes...',
                            closable: false,
                            sticky: true,
                            icon: 'pi pi-spin pi-spinner',
                        });
                        this.getReportStatus(key);
                    },
                    error: (error: any) => {
                        console.error('Erro ao exportar os anúncios denunciados:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao exportar os anúncios denunciados',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    exportSelected() {
        this.confirmationService.confirm({
            message: 'Confirmar a exportação dos anúncios selecionados?',
            header: 'Confirmar Exportação',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const key = this.getKey();
                this.advertisementService
                .exportAdvertisements(key, this.selectedAdvertisements.map(ad => ad.id_advertisement))
                .subscribe({
                    next: () => {
                        this.messageService.add({
                            key: 'export',
                            severity: 'success',
                            summary: 'Exportação em andamento',
                            detail: 'Exportação em andamento, aguarde alguns instantes...',
                            closable: false,
                            sticky: true,
                            icon: 'pi pi-spin pi-spinner',
                        });
                        this.getReportStatus(key);
                    },
                    error: (error: any) => {
                        console.error('Erro ao exportar os anúncios:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao exportar os anúncios selecionados',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    getReportStatus(key: string) {
        setTimeout(() => {
            this.advertisementService.getReportStatus(key).subscribe({
                next: (status) => {
                    if (status === 'COMPLETED') {
                        this.messageService.clear('export');
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exportação concluída',
                            detail: 'Exportação concluída com sucesso!',
                            life: 3000
                        });
                        this.advertisementService.getReport(key).subscribe({
                            next: (report) => {
                                const url = window.URL.createObjectURL(report);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = key;
                                a.target = '_blank';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                window.URL.revokeObjectURL(url);
                            },
                            error: (error: any) => {
                                console.error('Erro ao obter o arquivo do relatório da exportação dos anúncios:', error);
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Erro',
                                    detail: 'Erro ao obter o arquivo do relatório da exportação dos anúncios',
                                    life: 3000
                                });
                            }
                        });
                    }
                    if (status === 'ERROR') {
                        this.messageService.clear('export');
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao exportar os anúncios, tente novamente mais tarde',
                            life: 3000
                        });
                    }
                    if (status === 'PENDING') {
                        this.getReportStatus(key);
                    }
                },
                error: (error: any) => {
                    console.error('Erro ao obter status da exportação dos anúncios:', error);
                    this.messageService.clear('export');
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Erro ao exportar os anúncios, tente novamente mais tarde',
                        life: 3000
                    });
                }
            });
        }, 2000);
    }

    getSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
        const st = this.statuses.filter(s => s.value === status)[0];
        if (st)
            return st.color;
        return undefined;
    }

    getStatus(status: string): string | undefined {
        const st = this.statuses.filter(s => s.value === status)[0];
        if (st)
            return st.label;
        return undefined;
    }

    openUrl(advertisement: AdvertisementListDto) {
        window.open(advertisement.st_url, '_blank');
    }

    private getKey(): string {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `export_${day}_${month}_${year}_${Math.random().toString(36).substring(2, 15)}.xlsx`;
    }
}
