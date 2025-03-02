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
    id: string;
    st_name: string;
    st_document: string;
    st_status: string;
    dt_created: string;
    st_created_by: string;
    dt_modified: string;
    st_modified_by: string;
}

export interface ClientBrand {
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

export interface ClientBrandProduct {
    id_advertisement: string;
    id_product: string;
    st_varity_seq: string;
    st_varity_name: string;
    dt_created: string;
    st_created_by: string;
    dt_modified: string | null;
    st_modified_by: string | null;
}

export interface SellerDetails {
    name: string;
    power_seller_status: string;
    reputation_rank: number;
}

export interface ProductDetails {
    sold: number | null;
    stock: number;
    new: boolean;
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
    db_price: number;
    st_vendor: string;
    st_details: {
        seller: SellerDetails;
        details: ProductDetails;
    };
    st_status: string;
    brand: ClientBrand;
    products: ClientBrandProduct[];
    dt_created: string;
    st_created_by: string;
    dt_modified: string;
    st_modified_by: string;
}

export interface AdvertisementExport {
    id_export: string;
    st_status: string;
}
