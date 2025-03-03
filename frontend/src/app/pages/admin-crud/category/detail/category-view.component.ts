import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CategoryService } from '../../../../pages/service/category.service';
import { CategoryResponse } from '../../../../pages/models/category.model';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-category-view',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        DropdownModule
    ],
    templateUrl: './category-view.component.html',
    providers: [MessageService, CategoryService]
})
export class CategoryView implements OnInit {
    isEditing: boolean = false;
    category!: CategoryResponse;
    submitted: boolean = false;

    statusOptions = [
        { label: 'Ativo', value: 'active' },
        { label: 'Inativo', value: 'inactive' }
    ];

    constructor(
        private categoryService: CategoryService,
        private messageService: MessageService,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.category = {
            st_category: '',
            st_status: 'active'
        } as CategoryResponse;
        
        // Obter o ID da rota
        this.route.params.subscribe(params => {
            const categoryId = params['id'];
            if (categoryId && categoryId !== 'novo') {
                this.isEditing = true;
                this.loadCategory(categoryId);
            }
        });
    }

    loadCategory(id: string) {
        this.categoryService.getCategory(id).subscribe(
            (data: CategoryResponse) => {
                this.category = data;
            },
            (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erro',
                    detail: 'Erro ao carregar categoria',
                    life: 3000
                });
            }
        );
    }

    hideDialog() {
        // Redirecionar para a lista de categorias
        window.history.back();
    }

    saveCategory() {
        this.submitted = true;
        
        if (this.category.st_category?.trim() && this.category.st_status) {
            const categoryRequest = {
                st_category: this.category.st_category,
                st_status: this.category.st_status
            };

            if (this.category.id_category) {
                // Atualizar categoria existente
                this.categoryService.putCategory(this.category.id_category, categoryRequest).subscribe(
                    (response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Categoria Atualizada',
                            life: 3000
                        });
                        window.history.back();
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao atualizar categoria',
                            life: 3000
                        });
                    }
                );
            } else {
                // Criar nova categoria
                this.categoryService.postCategory(categoryRequest).subscribe(
                    (response) => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Sucesso',
                            detail: 'Categoria Criada',
                            life: 3000
                        });
                        window.history.back();
                    },
                    (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erro',
                            detail: 'Erro ao criar categoria',
                            life: 3000
                        });
                    }
                );
            }
        }
    }
}
