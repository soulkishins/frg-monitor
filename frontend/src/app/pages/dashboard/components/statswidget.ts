import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../service/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-stats-widget',
    imports: [CommonModule],
    templateUrl: './statswidget.html'
})
export class StatsWidget {

    clients: number | string = 0;
    leads: number | string = 0;
    brands: number | string = 0;
    products: number | string = 0;
    keywords: number | string = 0;
    avgKeywords: number | string = 0;
    ads: number | string = 0;
    newAds: number | string = 0;

    constructor(private dashboardService: DashboardService) {
        this.dashboardService.getStats().subscribe(data => {
            console.log(data);
            this.clients = data[0].clients || 0;
            this.leads = data[0].leads || '0 ';
            this.brands = data[0].brands || 0;
            this.products = data[0].products || 0;
            this.keywords = data[0].keywords || 0;
            this.avgKeywords = Number((data[0].keywords / data[0].brandkeywords).toFixed(0));
            this.ads = data[0].ads || 0;
            this.newAds = data[0].newads || 0;
        });
    }
}
