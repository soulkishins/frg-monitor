import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { UserService } from '../../service/user.service';
import { UserResponse, UserRequest } from '../../models/user.model';
import { CognitoService } from '../../service/cognito.service';
import { ProfileService } from '../../service/profile.service';
import { Page } from '../../models/global.model';
import { Router } from '@angular/router';
@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        ToastModule,
        ToolbarModule,
        InputTextModule
    ],
    templateUrl: './profile.component.html',
    providers: [MessageService, UserService]
})
export class Profile implements OnInit {
    user!: UserResponse;
    isEditing: boolean = false;
    submitted: boolean = false;
    newPassword: string = '';
    oldPassword: string = '';
    confirmPassword: string = '';

    constructor(
        private router: Router,
        private cognitoService: CognitoService,
        private profileService: ProfileService,
        private userService: UserService,
        private messageService: MessageService,
    ) {}

    ngOnInit() {
        this.user = {
            st_name: '',
            st_email: '',
            st_phone: null
        } as UserResponse;
        
        const cognitoUser = this.cognitoService.retrieveUser();
        if (cognitoUser) {
            this.isEditing = true;
            this.loadUser(cognitoUser.getUsername());
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Usuário não encontrado na sessão',
                life: 3000
            });
            this.router.navigate(['/auth/login']);
        }
    }

    loadUser(id: string) {
        this.profileService.getUsers({ st_value: id }).subscribe(
            (data: Page<UserResponse>) => {
                this.user = data.list[0];
            },
            (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar usuário',
                    life: 3000
                });
            }
        );
    }

    goBack() {
        this.router.navigate(['/']);
    }

    saveUser() {
        this.submitted = true;
        
        if (this.user.st_name?.trim() && this.user.st_email?.trim()) {
            const userRequest: UserRequest = {
                st_name: this.user.st_name,
                st_email: this.user.st_email,
                st_phone: this.user.st_phone || undefined
            };

            this.userService.putUser(this.user.id, userRequest).subscribe({
                next: (response) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Sucesso',
                        detail: 'Usuário Atualizado',
                        life: 3000
                    });
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Erro ao atualizar usuário',
                        life: 3000
                    });
                }
            });
        }
    }

    saveUserPassword() {
        this.submitted = true;
        if (this.user.st_name?.trim() && this.user.st_email?.trim()) {
            // Verifica se as senhas foram preenchidas e são iguais
            if (this.oldPassword && this.newPassword && this.confirmPassword && this.newPassword === this.confirmPassword) {
                this.cognitoService
                .updateUserPassword(this.user.st_name, this.oldPassword, this.newPassword)
                .then(() => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Sucesso',
                        detail: 'Senha atualizada com sucesso',
                        life: 3000
                    });
                }).catch((error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Erro ao atualizar senha: ' + error,
                        life: 3000
                    });
                });
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Não foi possível atualizar a senha, verifique se as senhas são iguais.',
                    life: 3000
                });
            }
        }
    }
} 