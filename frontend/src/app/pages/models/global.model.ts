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


