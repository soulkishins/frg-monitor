import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { Router, ActivatedRoute } from '@angular/router';
import { SchedulerService } from '../../../service/scheduler.service';
import { SchedulerResponse, SchedulerRequest } from '../../../models/scheduler.model';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';

interface SchedulerForm {
    st_keyword: string;
    st_status: string;
    platform: string;
    executionTime: Date;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
}

@Component({
    selector: 'app-scheduler-view',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        DropdownModule,
        CalendarModule,
        InputNumberModule,
        TableModule,
        ToastModule,
        ToolbarModule,
        CheckboxModule
    ],
    templateUrl: './scheduler-view.component.html',
    providers: [MessageService, SchedulerService]
})
export class SchedulerView implements OnInit {
    scheduler: SchedulerForm = {
        st_keyword: '',
        st_status: 'active',
        platform: '',
        executionTime: new Date(),
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false
    };
    id: string | null = null;
    submitted: boolean = false;

    platforms = [
        { label: 'Mercado Livre', value: 'ML' }
    ];

    statusOptions = [
        { label: 'Ativo', value: 'active' },
        { label: 'Inativo', value: 'inactive' }
    ];

    constructor(
        private schedulerService: SchedulerService,
        private messageService: MessageService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.paramMap.get('id');
        if (this.id && this.id !== 'novo') {
            this.loadScheduler();
        }
    }

    loadScheduler() {
        if (this.id) {
            this.schedulerService.getScheduler(this.id).subscribe({
                next: (data) => {
                    this.scheduler = {
                        ...this.scheduler,
                        st_keyword: data.st_keyword,
                        st_status: data.st_status
                    };
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erro',
                        detail: 'Erro ao carregar agendamento',
                        life: 3000
                    });
                    console.error('Erro ao carregar agendamento:', error);
                }
            });
        }
    }

    save() {
        this.submitted = true;

        if (this.scheduler.st_keyword?.trim() && this.hasSelectedDay()) {
            const request: SchedulerRequest = {
                st_keyword: this.scheduler.st_keyword,
                st_status: this.scheduler.st_status,
                platform: this.scheduler.platform
            };

            if (this.id === 'novo') {
                this.schedulerService.postScheduler(request).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Agendamento criado com sucesso',
                            life: 3000
                        });
                        this.router.navigate(['/cadastro/agendador/lista']);
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao criar agendamento',
                            life: 3000
                        });
                        console.error('Erro ao criar agendamento:', error);
                    }
                });
            } else if (this.id) {
                this.schedulerService.putScheduler(this.id, request).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Agendamento atualizado com sucesso',
                            life: 3000
                        });
                        this.router.navigate(['/cadastro/agendador/lista']);
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao atualizar agendamento',
                            life: 3000
                        });
                        console.error('Erro ao atualizar agendamento:', error);
                    }
                });
            }
        }
    }

    cancel() {
        this.router.navigate(['/cadastro/agendador/lista']);
    }

    hasSelectedDay(): boolean {
        return this.scheduler.monday || 
               this.scheduler.tuesday || 
               this.scheduler.wednesday || 
               this.scheduler.thursday || 
               this.scheduler.friday || 
               this.scheduler.saturday || 
               this.scheduler.sunday;
    }
}
