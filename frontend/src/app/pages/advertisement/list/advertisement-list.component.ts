import { Component, OnInit, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AdvertisementService } from '../../service/advertisement.service';
import { AdvertisementListDto } from '../../models/advertisement.model';
import { PanelModule } from 'primeng/panel';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { FluidModule } from 'primeng/fluid';
import { TooltipModule } from 'primeng/tooltip';
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
        ConfirmDialogModule
    ],
    templateUrl: './advertisement-list.component.html',
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
    statuses!: any[];

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
        this.filters['st_status'] = this.statuses[0];
    }

    loadData(event?: any) {
        console.log(event);

        if (!event) {
            event = {first: this.page.offset, rows: this.page.limit};
        }

        this.loading = true;
        const {st_status, ...query} = this.filters;
        if (this.filters['st_status'].value !== 'ALL')
        query['st_status'] = this.filters['st_status'].value;
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

    viewAdvertisement(advertisement: AdvertisementListDto) {
        this.router.navigate(['/anuncio', 'detalhe', advertisement.id_advertisement]);
    }

    reportAdvertisements() {
        this.confirmationService.confirm({
            message: 'Confirmar a denúncia dos anúncios selecionados?',
            header: 'Confirmar Denúncia',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.advertisementService
                .reportAdvertisements(this.selectedAdvertisements.map(ad => ad.id_advertisement), 'REPORT')
                .subscribe({
                    next: () => {
                        this.selectedAdvertisements = [];
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Denúncia Confirmada',
                            detail: 'Anúncios atualizados com sucesso!',
                            life: 3000
                        });
                    },
                    error: (error: any) => {
                        console.error('Erro ao denunciar os anúncios:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao atualizar o status dos anúncios para Marcado para Denúncia',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    invalidateAdvertisements() {
        this.confirmationService.confirm({
            message: 'Confirmar a invalidação dos anúncios selecionados?',
            header: 'Confirmar Invalidação',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.advertisementService
                .reportAdvertisements(this.selectedAdvertisements.map(ad => ad.id_advertisement), 'INVALIDATE')
                .subscribe({
                    next: () => {
                        this.selectedAdvertisements = [];
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Revisão Manual Confirmada',
                            detail: 'Anúncios atualizados com sucesso!',
                            life: 3000
                        });
                    },
                    error: (error: any) => {
                        console.error('Erro ao invalidar os anúncios:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao atualizar o status dos anúncios para Revisão Manual',
                            life: 3000
                        });
                    }
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
                this.advertisementService
                .exportAdvertisements()
                .subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exportação em andamento',
                            detail: 'Exportação em andamento, aguarde alguns instantes...',
                            life: 3000
                        });
                    },
                    error: (error: any) => {
                        console.error('Erro ao exportar os anúncios:', error);
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
                this.advertisementService
                .exportAdvertisements(this.selectedAdvertisements.map(ad => ad.id_advertisement))
                .subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Exportação em andamento',
                            detail: 'Exportação em andamento, aguarde alguns instantes...',
                            life: 3000
                        });
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
}
