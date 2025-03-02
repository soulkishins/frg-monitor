export interface BrandResponse {
    id_brand: string;
    id_client: string;
    st_brand: string;
    st_status: string;
    dt_created: string;
    st_created_by: string;
    dt_modified: string | null;
    st_modified_by: string | null;
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

export interface Client {
    id: string;
    st_name: string;
    st_document: string;
    st_status: string;
    dt_created: string;
    st_created_by: string;
    dt_modified: string | null;
    st_modified_by: string | null;
}

export interface Page {
    total: number;
    limit: number;
    offset: number;
    sort: string;
}

export interface BrandResponseWithClient extends BrandResponse {
    client: Client;
}

export interface BrandsResponse {
    list: BrandResponseWithClient[];
    page: Page;
}