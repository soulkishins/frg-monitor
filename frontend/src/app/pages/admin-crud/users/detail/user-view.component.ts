import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { UserService } from '../../../../pages/service/user.service';
import { UserResponse, UserRequest } from '../../../../pages/models/user.model';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-user-view',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        ToastModule,
        ToolbarModule,
        InputTextModule
    ],
    templateUrl: './user-view.component.html',
    providers: [MessageService, UserService]
})
export class UserView implements OnInit {
    isEditing: boolean = false;
    user!: UserResponse;
    submitted: boolean = false;

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        this.user = {
            st_name: '',
            st_email: '',
            st_phone: null
        } as UserResponse;
        
        this.route.params.subscribe(params => {
            const userId = params['id'];
            if (userId && userId !== 'novo') {
                this.isEditing = true;
                this.loadUser(userId);
            }
        });
    }

    loadUser(id: string) {
        this.userService.getUser(id).subscribe(
            (data: UserResponse) => {
                this.user = data;
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

            if (this.user.id) {
                this.userService.putUser(this.user.id, userRequest).subscribe({
                    next: (response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Usuário Atualizado',
                            life: 3000
                        });
                        this.goBack();
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
            } else {
                this.userService.postUser(userRequest).subscribe({
                    next: (response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Usuário criado com sucesso! Senha: ' + response.st_password,
                            sticky: true
                        });
                        this.user = response;
                        this.isEditing = true;
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao criar usuário',
                            life: 3000
                        });
                    }
                });
            }
        }
    }
} 