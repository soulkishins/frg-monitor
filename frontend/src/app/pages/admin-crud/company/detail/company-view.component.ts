import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-crud',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ReactiveFormsModule,
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
    templateUrl: './company-view.component.html',
    providers: [MessageService, ConfirmationService]
})
export class CompanyView implements OnInit {
    companyDialog: boolean = false;
    companyForm!: FormGroup;

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
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.initForm();
    }

    initForm() {
        this.companyForm = this.formBuilder.group({
            id: [null],
            status: ['ACTIVE', Validators.required],
            name: ['', Validators.required],
            identification: ['', [Validators.required]]
        });
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            const id = params['id'];
            if (id && id !== 'novo') {
                this.loadCompany(id);
                this.statuses = this.editStatuses;
            } else {
                this.statuses = this.createStatuses;
            }
        });
    }

    loadCompany(id: string) {
        this.companyService.getClient(id).subscribe({
            next: (company: CompanyResponse) => {
                this.companyForm.patchValue({
                    id: company.id,
                    name: company.st_name,
                    identification: company.st_document,
                    status: company.st_status
                });
                this.isEditing = true;
            },
            error: (error) => {
                console.error('Erro ao carregar cliente:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar cliente',
                    life: 3000
                });
                this.router.navigate(['/cadastro/cliente/lista']);
            }
        });
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
        this.initForm();
        this.submitted = false;
        this.isValidCNPJ = true;
        this.isDuplicatedCNPJ = false;
        this.isEditing = false;
        this.statuses = this.createStatuses;
        this.companyDialog = true;
    }

    editCompany(company: Company) {
        this.companyForm.patchValue({
            id: company.id,
            status: company.status,
            name: company.name,
            identification: company.identification
        });
        this.isValidCNPJ = true;
        this.isDuplicatedCNPJ = false;
        this.submitted = false;
        this.isEditing = true;
        this.statuses = this.editStatuses;
        this.companyDialog = true;
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
        this.companyForm.reset();
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
        const identification = this.companyForm.get('identification')?.value;
        if (!identification) return;

        const isValid = this.validateCNPJ(identification);
        if (!isValid) {
            this.companyForm.get('identification')?.setErrors({ invalidCnpj: true });
            return;
        }

        // Verificar CNPJ duplicado apenas se for válido
        const isDuplicated = this.companies().some(
            company => company.identification === identification && company.id !== this.companyForm.get('id')?.value
        );

        if (isDuplicated) {
            this.companyForm.get('identification')?.setErrors({ duplicated: true });
        }
    }

    saveCompany() {
        this.submitted = true;

        if (this.companyForm.invalid) {
            return;
        }

        const formValue = this.companyForm.value;
        const companyRequest: CompanyRequest = {
            st_name: formValue.name,
            st_document: formValue.identification.replace(/[^\d]/g, ''),
            st_status: formValue.status.toUpperCase()
        };

        if (formValue.id) {
            // Edição
            this.companyService.putClient(formValue.id, companyRequest).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Sucesso',
                        detail: 'Cliente atualizado com sucesso',
                        life: 3000
                    });
                    this.router.navigate(['/cadastro/cliente/lista']);
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
            // Criação
            this.companyService.postClient(companyRequest).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Sucesso',
                        detail: 'Cliente criado com sucesso',
                        life: 3000
                    });
                    this.router.navigate(['/cadastro/cliente/lista']);
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

    goBack() {
        this.router.navigate(['/cadastro/cliente/lista']);
    }
}
