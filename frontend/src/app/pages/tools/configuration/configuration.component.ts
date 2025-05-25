import { Component, EventEmitter, OnInit, signal, ViewChild, Input } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { BrandService } from '../../service/brand.service';

@Component({
    selector: 'app-configuration',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        RadioButtonModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        CheckboxModule,
        PasswordModule
    ],
    templateUrl: './configuration.component.html',
    providers: [MessageService, BrandService, ConfirmationService]
})
export class ConfigurationComponent implements OnInit {
    username: string = '';
    password: string = '';
    submitted: boolean = false;
    @Input() crawlerSelecionado: string = '';

    constructor(private messageService: MessageService) {}

    ngOnInit(): void {}

    save() {
        this.submitted = true;
        
        if (!this.username || !this.password) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erro',
                detail: 'Por favor, preencha todos os campos'
            });
            return;
        }

        // TODO: Implementar a lógica de salvamento
        this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Configurações salvas com sucesso'
        });
    }
}
