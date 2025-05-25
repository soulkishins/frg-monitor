import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { PrimeIcons } from 'primeng/api';

@Component({
    selector: 'app-ads-status-widget',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
        <p-card header="Status dos Anúncios" styleClass="shadow-2">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-4">
                    <div class="surface-card p-4 border-round">
                        <div class="flex align-items-center justify-content-between mb-3 gap-2">
                            <div>
                                <span class="block text-500 font-medium mb-3">Novos</span>
                                <div class="text-900 font-medium text-xl">120</div>
                            </div>
                            <div class="flex align-items-center justify-content-center border-round" style="width:2.5rem;height:2.5rem">
                                <i class="pi pi-plus-circle text-green-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-4">
                    <div class="surface-card p-4 border-round">
                        <div class="flex align-items-center justify-content-between mb-3 gap-2">
                            <div>
                                <span class="block text-500 font-medium mb-3">Atualizados</span>
                                <div class="text-900 font-medium text-xl">150</div>
                            </div>
                            <div class="flex align-items-center justify-content-center border-round" style="width:2.5rem;height:2.5rem">
                                <i class="pi pi-sync text-blue-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-4">
                    <div class="surface-card p-4 border-round">
                        <div class="flex align-items-center justify-content-between mb-3 gap-2">
                            <div>
                                <span class="block text-500 font-medium mb-3">Erros</span>
                                <div class="text-900 font-medium text-xl">30</div>
                            </div>
                            <div class="flex align-items-center justify-content-center border-round" style="width:2.5rem;height:2.5rem">
                                <i class="pi pi-times-circle text-red-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </p-card>
    `
})
export class AdsStatusWidget {} 