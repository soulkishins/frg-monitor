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
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PasswordModule,
        FormsModule,
        RouterModule,
        RippleModule,
        AppFloatingConfigurator,
        ToastModule
    ],
    templateUrl: './login.html',
    providers:[MessageService]
})
export class Login {
    username: string = '';
    password: string = '';
    rememberme: boolean = false;
    mfaRequired = false;
    mfaCode = '';

    constructor(
        private cognitoService: CognitoService,
        private router: Router,
        private messageService: MessageService
    ) {}

    login() {
        this.cognitoService.login(
            this.username,
            this.password,
            false
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
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Não foi possível realizar o login! Verifique suas credenciais e tente novamente.',
                    life: 3000
                });
            }
        });
    }

    submitMfaCode() {
        this.cognitoService.verifyMfaCode(this.mfaCode, false).then((session) => {
            console.log('Login bem-sucedido com MFA:', session);
            this.mfaRequired = false;
        }).catch((error) => {
            console.error('Erro ao verificar o código MFA:', error);
        });
    }
}
