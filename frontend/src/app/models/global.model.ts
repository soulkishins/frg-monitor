export interface Page<T> {
    list: T[];
    page: {
        total: number;
        limit: number;
        offset: number;
        sort?: string;
    };
}

export interface Column {
    field: string;
    header: string;
}

export interface ExportColumn {
    title: string;
    dataKey: string;
} 