export interface SchedulerResponse {
    id_keyword: string;
    st_keyword: string;
    st_status: string;
}

export interface SchedulerKeyword {
    id: string;
    id_keyword: string;
    st_platform: string;
    st_cron: string;
}

export interface SchedulerRequest {
    id_keyword: string;
    st_platform: string;
    st_cron: string;
}