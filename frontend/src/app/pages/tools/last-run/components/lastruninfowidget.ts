import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { PrimeIcons } from 'primeng/api';

@Component({
    selector: 'app-last-run-info-widget',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
        <p-card header="Última Execução" styleClass="shadow-2">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-6 lg:col-span-3">
                    <div class="surface-card p-4 border-round">
                        <div class="flex align-items-center justify-content-between mb-3 gap-2">
                            <div>
                                <span class="block text-500 font-medium mb-3">Palavra-chave</span>
                                <div class="text-900 font-medium text-xl">iPhone 14 Pro Max</div>
                            </div>
                            <div class="flex align-items-center justify-content-center border-round" style="width:2.5rem;height:2.5rem">
                                <i class="pi pi-tag text-blue-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-6 lg:col-span-3">
                    <div class="surface-card p-4 border-round">
                        <div class="flex align-items-center justify-content-between mb-3 gap-2">
                            <div>
                                <span class="block text-500 font-medium mb-3">Marca</span>
                                <div class="text-900 font-medium text-xl">Apple</div>
                            </div>
                            <div class="flex align-items-center justify-content-center border-round" style="width:2.5rem;height:2.5rem">
                                <i class="pi pi-bookmark text-orange-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-6 lg:col-span-3">
                    <div class="surface-card p-4 border-round">
                        <div class="flex align-items-center justify-content-between mb-3 gap-2">
                            <div>
                                <span class="block text-500 font-medium mb-3">Data/Hora</span>
                                <div class="text-900 font-medium text-xl">{{currentDate | date:'dd/MM/yyyy HH:mm'}}</div>
                            </div>
                            <div class="flex align-items-center justify-content-center border-round" style="width:2.5rem;height:2.5rem">
                                <i class="pi pi-calendar text-cyan-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-6 lg:col-span-3">
                    <div class="surface-card p-4 border-round">
                        <div class="flex align-items-center justify-content-between mb-3 gap-2">
                            <div>
                                <span class="block text-500 font-medium mb-3">Máquina</span>
                                <div class="text-900 font-medium text-xl">CRAWLER-001</div>
                            </div>
                            <div class="flex align-items-center justify-content-center border-round" style="width:2.5rem;height:2.5rem">
                                <i class="pi pi-desktop text-purple-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </p-card>
    `
})
export class LastRunInfoWidget {
    currentDate = new Date();
} 