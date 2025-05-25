import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { CardModule } from 'primeng/card';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-scrapers',
    templateUrl: './scrapers.html',
    standalone: true,
    imports: [CommonModule, RouterModule, AppFloatingConfigurator, ToolbarModule, ButtonModule, MenuModule, RippleModule, CardModule]
})
export class Scrapers {
    crawlerSelecionado: string | null = null;
    acaoSelecionada: string | null = null;

    crawlerItems: MenuItem[] = [
        {
            label: 'Shopee',
            icon: 'pi pi-check',
            command: () => this.onShopeeClick()
        },
        {
            label: 'Magalu',
            icon: 'pi pi-check',
            command: () => this.onMagaluClick()
        }
    ];

    acoesItems: MenuItem[] = [
        {
            label: 'Listar palavras chaves',
            icon: 'pi pi-check',
            command: () => this.onListarPalavrasChavesClick()
        },
        {
            label: 'Listar marcas',
            icon: 'pi pi-check',
            command: () => this.onListarMarcasClick()
        },
        {
            label: 'Última execução',
            icon: 'pi pi-check',
            command: () => this.onUltimaExecucaoClick()
        },
        {
            label: 'Configurações',
            icon: 'pi pi-check',
            command: () => this.onConfiguracoesClick()
        }
    ];

    onShopeeClick() {
        this.crawlerSelecionado = 'Shopee';
        // Executa automaticamente a ação de listar palavras chave
        this.onListarPalavrasChavesClick();
    }

    onMagaluClick() {
        this.crawlerSelecionado = 'Magalu';
        // Executa automaticamente a ação de listar palavras chave
        this.onListarPalavrasChavesClick();
    }

    onListarPalavrasChavesClick() {
        this.acaoSelecionada = 'Listar palavras chaves';
        // Implementar ação de listar palavras chaves
    }

    onListarMarcasClick() {
        this.acaoSelecionada = 'Listar marcas';
        // Implementar ação de listar marcas
    }

    onUltimaExecucaoClick() {
        this.acaoSelecionada = 'Última execução';
        // Implementar ação de última execução
    }

    onConfiguracoesClick() {
        this.acaoSelecionada = 'Configurações';
        // Implementar ação de configurações
    }
}
