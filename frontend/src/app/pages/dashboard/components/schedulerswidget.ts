import { Component } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '../../../layout/service/layout.service';
import { DashboardService } from '../../service/dashboard.service';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
    standalone: true,
    selector: 'app-schedulers-widget',
    imports: [ChartModule],
    template: `<div class="card !mb-8">
        <div class="font-semibold text-xl mb-4">Estatísticas dos Agendamentos de Hoje</div>
        <p-chart type="bar" [data]="chartData" [options]="chartOptions" [plugins]="[ChartDataLabels]" class="h-80" />
    </div>`
})
export class SchedulersWidget {
    chartData: any;
    chartOptions: any;
    ChartDataLabels = ChartDataLabels;
    subscription!: Subscription;
    loadData = {
        labels: ['Páginas', 'Total', 'Com Sucesso', 'Com Erro', 'Reportado', 'Revisão Manual', 'Já Reportado', 'Inválido'],
        values: [0, 0, 0, 0, 0, 0, 0, 0],
    }

    constructor(
        public layoutService: LayoutService,
        private dashboardService: DashboardService
    ) {
        this.subscription = this.layoutService.configUpdate$.pipe(debounceTime(25)).subscribe(() => {
            this.initChart(
                this.loadData.labels,
                this.loadData.values
            );
        });

        this.dashboardService.getSchedulerStatisticsReport().subscribe(data => {
            const values = [
                data[0].nr_pages,
                data[0].nr_total,
                data[0].nr_total - data[0].nr_error,
                data[0].nr_error,
                data[0].nr_reported,
                data[0].nr_manual_revision,
                data[0].nr_already_reported,
                data[0].nr_invalidate
            ];
            
            this.loadData.values = values;

            this.initChart(
                this.loadData.labels,
                this.loadData.values
            );
        });
    }

    ngOnInit() {
        this.initChart(
            this.loadData.labels,
            this.loadData.values
        );
    }

    initChart(labels: string[], values: number[]) {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const borderColor = documentStyle.getPropertyValue('--surface-border');
        const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

        this.chartData = {
            labels: labels,
            datasets: [
                {
                    type: 'bar',
                    backgroundColor: documentStyle.getPropertyValue('--p-info-400'),
                    data: values,
                    barThickness: 32
                }
            ]
        };

        this.chartOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    display: false,
                    labels: {
                        color: textColor
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: '#FFF',
                    font: {
                      weight: 'bold'
                    },
                    formatter: Math.round // ou qualquer outro formatador
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textMutedColor
                    },
                    grid: {
                        color: 'transparent',
                        borderColor: 'transparent'
                    }
                },
                y: {
                    ticks: {
                        color: textMutedColor
                    },
                    grid: {
                        color: borderColor,
                        borderColor: 'transparent',
                        drawTicks: false
                    },
                    suggestedMax: Math.max(...values) * 1.1
                }
            }
        };
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
