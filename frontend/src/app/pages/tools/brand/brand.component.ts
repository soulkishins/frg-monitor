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

    filterChange = new EventEmitter<string>();

    offsetScroll = 400;

    constructor(
        private brandService: BrandService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router,
        private schedulerService: SchedulerService
    ) {}

    ngOnInit() {
        this.filterChange.pipe(
            debounceTime(500),
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
