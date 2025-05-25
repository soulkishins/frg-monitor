import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { PrimeIcons } from 'primeng/api';

@Component({
    selector: 'app-processing-metrics-widget',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
        <p-card header="Métricas de Processamento" styleClass="shadow-2">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 md:col-span-6 lg:col-span-3">
                    <div class="surface-card p-4 border-round">
                        <div class="flex align-items-center justify-content-between mb-3 gap-2">
                            <div>
                                <span class="block text-500 font-medium mb-3">Páginas Acessadas</span>
                                <div class="text-900 font-medium text-xl">150</div>
                            </div>
                            <div class="flex align-items-center justify-content-center border-round" style="width:2.5rem;height:2.5rem">
                                <i class="pi pi-globe text-green-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-6 lg:col-span-3">
                    <div class="surface-card p-4 border-round">
                        <div class="flex align-items-center justify-content-between mb-3 gap-2">
                            <div>
                                <span class="block text-500 font-medium mb-3">Palavras-chave Executadas</span>
                                <div class="text-900 font-medium text-xl">25</div>
                            </div>
                            <div class="flex align-items-center justify-content-center border-round" style="width:2.5rem;height:2.5rem">
                                <i class="pi pi-filter text-yellow-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-6 lg:col-span-3">
                    <div class="surface-card p-4 border-round">
                        <div class="flex align-items-center justify-content-between mb-3 gap-2">
                            <div>
                                <span class="block text-500 font-medium mb-3">Anúncios Processados</span>
                                <div class="text-900 font-medium text-xl">300</div>
                            </div>
                            <div class="flex align-items-center justify-content-center border-round" style="width:2.5rem;height:2.5rem">
                                <i class="pi pi-box text-indigo-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 md:col-span-6 lg:col-span-3">
                    <div class="surface-card p-4 border-round">
                        <div class="flex align-items-center justify-content-between mb-3 gap-2">
                            <div>
                                <span class="block text-500 font-medium mb-3">Desbloqueios</span>
                                <div class="text-900 font-medium text-xl">5</div>
                            </div>
                            <div class="flex align-items-center justify-content-center border-round" style="width:2.5rem;height:2.5rem">
                                <i class="pi pi-lock-open text-red-500 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </p-card>
    `
})
export class ProcessingMetricsWidget {} 