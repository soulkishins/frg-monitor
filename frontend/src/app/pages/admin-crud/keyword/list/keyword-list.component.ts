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
import { KeywordService } from '../../../service/keyword.service';
import { KeywordResponse } from '../../../models/keyword.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
@Component({
    selector: 'app-keyword-list',
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
    templateUrl: './keyword-list.component.html',
    providers: [MessageService, KeywordService, ConfirmationService]
})
export class KeywordList implements OnInit {
    keywordDialog: boolean = false;

    keywords = signal<KeywordResponse[]>([]);
    
    // Propriedades de paginação
    page: {
        total: number;
        limit: number;
        offset: number;
        sort?: string;
    } = {total: 0, limit: 50, offset: 0, sort: 'st_keyword'};
    searchTerm: string = '';
    loading: boolean = false;

    keyword!: KeywordResponse;

    selectedKeywords!: KeywordResponse[] | null;

    submitted: boolean = false;

    statusOptions = [
        { label: 'Ativo', value: 'active' },
        { label: 'Inativo', value: 'inactive' }
    ];

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    filterChange = new EventEmitter<string>(); // Emissor de eventos

    constructor(
        private keywordService: KeywordService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    exportCSV() {
        const data = this.keywords().map(keyword => ({
            'Cliente': keyword.brand?.client?.st_name || '',
            'Marca': keyword.brand?.st_brand || '',
            'Palavra-chave': keyword.st_keyword || '',
            'Status': this.getStatusLabel(keyword.st_status)
        }));
        
        const csvContent = this.convertToCSV(data);
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'lista_palavras_chave.csv');
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
            debounceTime(500), // Espera 500ms para evitar chamadas excessivas
            distinctUntilChanged(),
            switchMap(value => value)
        ).subscribe(response => {
            this.dt.reset();
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
        params['page.sort'] = `${event.sortField || this.page.sort}${event.sortOrder !== -1 ? '.asc' : '.desc'}`;

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
        this.router.navigate(['/cadastro/palavra-chave/detalhe', 'novo']);
    }

    editKeyword(keyword: KeywordResponse) {
        this.router.navigate(['/cadastro/palavra-chave/detalhe', keyword.id_keyword]);
    }

    deleteSelectedKeywords() {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir as palavras-chave selecionadas?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedKeywords) {
                    // Criar um array de Promises para todas as exclusões
                    const deletePromises = this.selectedKeywords.map(keyword => 
                        this.keywordService.deleteKeyword(keyword.id_keyword).toPromise()
                    );

                    // Executar todas as exclusões em paralelo
                    Promise.all(deletePromises)
                        .then(() => {
                            this.keywords.set(this.keywords().filter((val) => !this.selectedKeywords?.includes(val)));
                            this.selectedKeywords = null;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Sucesso',
                                detail: 'Palavras-chave Excluídas',
                                life: 3000
                            });
                        })
                        .catch(() => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erro',
                                detail: 'Erro ao excluir palavras-chave',
                                life: 3000
                            });
                        });
                }
            }
        });
    }

    hideDialog() {
        this.keywordDialog = false;
        this.submitted = false;
    }

    deleteKeyword(keyword: KeywordResponse) {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir a palavra-chave ' + keyword.st_keyword + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.keywordService.deleteKeyword(keyword.id_keyword).subscribe(
                    (response) => {
                        this.keywords.set(this.keywords().filter((val) => val.id_keyword !== keyword.id_keyword));
                        this.keyword = {} as KeywordResponse;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Palavra-chave Excluída',
                            life: 3000
                        });
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao excluir palavra-chave',
                            life: 3000
                        });
                    }
                );
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.keywords().length; i++) {
            if (this.keywords()[i].id_keyword === id) {
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

    navigateToKeywords() {
        this.router.navigate(['/cadastro/palavra-chave/lista']);
    }

    startCrawler(keyword: KeywordResponse) {
        this.keywordService.startCrawler(
            {
                id_keyword: keyword.id_keyword,
                idBrand: keyword.id_brand,
                keyword: keyword.st_keyword,
                brandProducts: JSON.parse(keyword.st_product)
            }
        ).subscribe({
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
