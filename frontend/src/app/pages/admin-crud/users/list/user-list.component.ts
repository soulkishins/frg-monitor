import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { UserService } from '../../../../pages/service/user.service';
import { UserResponse } from '../../../../pages/models/user.model';
import { Column, ExportColumn, Page } from '../../../../pages/models/global.model';
import { Router } from '@angular/router';
import { RatingModule } from 'primeng/rating';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { IftaLabelModule } from 'primeng/iftalabel';
import { TooltipModule } from 'primeng/tooltip';
import { FluidModule } from 'primeng/fluid';
import { MenuModule } from 'primeng/menu';
import { TagModule } from 'primeng/tag';
import { PanelModule } from 'primeng/panel';
import { AvatarModule } from 'primeng/avatar';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        RadioButtonModule,
        InputNumberModule,
        IftaLabelModule,
        TooltipModule,
        FluidModule,
        MenuModule,
        TagModule,
        PanelModule,
        AvatarModule,
        InputIconModule,
        IconFieldModule,
        DialogModule,
        ToastModule,
        ConfirmDialogModule
    ],
    templateUrl: './user-list.component.html',
    providers: [MessageService, UserService, ConfirmationService]
})
export class UserList implements OnInit {
    users = signal<UserResponse[]>([]);
    selectedUsers!: UserResponse[] | null;

    @ViewChild('dt') dt!: Table;

    exportColumns!: ExportColumn[];
    cols!: Column[];

    constructor(
        private userService: UserService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    exportCSV() {
        this.dt.exportCSV();
    }

    ngOnInit() {
        this.loadUserData();
    }

    loadUserData() {
        this.userService.getUsers().subscribe(
            (data: Page<UserResponse>) => {
                this.users.set(data.list);
            },
            (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar usuários',
                    life: 3000
                });
            }
        );

        this.cols = [
            { field: 'st_name', header: 'Nome' },
            { field: 'st_email', header: 'Email' },
            { field: 'st_phone', header: 'Telefone' },
            { field: 'dt_created', header: 'Data Criação' },
            { field: 'st_created_by', header: 'Criado por' }
        ];

        this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.router.navigate(['/cadastro/usuario/detalhe', 'novo']);
    }

    editUser(user: UserResponse) {
        this.router.navigate(['/cadastro/usuario/detalhe', user.id]);
    }

    deleteSelectedUsers() {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir os usuários selecionados?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (this.selectedUsers) {
                    const deletePromises = this.selectedUsers.map(user => 
                        this.userService.deleteUser(user.id).toPromise()
                    );

                    Promise.all(deletePromises)
                        .then(() => {
                            this.users.set(this.users().filter((val) => !this.selectedUsers?.includes(val)));
                            this.selectedUsers = null;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Sucesso',
                                detail: 'Usuários Excluídos',
                                life: 3000
                            });
                        })
                        .catch(() => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erro',
                                detail: 'Erro ao excluir usuários',
                                life: 3000
                            });
                        });
                }
            }
        });
    }

    deleteUser(user: UserResponse) {
        this.confirmationService.confirm({
            message: 'Tem certeza que deseja excluir o usuário ' + user.st_name + '?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.userService.deleteUser(user.id).subscribe(
                    () => {
                        this.users.set(this.users().filter((val) => val.id !== user.id));
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Usuário Excluído',
                            life: 3000
                        });
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao excluir usuário',
                            life: 3000
                        });
                    }
                );
            }
        });
    }
} 