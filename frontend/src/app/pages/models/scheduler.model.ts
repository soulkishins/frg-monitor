export interface SchedulerResponse {
    id_brand: string;
    st_brand: string;
    st_status: string;
}

export interface SchedulerBrand {
    id: string;
    id_brand: string;
    st_platform: string;
    st_cron: string;
}

export interface SchedulerRequest {
    id_brand: string;
    st_platform: string;
    st_cron: string;
}