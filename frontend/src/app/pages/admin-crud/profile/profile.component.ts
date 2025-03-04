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
import { ActivatedRoute, Router } from '@angular/router';
import { CognitoService } from '../../service/cognito.service';
import { ProfileService } from '../../service/profile.service';
import { Page } from '../../models/global.model';
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
    providers: [MessageService, UserService, CognitoService]
})
export class Profile implements OnInit {
    isEditing: boolean = false;
    user!: UserResponse;
    submitted: boolean = false;
    newPassword: string = '';
    confirmPassword: string = '';

    constructor(
        private profileService: ProfileService,
        private messageService: MessageService,
        private router: Router,
        private cognitoService: CognitoService,
        private userService: UserService
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
        this.router.navigate(['/cadastro/usuario/lista']);
    }

    saveUser() {
        this.submitted = true;
        
        if (this.user.st_name?.trim() && this.user.st_email?.trim()) {
            const userRequest: UserRequest = {
                st_name: this.user.st_name,
                st_email: this.user.st_email,
                st_phone: this.user.st_phone || undefined
            };

            // Verifica se as senhas foram preenchidas e são iguais
            if (this.newPassword && this.confirmPassword && this.newPassword === this.confirmPassword) {
                userRequest.st_password = this.newPassword;
            } else if ((this.newPassword || this.confirmPassword) && this.newPassword !== this.confirmPassword) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'As senhas não coincidem',
                    life: 3000
                });
                return;
            }

            if (this.user.id) {
                this.userService.putUser(this.user.id, userRequest).subscribe(
                    (response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Usuário Atualizado',
                            life: 3000
                        });
                        this.goBack();
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao atualizar usuário',
                            life: 3000
                        });
                    }
                );
            } else {
                this.userService.postUser(userRequest).subscribe(
                    (response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Usuário Criado',
                            life: 3000
                        });
                        this.goBack();
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao criar usuário',
                            life: 3000
                        });
                    }
                );
            }
        }
    }
} 