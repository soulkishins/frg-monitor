import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-captcha-solver',
    standalone: true,
    imports: [RouterModule, AppFloatingConfigurator, ButtonModule],
    templateUrl: './captcha-solver.html'
})
export class CaptchaSolver {}
