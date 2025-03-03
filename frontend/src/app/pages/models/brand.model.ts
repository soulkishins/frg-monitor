export interface BrandResponse {
    id_brand: string;
    id_client: string;
    st_brand: string;
    st_status: string;
    dt_created: string;
    st_created_by: string;
    dt_modified: string | null;
    st_modified_by: string | null;
    client: {
        st_name: string;
    };
}

export interface Brand {
    id?: string;
    client_id?: string;
    client_name?: string;
    name?: string;
    status?: string;
}
 
export interface BrandRequest {
    id_client: string;
    st_brand: string;
    st_status: string;
}