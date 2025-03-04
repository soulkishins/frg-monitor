export interface ProductResponse {
    id_product: string;
    id_brand: string;
    id_subcategory: string;
    st_product: string;
    st_variety: string;
    st_status: string;
    dt_created: string;
    st_created_by: string;
    dt_modified: string;
    st_modified_by: string;
    subcategory: {
        id_subcategory: string;
        id_category: string;
        st_subcategory: string;
        st_status: string;
        category: {
            id_category: string;
            st_category: string;
            st_status: string;
            dt_created: string;
            st_created_by: string;
            dt_modified: string;
            st_modified_by: string;
        };
        dt_created: string;
        st_created_by: string;
        dt_modified: string;
        st_modified_by: string;
    };
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
            dt_modified: string;
            st_modified_by: string;
        };
        dt_created: string;
        st_created_by: string;
        dt_modified: string;
        st_modified_by: string;
    };
}

export interface Product {
    id_product: string;
    id_brand: string;
    id_subcategory: string;
    st_product: string;
    st_variety: string;
    st_status: string;
}
 
export interface ProductRequest {
    id_brand: string;
    id_subcategory: string;
    st_product: string;
    st_variety: string;
    st_status: string;
}