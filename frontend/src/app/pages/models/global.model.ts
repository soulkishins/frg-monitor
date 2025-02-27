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
