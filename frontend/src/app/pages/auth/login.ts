import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { CognitoService } from '../service/cognito.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator],
    templateUrl: './login.html'
})
export class Login {
    username: string = '';
    password: string = '';
    rememberme: boolean = false;
    mfaRequired = false;
    mfaCode = '';

    constructor(
        private cognitoService: CognitoService,
        private router: Router
    ) {}

    login() {
        this.cognitoService.login(
            this.username,
            this.password
        )
        .then((session) => {
            console.log('Login bem-sucedido:', session);
            this.router.navigate(['/']);
        })
        .catch((error) => {
            if (error.mfaRequired) {
                this.mfaRequired = true;
            } else {
                console.error('Erro de login:', error);
            }
        });
    }

    submitMfaCode() {
        this.cognitoService.verifyMfaCode(this.mfaCode).then((session) => {
            console.log('Login bem-sucedido com MFA:', session);
            this.mfaRequired = false;
        }).catch((error) => {
            console.error('Erro ao verificar o código MFA:', error);
        });
    }
}
