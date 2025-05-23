import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
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
import { DropdownModule } from 'primeng/dropdown';
import { AdvertisementService } from '../../service/advertisement.service';
import { ProductService } from '../../service/product.service';
import { ProductResponse } from '../../models/product.model';
import { Page } from '../../models/global.model';
import { PanelModule } from 'primeng/panel';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { FluidModule } from 'primeng/fluid';
import { TooltipModule } from 'primeng/tooltip';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Advertisement, AdvertisementHistory, ClientBrand, ClientBrandProduct, Client, Variety, AdvertisementProduct, AdvertisementProductPostRequest } from '../../models/advertisement.model';
import { SplitButtonModule } from 'primeng/splitbutton';
import { GalleriaModule } from 'primeng/galleria';
import { ActivatedRoute, Router } from '@angular/router';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputGroupModule } from 'primeng/inputgroup';
import { Table } from 'primeng/table';
import { isReactive } from '@angular/core/primitives/signals';

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
        SplitButtonModule,
        GalleriaModule,
        DialogModule,
        ToastModule,
        ConfirmDialogModule,
        InputGroupModule,
        InputGroupAddonModule,
        DropdownModule
    ],
    templateUrl: './advertisement-view.component.html',
    providers: [MessageService, AdvertisementService, ConfirmationService, ProductService]
})
export class AdvertisementDetail implements OnInit {
    @ViewChild('dt') dt: Table | undefined;
    advertisement: Partial<Advertisement> = {};
    brand: Partial<ClientBrand> & { id_brand?: string } = {};
    client: Partial<Client> = {};
    products: ClientBrandProduct[] = [];
    history: AdvertisementHistory[] = [];

    statuses!: any[];
    actions!: any[];
    productActions = [
        { label: 'Recomendado', value: 'RE' },
        { label: 'Não Recomendado', value: 'NR' },
        { label: 'Manual', value: 'MA' }
    ];

    displayModal: boolean = false;
    selectedProductForEdit: any = {};
    selectedProduct: ProductResponse | null = null;
    selectedVariety: Variety | null = null;
    quantity: number = 1;
    availableProducts: ProductResponse[] = [];
    filteredProducts: ProductResponse[] = [];
    availableVarieties: any[] = [];
    loading: boolean = false;
    isEditQuantityProduct: boolean = false;
    titleModal: string = '';
    editProduct: ClientBrandProduct | null = null;
    productSave: AdvertisementProductPostRequest = {
        id_advertisement: '',
        id_product: '',
        st_varity_seq: '',
        st_varity_name: '',
        nr_quantity: 0,
        en_status: ''
    };
    
    constructor(
        public advertisementService: AdvertisementService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router,
        private route: ActivatedRoute,
        private productService: ProductService
    ) {}

    ngOnInit() {
        this.statuses = this.advertisementService.getStatuses();
        this.actions = this.advertisementService.getActions();

        this.route.paramMap.subscribe({
            next: (params: any) => {
                const id = params.get('id');
                if (id) {
                    this.advertisementService
                    .getAdvertisement(id)
                    .subscribe({
                        next: (advertisement: Advertisement) => {
                            this.advertisement = advertisement;
                            this.advertisement.st_status = this.statuses.find((status: any) => status.value === this.advertisement.st_status);
                            this.advertisement.db_price = this.advertisement.db_price?.toString().replace(".", ",");
                            this.brand = advertisement.brand;
                            this.client = advertisement.brand?.client;
                            this.products = advertisement.products.map(product => this.mapProduct(product));
                            const details = JSON.parse(advertisement.st_details as string);
                            if (details.details?.originalPrice) {
                                advertisement.db_original_price = details.details.originalPrice.toString().replace(".", ",");
                            } else {
                                advertisement.db_original_price = advertisement.db_price;
                            }
                            this.getHistory(id);
                        },
                        error: (error: any) => {
                            console.log(error);
                        }
                    });

                }
            },
            error: (error: any) => {
                console.log(error);
            }
        });
    }

    viewHistory(advertisement: Advertisement) {
        //this.router.navigate(['/advertisement', advertisement.id]);
    }

    getStatus(status: string): string | undefined {
        const st = this.statuses.filter(s => s.value === status)[0];
        if (st)
            return st.label;
        return undefined;
    }

