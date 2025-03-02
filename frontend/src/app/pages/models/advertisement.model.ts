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

export interface Advertisement {
    id_Advertisement: string;
    st_Advertisement: string;
    st_status: string;
}

export interface AdvertisementRequest {
    st_Advertisement: string;
    st_status: string;
}