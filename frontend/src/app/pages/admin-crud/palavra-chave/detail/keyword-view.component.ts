import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { KeywordService } from '../../../service/keyword.service';
import { CompanyService } from '../../../service/company.service';
import { BrandService } from '../../../service/brand.service';
import { ProductService } from '../../../service/product.service';
import { KeywordResponse, KeywordRequest } from '../../../models/keyword.model';
import { CompanyResponse } from '../../../models/company.model';
import { BrandResponse } from '../../../models/brand.model';
import { ProductResponse } from '../../../models/product.model';
import { ActivatedRoute, Router } from '@angular/router';

interface ProductVariety {
    seq: string;
    variety: string;
    price: number;
    status: string;
}

interface ProcessedProduct extends ProductResponse {
    variety: string;
    price: number;
    flagCadastro?: string;
}

@Component({
    selector: 'app-keyword-view',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        DropdownModule,
        TableModule
    ],
    templateUrl: './keyword-view.component.html',
    providers: [MessageService, KeywordService, CompanyService, BrandService, ProductService]
})
export class KeywordView implements OnInit {
    isEditing: boolean = false;
    keyword!: KeywordResponse;
    submitted: boolean = false;
    clients: CompanyResponse[] = [];
    brands: BrandResponse[] = [];
    selectedClient: string = '';
    produtos: ProcessedProduct[] = [];

    statusOptions = [
        { label: 'Ativo', value: 'active' },
        { label: 'Inativo', value: 'inactive' }
    ];

    constructor(
        private keywordService: KeywordService,
        private companyService: CompanyService,
        private brandService: BrandService,
        private productService: ProductService,
        private messageService: MessageService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        this.keyword = {
            st_keyword: '',
            st_status: 'active'
        } as KeywordResponse;
        
        this.loadClients();
        this.loadProdutos();
        
        // Obter o ID da rota
        this.route.params.subscribe(params => {
            const keywordId = params['id'];
            if (keywordId && keywordId !== 'novo') {
                this.isEditing = true;
                this.loadKeyword(keywordId);
            }
        });
    }

    loadClients() {
        this.companyService.getClients().subscribe(
            (response) => {
                if (response && Array.isArray(response.list)) {
                    this.clients = response.list;
                }
            },
            (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar clientes',
                    life: 3000
                });
            }
        );
    }

    onClientChange(event: any) {
        const clientId = event.value;
        if (clientId) {
            this.brandService.getBrands().subscribe({
                next: (brands) => {
                    this.brands = brands.list.filter(brand => brand.id_client === clientId);
                },
                error: (error) => {
                    console.error('Erro ao carregar marcas:', error);
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Erro', 
                        detail: 'Erro ao carregar marcas', 
                        life: 3000 
                    });
                }
            });
        } else {
            this.brands = [];
        }
        this.keyword.id_brand = '';
    }

    loadKeyword(id: string) {
        this.keywordService.getKeyword(id).subscribe(
            (data: KeywordResponse) => {
                this.keyword = data;
                
                // Carregar cliente e marca
                if (this.keyword.brand?.client) {
                    this.selectedClient = this.keyword.brand.client.id;
                    this.loadBrands(this.selectedClient);
                }
            },
            (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar palavra-chave',
                    life: 3000
                });
            }
        );
    }

    loadBrands(clientId: string) {
        if (!clientId) {
            this.brands = [];
            return;
        }
        this.brandService.getBrands().subscribe({
            next: (data) => {
                this.brands = data.list.filter(b => b.id_client === clientId);
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar marcas',
                    life: 3000
                });
            }
        });
    }

    loadProdutos() {
        this.productService.getProducts({}).subscribe({
            next: (response) => {
                const produtosProcessados: ProcessedProduct[] = [];
                
                response.list.forEach(produto => {
                    try {
                        const variedades: ProductVariety[] = JSON.parse(produto.st_variety || '[]');
                        
                        variedades.forEach(variedade => {
                            if (variedade.status !== 'deleted') {
                                produtosProcessados.push({
                                    ...produto,
                                    variety: variedade.variety,
                                    price: variedade.price,
                                    flagCadastro: new Date(produto.dt_created).toLocaleDateString('pt-BR')
                                });
                            }
                        });
                    } catch (e) {
                        console.error('Erro ao processar variedades do produto:', e);
                        // Se houver erro no parse, adiciona o produto sem variedades
                        produtosProcessados.push({
                            ...produto,
                            variety: 'N/A',
                            price: 0,
                            flagCadastro: new Date(produto.dt_created).toLocaleDateString('pt-BR')
                        });
                    }
                });
                
                this.produtos = produtosProcessados;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar produtos',
                    life: 3000
                });
            }
        });
    }

    goBack() {
        this.router.navigate(['/cadastro/palavra-chave/lista']);
    }

    saveKeyword() {
        this.submitted = true;
        
        if (this.keyword.st_keyword?.trim() && this.keyword.st_status) {
            const keywordRequest: KeywordRequest = {
                st_keyword: this.keyword.st_keyword,
                st_status: this.keyword.st_status
            };

            if (this.keyword.id_keyword) {
                // Atualizar palavra-chave existente
                this.keywordService.putKeyword(this.keyword.id_keyword, keywordRequest).subscribe(
                    (response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Palavra-chave Atualizada',
                            life: 3000
                        });
                        this.goBack();
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao atualizar palavra-chave',
                            life: 3000
                        });
                    }
                );
            } else {
                // Criar nova palavra-chave
                this.keywordService.postKeyword(keywordRequest).subscribe(
                    (response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Palavra-chave Criada',
                            life: 3000
                        });
                        this.goBack();
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao criar palavra-chave',
                            life: 3000
                        });
                    }
                );
            }
        }
    }
}
