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
    } = {total: 0, limit: 100, offset: 0, sort: 'st_name'};
    loading: boolean = false;

    advertisements = signal<AdvertisementListDto[]>([]);
    selectedAdvertisements!: AdvertisementListDto[] | null;
    statuses!: any[];

    constructor(
        private advertisementService: AdvertisementService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    exportCSV() {
        console.log('exportCSV');
        this.messageService.add({ severity: 'success', summary: 'Success Message', detail: 'Message sent' });
    }

    ngOnInit() {

        this.statuses = [
            { label: 'Todos', value: 'ALL' },
            { label: 'Novo', value: 'NEW', color: 'info' },
            { label: 'Erro de Leitura', value: 'ERROR', color: 'danger' },
            { label: 'Para Denuciar', value: 'REPORT', color: 'warn' },
            { label: 'Denuciado', value: 'REPORTED', color: 'secondary' },
            { label: 'Revisão Manual', value: 'INVALIDATE', color: 'contrast' },
        ];

        this.filters['st_status'] = this.statuses[0];

        //this.loadData({first: 0, rows: this.pageSize});
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
        query['page.sort'] = this.page.sort;

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

    deleteSelectedAdvertisements() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected Advertisements?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.advertisements.set(this.advertisements().filter((val) => !this.selectedAdvertisements?.includes(val)));
                this.selectedAdvertisements = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Advertisements Deleted',
                    life: 3000
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
