export interface UserResponse {
    id: string;
    st_name: string;
    st_email: string;
    st_phone: string | null;
    dt_created: string;
    st_created_by: string;
    dt_modified: string | null;
    st_modified_by: string | null;
}

export interface UserRequest {
    st_name: string;
    st_email: string;
    st_phone?: string;
    st_password?: string;
}

export interface User {
    id?: string;
    st_name: string;
    st_email: string;
    st_phone?: string;
    attributes?: UserAttr[];
}

export interface UserAttr {
    id_user: string;
    id_attr: string;
    st_value: string;
}
