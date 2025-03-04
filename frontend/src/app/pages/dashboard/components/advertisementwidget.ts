import { Component } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '../../../layout/service/layout.service';
import { DashboardService } from '../../service/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-advertisement-widget',
    imports: [ChartModule],
    template: `<div class="card !mb-8">
        <div class="font-semibold text-xl mb-4">Estatisticas do Crawler</div>
        <p-chart type="bar" [data]="chartData" [options]="chartOptions" class="h-80" />
    </div>`
})
export class AdvertisementWidget {
    chartData: any;
    chartOptions: any;
    subscription!: Subscription;
    loadData = {
        labels: ['-7', '-6', '-5', '-4', '-3', '-2', '-1', 'Hoje'],
        news: [0, 0, 0, 0, 0, 0, 0, 0],
        upds: [0, 0, 0, 0, 0, 0, 0, 0],
        rpts: [0, 0, 0, 0, 0, 0, 0, 0]
    }

    constructor(
        public layoutService: LayoutService,
        private dashboardService: DashboardService
    ) {
        this.subscription = this.layoutService.configUpdate$.pipe(debounceTime(25)).subscribe(() => {
            this.initChart(
                this.loadData.labels,
                this.loadData.news,
                this.loadData.upds,
                this.loadData.rpts
            );
        });

        this.dashboardService.getAdsReport().subscribe(data => {
            const labels = data.map(item => `${item.date.substring(8, 10)}/${item.date.substring(5, 7)}`);
            const news = data.map(item => item.news);
            const upds = data.map(item => item.upds);
            const rpts = data.map(item => item.rpts);
            
            this.loadData.labels = labels;
            this.loadData.news = news;
            this.loadData.upds = upds;
            this.loadData.rpts = rpts;

            this.initChart(
                this.loadData.labels,
                this.loadData.news,
                this.loadData.upds,
                this.loadData.rpts
            );
        });
    }

    ngOnInit() {
        this.initChart(
            this.loadData.labels,
            this.loadData.news,
            this.loadData.upds,
            this.loadData.rpts
        );
    }

    initChart(labels: string[], news: number[], upds: number[], rpts: number[]) {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const borderColor = documentStyle.getPropertyValue('--surface-border');
        const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

        this.chartData = {
            labels: labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Anúncios Novos',
                    backgroundColor: documentStyle.getPropertyValue('--p-info-400'),
                    data: news,
                    barThickness: 32
                },
                {
                    type: 'bar',
                    label: 'Anúncios Atualizados',
                    backgroundColor: documentStyle.getPropertyValue('--p-info-300'),
                    data: upds,
                    barThickness: 32
                },
                {
                    type: 'bar',
                    label: 'Anúncios Denunciados',
                    backgroundColor: documentStyle.getPropertyValue('--p-info-200'),
                    data: rpts,
                    borderRadius: {
                        topLeft: 8,
                        topRight: 8,
                        bottomLeft: 0,
                        bottomRight: 0
                    },
                    borderSkipped: false,
                    barThickness: 32
                }
            ]
        };

        this.chartOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
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
                    }
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
