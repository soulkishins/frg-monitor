import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-scrapers',
    standalone: true,
    imports: [RouterModule, AppFloatingConfigurator, ButtonModule],
    templateUrl: './scrapers.html'
})
export class Scrapers {}
