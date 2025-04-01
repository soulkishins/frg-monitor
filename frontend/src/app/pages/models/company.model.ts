export interface CompanyResponse {
    id: string;
    st_name: string;
    st_document: string;
    st_status: string;
    bl_pj: boolean;
    dt_created: string;
    st_created_by: string;
    dt_modified: string | null;
    st_modified_by: string | null;
}

export interface Company {
    id?: string;
    name?: string;
    identification?: string;
    status?: string;
    personType?: string;
}

export interface CompanyRequest {
    st_name: string;
    st_document: string;
    st_status: string;
    bl_pj: boolean;
}