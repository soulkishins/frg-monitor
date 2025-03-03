import { Component, OnInit } from '@angular/core';
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
import { PanelModule } from 'primeng/panel';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { FluidModule } from 'primeng/fluid';
import { TooltipModule } from 'primeng/tooltip';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Advertisement, AdvertisementHistory, ClientBrand, ClientBrandProduct, Client, Variety } from '../../models/advertisement.model';
import { SplitButtonModule } from 'primeng/splitbutton';
import { GalleriaModule } from 'primeng/galleria';
import { ActivatedRoute, Router } from '@angular/router';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputGroupModule } from 'primeng/inputgroup';

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
        InputGroupAddonModule
    ],
    templateUrl: './advertisement-view.component.html',
    providers: [MessageService, AdvertisementService, ConfirmationService]
})
export class AdvertisementDetail implements OnInit {
    advertisement: Partial<Advertisement> = {};
    brand: Partial<ClientBrand> = {};
    client: Partial<Client> = {};
    products: ClientBrandProduct[] = [];
    history: AdvertisementHistory[] = [];

    statuses!: any[];
    actions!: any[];

    constructor(
        public advertisementService: AdvertisementService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.statuses = this.advertisementService.getStatuses();
        this.actions = this.advertisementService.getActions();

        this.route.paramMap.subscribe({
            next: (params: any) => {
                console.log(params);
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
                            this.products = advertisement.products.map(
                                product => {
                                    product.product.st_variety = JSON.parse(product.product.st_variety as string);
                                    const varieties = product.product.st_variety as Variety[];
                                    product.product.st_variety_name = varieties.find((v: Variety) => v.seq === product.st_varity_seq)?.variety;
                                    product.product.db_price = varieties.find((v: Variety) => v.seq === product.st_varity_seq)?.price;
                                    return product.product;
                                }
                            );
                        },
                        error: (error: any) => {
                            console.log(error);
                        }
                    });
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
        return undefined;
    }

    openUrl() {
        window.open(this.advertisement.st_url, '_blank');
    }

    goBack() {
        this.router.navigate(['/anuncio', 'lista']);
    }

    reportAdvertisement() {
        this.confirmationService.confirm({
            message: 'Confirmar a denúncia do anúncio?',
            header: 'Confirmar Denúncia',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.advertisementService
                .updateStatusAdvertisements([this.advertisement.id_advertisement!], 'REPORT')
                .subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Denúncia Confirmada',
                            detail: 'Anúncio atualizado com sucesso!',
                            life: 3000
                        });
                        this.advertisement.st_status = this.statuses.find((status: any) => status.value === 'REPORT');
                    },
                    error: (error: any) => {
                        console.error('Erro ao denunciar o anúncio:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao atualizar o status do anúncio para Marcado para Denúncia',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    invalidateAdvertisement() {
        this.confirmationService.confirm({
            message: 'Confirmar a revisão manual do anúncio?',
            header: 'Confirmar Revisão Manual',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.advertisementService
                .updateStatusAdvertisements([this.advertisement.id_advertisement!], 'INVALIDATE')
                .subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Revisão Manual Confirmada',
                            detail: 'Anúncio atualizado com sucesso!',
                            life: 3000
                        });
                        this.advertisement.st_status = this.statuses.find((status: any) => status.value === 'INVALIDATE');
                    },
                    error: (error: any) => {
                        console.error('Erro ao invalidar o anúncio:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao atualizar o status do anúncio para Revisão Manual',
                            life: 3000
                        });
                    }
                });
            }
        });
    }
}
