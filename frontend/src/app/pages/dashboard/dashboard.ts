import { Component } from '@angular/core';
import { StatsWidget } from './components/statswidget';
import { TopKeywordsWidget } from './components/topkeywordswidget';
import { AdvertisementWidget } from './components/advertisementwidget';
import { SchedulerWidget } from './components/schedulerwidget';
import { SchedulersWidget } from './components/schedulerswidget';

@Component({
    selector: 'app-dashboard',
    imports: [StatsWidget, TopKeywordsWidget, AdvertisementWidget, SchedulerWidget, SchedulersWidget],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <app-stats-widget class="contents" />
            <div class="col-span-12 xl:col-span-6">
                <app-top-keywords-widget />
            </div>
            <div class="col-span-12 xl:col-span-6">
                <app-advertisement-widget />
            </div>
            <div class="col-span-4">
                <app-scheduler-widget />
            </div>
            <div class="col-span-8">
                <app-schedulers-widget />
            </div>
        </div>
    `
})
export class Dashboard {}
