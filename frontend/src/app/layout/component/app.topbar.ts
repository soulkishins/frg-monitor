import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { CognitoService } from '../../pages/service/cognito.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator],
    templateUrl: './app.topbar.html'
})
export class AppTopbar {
    items!: MenuItem[];

    constructor(
        public layoutService: LayoutService,
        private cognitoService: CognitoService,
        private router: Router
    ) {}

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    onProfile() {
        this.router.navigate(['/cadastro/perfil']);
    }

    onLogout() {
        this.cognitoService.logout();
        this.router.navigate(['/auth/login']);
    }
}
