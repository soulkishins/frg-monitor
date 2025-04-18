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
import { KeywordService } from '../../../service/keyword.service';
import { SchedulerResponse, SchedulerRequest, SchedulerKeyword } from '../../../models/scheduler.model';
import { KeywordResponse } from '../../../models/keyword.model';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { Page } from '../../../models/global.model';
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
    providers: [MessageService, SchedulerService, KeywordService]
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
    schedulers: SchedulerKeyword[] = [];
    editingScheduler: SchedulerKeyword | null = null;

    platforms = [
        { label: 'Mercado Livre', value: 'ML' }
    ];

    statusOptions = [
        { label: 'Ativo', value: 'active' },
        { label: 'Inativo', value: 'inactive' }
    ];

    constructor(
        private schedulerService: SchedulerService,
        private keywordService: KeywordService,
        private messageService: MessageService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.paramMap.get('id');
        if (this.id && this.id !== 'novo') {
            this.loadKeyword(this.id);
            this.loadScheduler(this.id);
        }
    }

    loadScheduler(id: string) {
        this.schedulerService.getSchedulerByKeyword({ id_keyword: id }).subscribe({
            next: (data: Page<SchedulerKeyword>) => {
                this.schedulers = data.list;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar agendamento',
                    life: 3000
                });
            }
        });
    }

    loadKeyword(id: string) {
        this.keywordService.getKeyword(id).subscribe({
            next: (data: KeywordResponse) => {
                this.scheduler.st_keyword = data.st_keyword;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar palavra-chave',
                    life: 3000
                });
            }
        });
    }

    private getFormattedDaysForCron(): string {
        const days = [
            { value: 1, selected: this.scheduler.sunday },
            { value: 2, selected: this.scheduler.monday },
            { value: 3, selected: this.scheduler.tuesday },
            { value: 4, selected: this.scheduler.wednesday },
            { value: 5, selected: this.scheduler.thursday },
            { value: 6, selected: this.scheduler.friday },
            { value: 7, selected: this.scheduler.saturday }
        ];

        // Se todos os dias estiverem selecionados
        if (days.every(day => day.selected)) {
            return '0';
        }

        const selectedDays = days.filter(day => day.selected).map(day => day.value);
        if (selectedDays.length === 0) {
            return '';
        }

        // Agrupa dias consecutivos
        const ranges: string[] = [];
        let start = selectedDays[0];
        let prev = selectedDays[0];

        for (let i = 1; i <= selectedDays.length; i++) {
            const current = selectedDays[i];
            if (current === prev + 1) {
                prev = current;
            } else {
                if (start === prev) {
                    ranges.push(start.toString());
                } else {
                    ranges.push(`${start}-${prev}`);
                }
                if (current) {
                    start = current;
                    prev = current;
                }
            }
        }

        return ranges.join(',');
    }

    private resetFormFields() {
        this.scheduler = {
            st_keyword: this.scheduler.st_keyword,
            st_status: this.scheduler.st_status,
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
        this.submitted = false;
    }

    save() {
        this.submitted = true;

        if (!this.scheduler.platform || !this.scheduler.executionTime || !this.hasSelectedDay()) {
            return;
        }

        const schedulerRequest: SchedulerRequest = {
            id_keyword: this.id ?? '',
            st_platform: this.scheduler.platform,
            st_cron: `${this.scheduler.executionTime.getMinutes()}_${this.scheduler.executionTime.getHours()}_${this.getFormattedDaysForCron()}`
        };

        const observable = this.editingScheduler 
            ? this.schedulerService.putScheduler(schedulerRequest, this.editingScheduler.id)
            : this.schedulerService.postScheduler(schedulerRequest);

        observable.subscribe({
            next: (data: Page<SchedulerKeyword>) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: this.editingScheduler ? 'Agendamento atualizado com sucesso' : 'Agendamento criado com sucesso',
                    life: 3000
                });
                this.loadScheduler(this.id ?? '');
                if (this.editingScheduler) {
                    this.cancelEdit();
                }
                this.resetFormFields();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: this.editingScheduler ? 'Erro ao atualizar agendamento' : 'Erro ao criar agendamento',
                    life: 3000
                });
            }
        });
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

    getFormattedDays(cron: string): string {
        const [_, __, days] = cron.split('_');
        
        if (days === '0') {
            return 'Todos os dias';
        }

        const daysMap: { [key: string]: string } = {
            '1': 'Domingo',
            '2': 'Segunda',
            '3': 'Terça',
            '4': 'Quarta',
            '5': 'Quinta',
            '6': 'Sexta',
            '7': 'Sábado'
        };

        // Se for um único dia
        if (!days.includes(',') && !days.includes('-')) {
            return daysMap[days];
        }

        // Processa os dias
        const dayRanges = days.split(',');
        const selectedDays: string[] = [];

        for (const range of dayRanges) {
            if (range.includes('-')) {
                const [start, end] = range.split('-').map(Number);
                for (let i = start; i <= end; i++) {
                    selectedDays.push(daysMap[i.toString()]);
                }
            } else {
                selectedDays.push(daysMap[range]);
            }
        }

        return selectedDays.join(', ');
    }

    editScheduler(scheduler: SchedulerKeyword) {
        this.editingScheduler = scheduler;
        this.scheduler.platform = scheduler.st_platform;
        
        // Processa o st_cron (minutos_horas_dia)
        const [minutes, hours, days] = scheduler.st_cron.split('_');
        
        // Configura o horário de execução
        const executionTime = new Date();
        executionTime.setHours(Number(hours), Number(minutes), 0, 0);
        this.scheduler.executionTime = executionTime;
        
        // Configura os dias da semana
        this.scheduler.monday = false;
        this.scheduler.tuesday = false;
        this.scheduler.wednesday = false;
        this.scheduler.thursday = false;
        this.scheduler.friday = false;
        this.scheduler.saturday = false;
        this.scheduler.sunday = false;

        if (days === '0') {
            this.scheduler.monday = true;
            this.scheduler.tuesday = true;
            this.scheduler.wednesday = true;
            this.scheduler.thursday = true;
            this.scheduler.friday = true;
            this.scheduler.saturday = true;
            this.scheduler.sunday = true;
        } else {
            const dayRanges = days.split(',');
            for (const range of dayRanges) {
                if (range.includes('-')) {
                    const [start, end] = range.split('-').map(Number);
                    for (let i = start; i <= end; i++) {
                        this.setDayOfWeek(i, true);
                    }
                } else {
                    this.setDayOfWeek(Number(range), true);
                }
            }
        }
    }

    private setDayOfWeek(day: number, value: boolean) {
        switch (day) {
            case 1: this.scheduler.sunday = value; break;
            case 2: this.scheduler.monday = value; break;
            case 3: this.scheduler.tuesday = value; break;
            case 4: this.scheduler.wednesday = value; break;
            case 5: this.scheduler.thursday = value; break;
            case 6: this.scheduler.friday = value; break;
            case 7: this.scheduler.saturday = value; break;
        }
    }

    cancelEdit() {
        this.editingScheduler = null;
        this.scheduler.platform = '';
        this.scheduler.executionTime = new Date();
        this.scheduler.monday = false;
        this.scheduler.tuesday = false;
        this.scheduler.wednesday = false;
        this.scheduler.thursday = false;
        this.scheduler.friday = false;
        this.scheduler.saturday = false;
        this.scheduler.sunday = false;
    }

    deleteScheduler(scheduler: SchedulerKeyword) {
        this.schedulerService.deleteScheduler(scheduler.id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Sucesso',
                    detail: 'Agendamento excluído com sucesso',
                    life: 3000
                });
                this.loadScheduler(this.id ?? '');
            },
            error: (error: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao excluir agendamento',
                    life: 3000
                });
            }
        });
    }
}
