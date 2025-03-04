import { Component } from '@angular/core';
import { StatsWidget } from './components/statswidget';
import { TopKeywordsWidget } from './components/topkeywordswidget';
import { AdvertisementWidget } from './components/advertisementwidget';

@Component({
    selector: 'app-dashboard',
    imports: [StatsWidget, TopKeywordsWidget, AdvertisementWidget],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <app-stats-widget class="contents" />
            <div class="col-span-12 xl:col-span-6">
                <app-top-keywords-widget />
            </div>
            <div class="col-span-12 xl:col-span-6">
                <app-advertisement-widget />
            </div>
        </div>
    `
})
export class Dashboard {}
