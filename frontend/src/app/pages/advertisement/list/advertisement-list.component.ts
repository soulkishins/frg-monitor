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
import { Column, ExportColumn, omit } from '../../models/global.model';
import { AdvertisementService } from '../../service/advertisement.service';
import { AdvertisementListDto } from '../../models/advertisement.model';

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
    templateUrl: './advertisement-list.component.html',
    providers: [MessageService, AdvertisementService, ConfirmationService]
})
export class AdvertisementList implements OnInit {
    AdvertisementDialog: boolean = false;

    Advertisements = signal<AdvertisementListDto[]>([]);

    Advertisement!: AdvertisementListDto;

    selectedAdvertisements!: AdvertisementListDto[] | null;

    submitted: boolean = false;

    statuses!: any[];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private AdvertisementService: AdvertisementService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.AdvertisementService
        .getAdvertisements()
        .subscribe(this.Advertisements.set);

        this.statuses = [
            { label: 'Novo', value: 'NEW', color: 'info' },
            { label: 'Erro de Leitura', value: 'ERROR', color: 'danger' },
            { label: 'Para Denuciar', value: 'REPORT', color: 'warn' },
            { label: 'Denuciado', value: 'REPORTED', color: 'secondary' },
            { label: 'Revisão Manual', value: 'INVALIDATE', color: 'contrast' },
        ];

        this.cols = [
            { field: 'st_plataform', header: 'Plataforma' },
            { field: 'st_plataform_id', header: 'ID Plataforma' },
            { field: 'st_brand', header: 'Marca' },
            { field: 'st_product', header: 'Produto' },
            { field: 'st_title', header: 'Titulo' },
            { field: 'db_price', header: 'Preço' },
            { field: 'st_status', header: 'Status' },
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    deleteSelectedAdvertisements() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected Advertisements?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.Advertisements.set(this.Advertisements().filter((val) => !this.selectedAdvertisements?.includes(val)));
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
        const st = this.statuses.filter(s => s.label === status)[0];
        if (st)
            return st.color;
        return undefined;
    }
}
