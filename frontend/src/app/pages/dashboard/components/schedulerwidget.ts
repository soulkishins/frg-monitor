import { Component } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '../../../layout/service/layout.service';
import { DashboardService } from '../../service/dashboard.service';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
    standalone: true,
    selector: 'app-scheduler-widget',
    imports: [ChartModule],
    template: `<div class="card !mb-8">
        <div class="font-semibold text-xl mb-4">Agendamentos de Hoje</div>
        <p-chart type="bar" [data]="chartData" [options]="chartOptions" class="h-80" [plugins]="[ChartDataLabels]" />
    </div>`
})
export class SchedulerWidget {
    chartData: any;
    chartOptions: any;
    ChartDataLabels = ChartDataLabels;
    subscription!: Subscription;
    loadData = {
        labels: ['Agendamentos', 'Palavras Buscadas', 'Palavras Pendentes', 'Média de Palavras'],
        values: [0, 0, 0, 0],
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

        this.dashboardService.getSchedulerReport().subscribe(data => {
            const values = [
                data[0].count_scheduler,
                data[0].exec_keywords,
                data[0].count_keywords - data[0].exec_keywords,
                data[0].avg_keywords
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
                },
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: textMutedColor
                    },
                    grid: {
                        color: 'transparent',
                        borderColor: 'transparent'
                    }
                },
                y: {
                    stacked: true,
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
