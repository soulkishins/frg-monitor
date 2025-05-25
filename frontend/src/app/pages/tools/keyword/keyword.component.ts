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
import { Column, Page } from '../../models/global.model';
import { Router, RouterModule } from '@angular/router';
import { KeywordService } from '../../service/keyword.service';
import { KeywordResponse } from '../../models/keyword.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { SchedulerService } from '../../service/scheduler.service';

@Component({
    selector: 'app-keyword',
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
    templateUrl: './keyword.component.html',
    providers: [MessageService, KeywordService, ConfirmationService]
})
export class Keyword implements OnInit {
    keywords = signal<KeywordResponse[]>([]);
    
    page: {
        total: number;
        limit: number;
        offset: number;
        sort?: string;
    } = {total: 0, limit: 50, offset: 0, sort: 'st_keyword'};
    searchTerm: string = '';
    loading: boolean = false;

    selectedKeywords!: KeywordResponse[] | null;

    statusOptions = [
        { label: 'Ativo', value: 'active' },
        { label: 'Inativo', value: 'inactive' }
    ];

    @ViewChild('dt') dt!: Table;

    cols!: Column[];

    filterChange = new EventEmitter<string>();

    offsetScroll = 400;

    constructor(
        private keywordService: KeywordService,
        private schedulerService: SchedulerService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    ngOnInit() {
        this.filterChange.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(() => {
            this.loadKeywordData();
        });         
    }

    loadKeywordData(event?: any) {
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

        this.keywordService.getKeywords(params).subscribe({
            next: (data: Page<KeywordResponse>) => {
                this.keywords.set(data.list);   
                this.page = data.page;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar palavras-chave',
                    life: 3000
                });
                console.error('Erro ao carregar palavras-chave:', error);
            },
            complete: () => {
                this.loading = false;
            }
        });

        this.cols = [
            { field: 'brand.client.st_name', header: 'Cliente' },
            { field: 'brand.st_brand', header: 'Marca' },
            { field: 'st_keyword', header: 'Palavra-chave' },
            { field: 'st_status', header: 'Status' },
            { field: 'dt_created', header: 'Data Criação' },
            { field: 'st_created_by', header: 'Criado por' }
        ];
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

    startCrawler(keyword: KeywordResponse) {
        this.schedulerService.startCrawler({
            id_keyword: keyword.id_keyword
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

    getStatusLabel(status: string): string {
        return status === 'active' ? 'Ativo' : 'Inativo';
    }
}
