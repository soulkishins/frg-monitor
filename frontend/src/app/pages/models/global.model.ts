export interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

export interface ExportColumn {
    title: string;
    dataKey: string;
}

export function omit(obj: any, keys: string[]): any {
    return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key)));
}

export interface Page<T> {
    list: T[];
    page: {
        total: number;
        limit: number;
        offset: number;
        sort: string;
    }
}

export interface DashboardStats {
    clients: number;
    leads: number;
    brands: number;
    products: number;
    keywords: number;
    brandkeywords: number;
    ads: number;
    newads: number;
}

export interface TopKeyword {
    keyword: string;
    ads: number;
    reports: number;
}

export interface AdsReport {
    date: string;
    news: number;
    upds: number;
    rpts: number;
}

export interface SchedulerStatisticsReport {
    nr_pages: number;
    nr_total: number;
    nr_error: number;
    nr_reported: number;
    nr_manual_revision: number;
    nr_already_reported: number;
    nr_invalidate: number;
}

export interface SchedulerReport {
    count_scheduler: number;
    count_keywords: number;
    avg_keywords: number;
    exec_keywords: number;
}
