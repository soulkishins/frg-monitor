import { MenuItem } from "primeng/api";

export interface AdvertisementListDto {
    id_advertisement: string;
    id_client: string;
    id_brand: string;
    id_product: string;
    st_plataform: string;
    st_plataform_id: string;
    st_url: string;
    st_name: string;
    st_brand: string;
    st_product: string;
    st_title: string;
    db_price: number;
    st_status: string;
}

export interface Client {
    st_name: string;
    st_document: string;
}

export interface ClientBrand {
    st_brand: string;
    client: Client;
}

export interface Category {
    st_category: string;
}

export interface Subcategory {
    st_subcategory: string;
    category: Category;
}

export interface Variety {
    seq: string;
    variety: string;
    price: number;
    status: string;
}

export interface ClientBrandProduct {
    st_product: string;
    st_variety: string | Variety[];
    subcategory: Subcategory;
    db_price?: number;
    st_variety_name?: string;
    st_variety_seq?: string;
    nr_quantity?: number;
    st_status?: string;
    items?: MenuItem[];
    id_product?: string;
}

export interface AdvertisementProduct {
    st_varity_seq: string;
    st_varity_name: string;
    en_status: string;
    nr_quantity: number;
    product: ClientBrandProduct;
    id_product: string;
}

export interface SellerDetails {
    name: string;
    power_seller_status: string;
    reputation_rank: number;
}

export interface ProductExtraDetails {
    originalPrice: number;
    sold: number;
    stock: number;
    new: boolean;
    relatedSearches: string[];
}

export interface Advertisement {
    id_advertisement: string;
    id_brand: string;
    st_plataform: string;
    st_plataform_id: string;
    st_url: string;
    st_title: string;
    st_description: string;
    st_photos: string;
    db_price: number | string;
    db_original_price: number | string;
    st_vendor: string;
    st_details: string | {
        seller: SellerDetails;
        details: ProductExtraDetails;
    };
    st_status: string;
    brand: ClientBrand;
    products: AdvertisementProduct[];
    dt_created: string;
    st_created_by: string;
    dt_modified: string;
    st_modified_by: string;
}

export interface AdvertisementHistory {
    dt_history: string;
    st_status: string;
    st_action: string;
    st_history: string;
    st_created_by: string;
}

export interface AdvertisementExport {
    id_export: string;
    st_status: string;
}

export interface AdvertisementProductPostRequest {
    id_advertisement: string;
    id_product: string;
    st_varity_seq: string;
    st_varity_name: string;
    en_status: string;
    nr_quantity: number;
}