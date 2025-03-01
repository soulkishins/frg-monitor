export interface ProductResponse {
    id_product: string;
    id_brand: string;
    id_subcategory: string;
    st_product: string;
    st_variety: string;
    st_status: string;
    dt_created: string;
    st_created_by: string;
    dt_modified: string;
    st_modified_by: string;
    subcategory: Subcategory;
    brand: Brand;
}

export interface Product {
    id_product: string;
    id_brand: string;
    id_subcategory: string;
    st_product: string;
    st_variety: string;
    st_status: string;
}
 
export interface ProductRequest {
    id_brand: string;
    id_subcategory: string;
    st_product: string;
    st_variety: string;
    st_status: string;
}

export interface Category {
    id_category: string;
    st_category: string;
    st_status: string;
    dt_created: string;
    st_created_by: string;
    dt_modified: string;
    st_modified_by: string;
}

export interface Subcategory {
    id_subcategory: string;
    id_category: string;
    st_subcategory: string;
    st_status: string;
    category: Category;
    dt_created: string;
    st_created_by: string;
    dt_modified: string;
    st_modified_by: string;
}

export interface Client {
    id: string;
    st_name: string;
    st_document: string;
    st_status: string;
    dt_created: string;
    st_created_by: string;
    dt_modified: string;
    st_modified_by: string;
}

export interface Brand {
    id_brand: string;
    id_client: string;
    st_brand: string;
    st_status: string;
    client: Client;
    dt_created: string;
    st_created_by: string;
    dt_modified: string;
    st_modified_by: string;
}
