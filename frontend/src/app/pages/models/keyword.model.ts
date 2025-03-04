export interface KeywordResponse {
    id_keyword: string;
    id_brand: string;
    st_keyword: string;
    st_product: string;
    st_status: string;
    brand: {
        id_brand: string;
        id_client: string;
        st_brand: string;
        st_status: string;
        client: {
            id: string;
            st_name: string;
            st_document: string;
            st_status: string;
            dt_created: string;
            st_created_by: string;
            dt_modified: string | null;
            st_modified_by: string | null;
        };
        dt_created: string;
        st_created_by: string;
        dt_modified: string | null;
        st_modified_by: string | null;
    };
    dt_created: string;
    st_created_by: string;
    dt_modified: string | null;
    st_modified_by: string | null;
}

export interface Keyword {
    id?: string;
    name?: string;
    identification?: string;
    status?: string;
}

export interface KeywordRequest {
    id_brand: string;
    st_keyword: string;
    st_product: string;
    st_status: string;
}