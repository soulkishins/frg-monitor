export interface ProductResponse {
    id_product: string;
    id_brand: string;
    id_subcategory: string;
    st_product: string;
    st_variety: string;
    st_status: string;
    st_client?: string;
    st_brand?: string;
    dt_created: string;
    st_created_by: string;
    dt_modified: string | null;
    st_modified_by: string | null;
}

export interface Product {
    id?: string;
    client_id?: string;
    client_name?: string;
    name?: string;
    status?: string;
}
 
export interface ProductRequest {
    id_brand: string;
    id_subcategory: string;
    st_product: string;
    st_variety: string;
    st_status: string;
}