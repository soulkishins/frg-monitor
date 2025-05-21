// Interface base para anúncios
export interface IAdvertisement {
    id_advertisement?: string;
    id_brand?: string;
    st_plataform: string;
    st_plataform_id: string;
    st_url: string;
    st_title?: string;
    st_description?: string;
    st_photos?: string;
    db_price?: number;
    st_vendor?: string;
    st_details?: string;
    st_status: string;
    st_ml_json?: string;
}

// Interface base para histórico de anúncios
export interface IAdvertisementHistory {
    id_advertisement: string;
    st_status: string;
    st_action: string;
    st_history?: string;
    st_ml_json?: string;
}

// Interface base para produtos
export interface IAdvertisementProduct {
    id_product?: string;
    st_varity_seq?: string;
    st_varity_name?: string;
    id_advertisement?: string;
}

// Interface base para palavra chave recebida da fila
export interface IKeyword {
    scheduler_id: string;
    cron: string;
    platform: string;
    datetime: string;
    keyword_id: string;
    keyword: string;
    brand_id: string;
    products: IAdvertisementProduct[];
    statistics: IStatistics;
}

// Interface base para estatísticas de processamento
export interface IStatistics {
    nr_pages: number;
    nr_total: number;
    nr_processed: number;
    nr_created: number;
    nr_updated: number;
    nr_error: number;
    nr_manual_revision: number;
    nr_reported: number;
    nr_already_reported: number;
    nr_reconcile: number;
    nr_invalidate: number;
    st_status: 'SE' | 'EP' | 'ET' | 'PE' | 'GE' | null;
}

export interface IPage {
    advertisements: IAdvertisement[];
    pages: IPagination[];
}

export interface IPagination {
    visited: boolean;
    link: string;
}