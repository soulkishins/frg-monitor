export interface SubCategoryResponse {
    id_subcategory: string;
    id_category: string;
    st_subcategory: string;
    st_status: string;
    dt_created: string;
    st_created_by: string;
    dt_modified: string | null;
    st_modified_by: string | null;
}

export interface SubCategory {
    id?: string;
    name?: string;
    identification?: string;
    status?: string;
}

export interface SubCategoryRequest {
    id_category: string;
    st_subcategory: string;
    st_status: string;
}