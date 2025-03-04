export interface Client {
    id: string;
    st_name: string;
}

export interface Brand {
    id_brand: string;
    id_client: string;
    st_brand: string;
    client?: Client;
}

export interface Category {
    id_category: string;
    st_category: string;
}

export interface Subcategory {
    id_subcategory: string;
    id_category: string;
    st_subcategory: string;
    category?: Category;
}

export interface ProductResponse {
    id_product: string;
    id_brand: string;
    id_subcategory: string;
    st_product: string;
    st_variety: string;
    st_status: string;
    brand?: Brand;
    subcategory?: Subcategory;
}

export interface ProductRequest {
    id_brand: string;
    id_subcategory: string;
    st_product: string;
    st_variety: string;
    st_status: string;
} 