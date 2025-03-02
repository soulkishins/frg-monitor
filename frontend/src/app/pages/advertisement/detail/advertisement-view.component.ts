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
import { Advertisement, ClientBrandProduct } from '../../models/advertisement.model';
import { SplitButtonModule } from 'primeng/splitbutton';
import { GalleriaModule } from 'primeng/galleria';
import { ActivatedRoute, Router } from '@angular/router';

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
        ConfirmDialogModule
    ],
    templateUrl: './advertisement-view.component.html',
    providers: [MessageService, AdvertisementService, ConfirmationService]
})
export class AdvertisementDetail implements OnInit {
    advertisement: {[prop: string]: any} = {};
    products?: ClientBrandProduct[] = [];

    statuses!: any[];


    constructor(
        private advertisementService: AdvertisementService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.statuses = this.advertisementService.getStatuses();

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
}
