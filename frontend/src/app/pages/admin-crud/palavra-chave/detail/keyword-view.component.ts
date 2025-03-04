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
    produtosFiltrados: ProcessedProduct[] = [];
    selectedProducts: ProcessedProduct[] = [];

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
                    this.keyword.brand = null as any;
                    this.filtrarProdutos();
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
            this.keyword.brand = null as any;
        }
        this.keyword.id_brand = '';
        this.filtrarProdutos();
    }

    onBrandChange(event: any) {
        const selectedBrand = this.brands.find(brand => brand.id_brand === event.value);
        const selectedClient = this.clients.find(client => client.id === selectedBrand?.id_client);
        if (selectedBrand && selectedClient) {
            this.keyword.brand = {
                ...selectedBrand,
                client: selectedClient
            };
            
            // Carregar produtos da marca selecionada
            const params = {
                id_brand: event.value
            };
            
            this.productService.getProducts(params).subscribe({
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
                            produtosProcessados.push({
                                ...produto,
                                variety: 'N/A',
                                price: 0,
                                flagCadastro: new Date(produto.dt_created).toLocaleDateString('pt-BR')
                            });
                        }
                    });
                    
                    this.produtos = produtosProcessados;
                    this.produtosFiltrados = [...this.produtos];
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
    }

    filtrarProdutos() {
        this.produtosFiltrados = this.produtos.filter(produto => {
            const matchClient = !this.selectedClient || 
                              (produto.brand?.client?.id === this.selectedClient);
            const matchBrand = !this.keyword.id_brand || 
                             (produto.brand?.id_brand === this.keyword.id_brand);
            
            return matchClient && matchBrand;
        });
    }

    loadProdutos() {
        this.produtos = [];
        this.produtosFiltrados = [];
    }

    loadKeyword(id: string) {
        this.keywordService.getKeyword(id).subscribe(
            (data: KeywordResponse) => {
                this.keyword = data;
                
                // Carregar cliente e marca
                if (this.keyword.brand?.client) {
                    this.selectedClient = this.keyword.brand.client.id;
                    this.loadBrands(this.selectedClient);

                    // Carregar produtos da marca selecionada
                    if (this.keyword.id_brand) {
                        const params = {
                            id_brand: this.keyword.id_brand
                        };
                        
                        // Processar st_product para ter os produtos selecionados
                        let produtosSelecionados: any[] = [];
                        try {
                            produtosSelecionados = JSON.parse(this.keyword.st_product || '[]');
                        } catch (e) {
                            console.error('Erro ao processar st_product:', e);
                        }
                        
                        this.productService.getProducts(params).subscribe({
                            next: (response) => {
                                const produtosProcessados: ProcessedProduct[] = [];
                                
                                response.list.forEach(produto => {
                                    try {
                                        const variedades: ProductVariety[] = JSON.parse(produto.st_variety || '[]');
                                        
                                        variedades.forEach(variedade => {
                                            if (variedade.status !== 'deleted') {
                                                const produtoProcessado = {
                                                    ...produto,
                                                    variety: variedade.variety,
                                                    price: variedade.price,
                                                    flagCadastro: new Date(produto.dt_created).toLocaleDateString('pt-BR')
                                                };
                                                
                                                // Verificar se o produto está no st_product
                                                const produtoSelecionado = produtosSelecionados.find(
                                                    (p: any) => p.id_product === produto.id_product && 
                                                               p.st_varity_name === variedade.variety
                                                );
                                                
                                                if (produtoSelecionado) {
                                                    this.selectedProducts.push(produtoProcessado);
                                                }
                                                
                                                produtosProcessados.push(produtoProcessado);
                                            }
                                        });
                                    } catch (e) {
                                        console.error('Erro ao processar variedades do produto:', e);
                                        produtosProcessados.push({
                                            ...produto,
                                            variety: 'N/A',
                                            price: 0,
                                            flagCadastro: new Date(produto.dt_created).toLocaleDateString('pt-BR')
                                        });
                                    }
                                });
                                
                                this.produtos = produtosProcessados;
                                this.produtosFiltrados = [...this.produtos];
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

    goBack() {
        this.router.navigate(['/cadastro/palavra-chave/lista']);
    }

    saveKeyword() {
        this.submitted = true;
        
        if (this.keyword.st_keyword?.trim() && this.keyword.st_status) {
            const selectedProductsFormatted = this.selectedProducts.map(produto => {
                let variedades;
                try {
                    variedades = JSON.parse(produto.st_variety || '[]');
                } catch (e) {
                    variedades = [];
                }
                
                const variedadeEncontrada = variedades.find((v: any) => v.variety === produto.variety);
                
                return {
                    id_product: produto.id_product,
                    st_varity_seq: variedadeEncontrada?.seq || '',
                    st_varity_name: produto.variety,
                    db_price: produto.price
                };
            });

            const keywordRequest: KeywordRequest = {
                st_keyword: this.keyword.st_keyword,
                st_status: this.keyword.st_status,
                id_brand: this.keyword.id_brand,
                st_product: JSON.stringify(selectedProductsFormatted)
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
