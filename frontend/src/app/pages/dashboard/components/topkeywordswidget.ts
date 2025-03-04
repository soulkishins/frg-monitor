import { Component } from '@angular/core';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../service/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-top-keywords-widget',
    imports: [CommonModule, TableModule, ButtonModule, RippleModule],
    templateUrl: './topkeywordswidget.html'
})
export class TopKeywordsWidget {
    keysStatus!: any[];

    constructor(private dashboardService: DashboardService) {
        this.dashboardService.getTopKeywords().subscribe(data => {
            console.log(data);
            this.keysStatus = data;
        });
    }
}
