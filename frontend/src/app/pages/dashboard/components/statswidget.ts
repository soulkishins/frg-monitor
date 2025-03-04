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

    clients = 0;
    leads = 0;
    brands = 0;
    products = 0;
    keywords = 0;
    avgKeywords = 0;
    ads = 0;
    newAds = 0;

    constructor(private dashboardService: DashboardService) {
        this.dashboardService.getStats().subscribe(data => {
            console.log(data);
            this.clients = data[0].clients;
            this.leads = data[0].leads;
            this.brands = data[0].brands;
            this.products = data[0].products;
            this.keywords = data[0].keywords;
            this.avgKeywords = Number((data[0].keywords / data[0].brandkeywords).toFixed(0));
            this.ads = data[0].ads;
            this.newAds = data[0].newads;
        });
    }
}
