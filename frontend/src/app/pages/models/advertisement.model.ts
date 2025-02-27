export interface AdvertisementListDto {
    id_Advertisement?: string;
    st_Advertisement?: string;
    st_status?: string;
    dt_created?: string;
    st_created_by?: string;
    dt_modified?: string | null;
    st_modified_by?: string | null;
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