    getAction(action: string): string | undefined {
        const ac = this.actions.filter(a => a.value === action)[0];
        if (ac)
            return ac.label;
        else
            return action;
    }

    openUrl() {
        window.open(this.advertisement.st_url, '_blank');
    }

    goBack() {
        this.router.navigate(['/anuncio', 'lista']);
    }

    updateStatusAdvertisements(status: string, statusLabel: string, successMessage: string) {
        this.advertisementService
        .updateStatusAdvertisements([this.advertisement.id_advertisement!], status)
        .subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: successMessage,
                    detail: 'Anúncio atualizado com sucesso!',
                    life: 3000
                });
                this.advertisement.st_status = this.statuses.find((status: any) => status.value === status);
            },
            error: (error: any) => {
                console.error('Erro ao atualizar status do anúncio:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: `Erro ao atualizar o status do anúncio para ${statusLabel}`,
                    life: 3000
                });
            }
        });
    }

    reviewedAdvertisement() {
        this.confirmationService.confirm({
            message: 'Confirmar a revisão do anúncio?',
            header: 'Confirmar Revisão',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.updateStatusAdvertisements('REVIEWED', 'Revisado', 'Revisão Confirmada')
        });
    }

    toReviewAdvertisement() {
        this.confirmationService.confirm({
            message: 'Confirmar a revisão do anúncio?',
            header: 'Confirmar Em Revisão',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.updateStatusAdvertisements('MANUAL', 'Em Revisão', 'Aguardando Revisão Confirmada')
        });
    }

    reportAdvertisement() {
        this.confirmationService.confirm({
            message: 'Confirmar a denúncia do anúncio?',
            header: 'Confirmar Denúncia',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.updateStatusAdvertisements('REPORT', 'Marcado para Denúncia', 'Denúncia Confirmada')
        });
    }

    invalidateAdvertisement() {
        this.confirmationService.confirm({
            message: 'Confirmar a invalidação do anúncio?',
            header: 'Confirmar Invalidação',
            icon: 'pi pi-exclamation-triangle',
            accept: () => this.updateStatusAdvertisements('INVALIDATE', 'Invalidado', 'Invalidação Confirmada')
        });
    }

    showModal(isEdit: boolean = false, product: ClientBrandProduct | null = null) {
        if (isEdit) {
            this.isEditQuantityProduct = true;
            this.titleModal = 'Alterar Quantidade';
            this.editProduct = product;
            this.quantity = product?.nr_quantity || 0;
        } else {
            this.isEditQuantityProduct = false;
            this.titleModal = 'Adicionar Produto';
            this.quantity = 0;
        }
        
        this.displayModal = true;
        this.loadAvailableProducts();
    }

    loadAvailableProducts() {
        if (this.advertisement.id_brand) {
            this.loading = true;
            this.productService.getProducts({ 
                id_brand: this.advertisement.id_brand,
                sort: 'st_brand asc'
            })
                .subscribe({
                    next: (response: Page<ProductResponse>) => {
                        this.availableProducts = response.list || [];
                        this.filteredProducts = [...this.availableProducts];
                        this.loading = false;
                    },
                    error: (error) => {
                        console.error('Erro ao carregar produtos:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao carregar a lista de produtos',
                            life: 3000
                        });
                        this.loading = false;
                    }
                });
        }
    }

    filterProducts(event: any) {
        const query = event.filter?.toLowerCase() || '';
        this.filteredProducts = this.availableProducts.filter(product => 
            product.st_product.toLowerCase().includes(query)
        );
    }

    onProductChange() {
        if (this.selectedProduct) {
            try {
                const varieties = JSON.parse(this.selectedProduct.st_variety as string);
                this.availableVarieties = varieties.map((v: any) => ({
                    seq: v.seq,
                    variety: v.variety,
                    price: v.price,
                    status: v.status
                }));
                this.selectedVariety = null;
            } catch (error) {
                console.error('Erro ao converter variedades:', error);
                this.availableVarieties = [];
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar as variedades do produto',
                    life: 3000
                });
            }
        }
    }

    saveProduct() {
        if (this.isEditQuantityProduct) {
            this.updateQuantityProduct();
        } else {
            this.addProduct();
        }
    }

    addProduct() {
        if (this.selectedProduct && this.selectedVariety && this.quantity > 0) {
            this.productSave.id_advertisement = this.advertisement.id_advertisement!;
            this.productSave.id_product = this.selectedProduct.id_product!;
            this.productSave.st_varity_seq = this.selectedVariety.seq.toString();
            this.productSave.st_varity_name = this.selectedVariety.variety;
            this.productSave.nr_quantity = this.quantity;
            this.productSave.en_status = 'MI';

            this.advertisementService.postAdvertisementProduct(this.advertisement.id_advertisement!, this.productSave).subscribe({  
                next: () => {
                    this.displayModal = false;
                    this.addHistory(this.advertisement.id_advertisement!, 'INSERTED', `No anuncio, adição manual do produto: ${this.selectedProduct?.st_product}`);
                    this.advertisementService.getAdvertisementProduct(this.advertisement.id_advertisement!).subscribe({
                        next: (products: Page<AdvertisementProduct>) => {
                            this.products = products.list?.map(product => this.mapProduct(product));
                        },
                        error: (error: any) => {
                            console.error('Erro ao recarregar os produtos:', error);
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erro',
                                detail: 'Erro ao recarregar os produtos',
                                life: 3000
                            });
                        }
                    });
                },
                error: (error: any) => {
                    console.error('Erro ao adicionar o produto:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Erro ao adicionar o produto',
                        life: 3000
                    });
                }
            });
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Por favor, preencha todos os campos!',
                life: 3000
            });
        }
    }

    updateQuantityProduct() {
        this.advertisementService.putAdvertisementProduct(this.advertisement.id_advertisement!, this.editProduct!.id_product!, this.editProduct!.st_variety_seq!, {
            nr_quantity: this.quantity
        }).subscribe({
            next: () => {
                this.addHistory(this.advertisement.id_advertisement!, 'UPDATED', `No anuncio, alteração manual da quantidade do produto: ${this.editProduct?.st_product}`);
                this.advertisementService.getAdvertisementProduct(this.advertisement.id_advertisement!).subscribe({
                    next: (products: Page<AdvertisementProduct>) => {
                        this.products = products.list?.map(product => this.mapProduct(product));
                    },
                    error: (error: any) => {
                        console.error('Erro ao recarregar os produtos:', error);
                    }
                });
                this.messageService.add({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Quantidade atualizada com sucesso!',
                    life: 3000
                });
            },
            error: (error: any) => {
                console.error('Erro ao atualizar a quantidade do produto:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao atualizar a quantidade do produto',
                    life: 3000
                });
            },
            complete: () => { this.displayModal = false; }
        });
    }

    getStatusProduct(status: string): string | undefined {
        if (status == 'AR')
            return 'Localizado';
        if (status == 'NR')
            return 'Não Localizado';
        if (status == 'AI')
            return 'Aumotático';
        if (status == 'MI')
            return 'Inclusão Manual';
        if (status == 'MR')
            return 'Conciliação Manual';
        if (status == 'ER')
            return 'Erro';
        return undefined;
    }

    getQuantity(quantity: number): string {
        if (!quantity)
            return '0';
        return quantity.toString();
    }

    onProductStatusChange(product: any, newStatus: string) {
        this.confirmationService.confirm({
            message: `Deseja alterar o status do produto para "${this.getStatusProduct(newStatus)}"?`,
            header: 'Confirmar Alteração',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.advertisementService.postAdvertisementProduct(this.advertisement.id_advertisement!, {
                    id_advertisement: this.advertisement.id_advertisement!,
                    id_product: product.id_product,
                    st_varity_seq: product.st_varity_seq,
                    st_varity_name: product.st_variety_name,
                    nr_quantity: product.nr_quantity,
                    en_status: newStatus
                }).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Status do produto atualizado com sucesso!',
                            life: 3000
                        });
                        product.st_status = newStatus;
                    },
                    error: (error) => {
                        console.error('Erro ao atualizar status do produto:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao atualizar o status do produto',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    getActionProduct(product: ClientBrandProduct): any[] {
        let dropdownActions: MenuItem[] = [];

        if (product.st_status == 'MI') {
            dropdownActions.push({
                 label: 'Delete', 
                 icon: 'pi pi-fw pi-trash', 
                 command: () => {this.deleteAdvertisementProduct(product);}
            });
        }
        if (product.st_status == 'MR' || product.st_status == 'AR' || product.st_status == 'AI') {
            dropdownActions.push({
                 label: 'Marcar Erro', 
                 icon: 'pi pi-fw pi-exclamation-triangle', 
                 command: () => {this.changeStatusAdvertisementProduct(product, 'ER');} });
        }
        if (product.st_status == 'NR' || product.st_status == 'ER') {
            dropdownActions.push({ 
                label: 'Marcar como Conciliação Manual', 
                icon: 'pi pi-fw pi-user-edit', 
                command: () => {this.changeStatusAdvertisementProduct(product, 'MR');} });
        }

        dropdownActions.push({ separator: true });
        dropdownActions.push({
            label: 'Trocar Quantidade', 
            icon: 'pi pi-fw pi-refresh',
            command: () => {this.showModal(true,product);}
        });

        return dropdownActions;
    }

    clickActionProduct(event: any) {
        console.log(event);
    }

    actionAdvertisementProductRow(product: any) {
        if (this.dt) {
            this.dt.selection = product;
        }
    }

    changeStatusAdvertisementProduct(product: ClientBrandProduct, status: string) {
        let params = {
            en_status: status
        };
        this.advertisementService.putAdvertisementProduct(this.advertisement.id_advertisement!, product.id_product!, product.st_variety_seq!, params).subscribe({
            next: () => {
                this.addHistory(this.advertisement.id_advertisement!, status, `No anuncio, alteração manual do status do produto: ${product.st_product}`);
                this.advertisementService.getAdvertisementProduct(this.advertisement.id_advertisement!).subscribe({
                    next: (products: Page<AdvertisementProduct>) => {
                        this.products = products.list?.map(product => this.mapProduct(product));
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Status do produto atualizado com sucesso!',
                            life: 3000
                        });
                    },
                    error: (error: any) => {
                        console.error('Erro ao recarregar os produtos:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao recarregar os produtos',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    deleteAdvertisementProduct(product: ClientBrandProduct) {
        this.advertisementService.deleteAdvertisementProduct(this.advertisement.id_advertisement!, product.id_product!, product.st_variety_seq!).subscribe({
            next: () => {
                this.addHistory(this.advertisement.id_advertisement!, 'DELETED', `No anuncio, exclusão manual do produto: ${product.st_product}`);
                this.advertisementService.getAdvertisementProduct(this.advertisement.id_advertisement!).subscribe({
                    next: (products: Page<AdvertisementProduct>) => {
                        this.products = products.list?.map(product => this.mapProduct(product));
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Produto deletado com sucesso!',
                            life: 3000
                        });                        
                    },
                    error: (error: any) => {
                        console.error('Erro ao recarregar os produtos:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao recarregar os produtos',
                            life: 3000
                        });
                    }
                });
            },
            error: (error: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao deletar o produto',
                    life: 3000
                });
            }
        });
    }

    private mapProduct(product: any): any {
        product.product.st_variety = JSON.parse(product.product.st_variety as string);
        const varieties = product.product.st_variety as Variety[];
        product.product.st_variety_name = varieties.find((v: Variety) => v.seq == product.st_varity_seq)?.variety;
        product.product.db_price = varieties.find((v: Variety) => v.seq == product.st_varity_seq)?.price;
        product.product.nr_quantity = product.nr_quantity;
        product.product.st_status = product.en_status;
        product.product.id_product = product.id_product;
        product.product.items = this.getActionProduct(product.product);
        product.product.st_variety_seq = product.st_varity_seq;
        return product.product;
    }

    private getHistory(id: string) {
        this.advertisementService
        .getAdvertisementHistory(id)
        .subscribe({
            next: (history: AdvertisementHistory[]) => {
                this.history = history;
            },
            error: (error: any) => {
                console.log(error);
            }
        });        
    }

    private addHistory(id_advertisement: string, status: string, action: string) {
        let paramsHistory = {
            id: id_advertisement,
            status: status,
            action: action
        };
        this.advertisementService.postAdvertisementProductHistory(id_advertisement, paramsHistory).subscribe({
            next: () => {
                this.getHistory(id_advertisement);
            },
            error: (error: any) => {
                console.error('Erro ao adicionar o histórico do produto:', error);
            }
        });
    }
}
