export interface SchedulerResponse {
    id_keyword: string;
    st_keyword: string;
    st_status: string;
}

export interface Scheduler {
    id?: string;
    name?: string;
    identification?: string;
    status?: string;
}

export interface SchedulerRequest {
    st_keyword: string;
    st_status: string;
    platform: string | number;
}