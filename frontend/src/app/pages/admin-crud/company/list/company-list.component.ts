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
import { CompanyService } from '../../../service/company.service';
import { Company, CompanyResponse, CompanyRequest } from '../../../models/company.model';
import { Column, ExportColumn, Page } from '../../../models/global.model';
import { Router } from '@angular/router';

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
    templateUrl: './company-list.component.html',
    providers: [MessageService, ConfirmationService]
})
export class CompanyList implements OnInit {
    companyDialog: boolean = false;

    companies = signal<Company[]>([]);

    company!: Company;

    selectedCompanies!: Company[] | null;

    submitted: boolean = false;

    statuses!: any[];

    createStatuses: any[] = [
        { label: 'Ativo', value: 'ACTIVE' },
        { label: 'Lead', value: 'LEAD' }
    ];

    editStatuses: any[] = [
        { label: 'Ativo', value: 'ACTIVE' },
        { label: 'Inativo', value: 'INACTIVE' },
        { label: 'Lead', value: 'LEAD' }
    ];

    isValidCNPJ: boolean = true;

    isDuplicatedCNPJ: boolean = false;

    isEditing: boolean = false;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];

    cols!: Column[];

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private companyService: CompanyService,
        private router: Router
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadDataAndFields();
    }

    loadDataAndFields() {
        this.companyService.getClients().subscribe({
            next: (data: Page<CompanyResponse>) => {
                const mappedCompanies: Company[] = data.list.map((item: CompanyResponse) => ({
                    id: item.id,
                    name: item.st_name,
                    identification: item.st_document,
                    status: item.st_status.toLowerCase()
                }));
                this.companies.set(mappedCompanies);
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar os clientes',
                    life: 3000
                });
                console.error('Erro ao carregar clientes:', error);
                // Carrega dados mockados em caso de erro
                this.companies.set(this.generateRandomClients());
            }
        });

        this.cols = [
            { field: 'id', header: 'ID', customExportHeader: 'ID da Empresa' },
            { field: 'name', header: 'Razão Social' },
            { field: 'identification', header: 'CNPJ' },
            { field: 'status', header: 'Situação' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.router.navigate(['/cadastro/cliente/detalhe', 'novo']);
    }

    editCompany(company: Company) {
        this.router.navigate(['/cadastro/cliente/detalhe', company.id]);
    }

    deleteSelectedCompanies() {
        this.confirmationService.confirm({
            message: 'Confirma a exclusão dos clientes selecionados?',
            header: 'Confirmação',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim',
            rejectLabel: 'Não',
            accept: () => {
                this.companies.set(this.companies().filter((val) => !this.selectedCompanies?.includes(val)));
                this.selectedCompanies = null;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Clientes apagados',
                    life: 3000
                });
            }
        });
    }

    hideDialog() {
        this.companyDialog = false;
        this.submitted = false;
    }

    deleteCompany(company: Company) {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir ' + company.name + '?',
            header: 'Confirmação',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim',
            rejectLabel: 'Não',
            accept: () => {
                // Prepara o objeto de requisição mantendo os dados atuais e alterando apenas o status
                const companyRequest: CompanyRequest = {
                    st_name: company.name!,
                    st_document: company.identification!.replace(/[^\d]/g, ''),
                    st_status: 'INACTIVE'
                };

                this.companyService.putClient(company.id!, companyRequest).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Cliente inativado com sucesso',
                            life: 3000
                        });
                        this.loadDataAndFields(); // Recarrega a lista
                    },
                    error: (error) => {
                        console.error('Erro ao inativar cliente:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao inativar cliente',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.companies().length; i++) {
            if (this.companies()[i].id === id) {
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

    getSeverity(status?: string) {
        switch (status) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'danger';
            default:
                return 'info';
        }
    }

    getLabelSeverity(status?: string) {
        switch (status) {
            case 'active':
                return 'Ativo';
            case 'inactive':
                return 'Inativo';
            default:
                return 'Lead';
        }
    }

    validateCNPJ(cnpj: string): boolean {
        // Remove caracteres não numéricos
        cnpj = cnpj.replace(/[^\d]/g, '');

        // Verifica se tem 14 dígitos
        if (cnpj.length !== 14) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(cnpj)) return false;

        // Validação dos dígitos verificadores
        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0, tamanho);
        const digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;

        // Primeiro dígito verificador
        for (let i = tamanho; i >= 1; i--) {
            soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
            if (pos < 2) pos = 9;
        }

        let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado !== parseInt(digitos.charAt(0))) return false;

        // Segundo dígito verificador
        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;

        for (let i = tamanho; i >= 1; i--) {
            soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
            if (pos < 2) pos = 9;
        }

        resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado !== parseInt(digitos.charAt(1))) return false;

        return true;
    }

    validateCompanyIdentification() {
        if (this.company.identification) {
            this.isValidCNPJ = this.validateCNPJ(this.company.identification);
            
            // Verifica se o CNPJ já existe
            if (this.isValidCNPJ && !this.isEditing) {
                const normalizedCNPJ = this.company.identification.replace(/[^\d]/g, '');
                this.isDuplicatedCNPJ = this.companies().some(comp => 
                    comp.identification?.replace(/[^\d]/g, '') === normalizedCNPJ
                );
            } else {
                this.isDuplicatedCNPJ = false;
            }
        } else {
            this.isValidCNPJ = true;
            this.isDuplicatedCNPJ = false;
        }
    }

    saveCompany() {
        this.submitted = true;

        if (!this.company.name?.trim()) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Nome é obrigatório',
                life: 3000
            });
            return;
        }

        if (!this.company.identification) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'CNPJ é obrigatório',
                life: 3000
            });
            return;
        }

        // Valida CNPJ
        if (!this.validateCNPJ(this.company.identification)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'CNPJ inválido',
                life: 3000
            });
            return;
        }

        // Verifica CNPJ duplicado
        if (!this.isEditing && this.isDuplicatedCNPJ) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'CNPJ já cadastrado',
                life: 3000
            });
            return;
        }

        // Prepara o objeto de requisição com os dados do formulário
        const companyRequest: CompanyRequest = {
            st_name: this.company.name.trim(),
            st_document: this.company.identification.replace(/[^\d]/g, ''), // Remove caracteres não numéricos do CNPJ
            st_status: this.company.status || 'ACTIVE'
        };

        if (this.company.id) {
            // Atualizar cliente existente
            this.companyService.putClient(this.company.id, companyRequest).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Sucesso',
                        detail: 'Cliente atualizado',
                        life: 3000
                    });
                    this.loadDataAndFields(); // Recarrega a lista
                },
                error: (error) => {
                    console.error('Erro ao atualizar cliente:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Erro ao atualizar cliente',
                        life: 3000
                    });
                }
            });
        } else {
            // Criar novo cliente
            this.companyService.postClient(companyRequest).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Sucesso',
                        detail: 'Cliente criado',
                        life: 3000
                    });
                    this.loadDataAndFields(); // Recarrega a lista
                },
                error: (error) => {
                    console.error('Erro ao criar cliente:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Erro ao criar cliente',
                        life: 3000
                    });
                }
            });
        }

        this.companyDialog = false;
        this.company = {};
    }

    generateRandomClients(): Company[] {
        const statuses = ["active", "inactive", "lead"];
        const clients: Company[] = [];

        for (let i = 0; i < 30; i++) {
            const id = `${i + 1}`;
            const name = `Client ${id}`;
            const identification = this.generateRandomCNPJ();
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            clients.push({ id, name, identification, status });
        }

        return clients;
    }

    generateRandomCNPJ() {
        const getRandomDigit = () => Math.floor(Math.random() * 10);
        const cnpj = Array.from({ length: 14 }, getRandomDigit).join("");
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    }
}
