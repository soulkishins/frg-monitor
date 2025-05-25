import { Component } from '@angular/core';
import { LastRunInfoWidget } from './components/lastruninfowidget';
import { ProcessingMetricsWidget } from './components/processingmetricswidget';
import { AdsStatusWidget } from './components/adsstatuswidget';

@Component({
    selector: 'app-last-run',
    standalone: true,
    imports: [
        LastRunInfoWidget,
        ProcessingMetricsWidget,
        AdsStatusWidget
    ],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <app-last-run-info-widget />
            </div>
            <div class="col-span-12">
                <app-processing-metrics-widget />
            </div>
            <div class="col-span-12">
                <app-ads-status-widget />
            </div>
        </div>
    `
})
export class LastRun {}
