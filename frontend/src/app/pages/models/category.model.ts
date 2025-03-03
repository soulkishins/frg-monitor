export interface CategoryResponse {
    id_category: string;
    st_category: string;
    st_status: string;
    dt_created: string;
    st_created_by: string;
    dt_modified: string | null;
    st_modified_by: string | null;
}

export interface Category {
    id?: string;
    name?: string;
    identification?: string;
    status?: string;
}

export interface CategoryRequest {
    st_category: string;
    st_status: string;
}

export interface Page {
    total: number;
    limit: number;
    offset: number;
    sort: string;
}

export interface CategoriesResponse {
    list: CategoryResponse[];
    page: Page;
}