// Interface base para anúncios
export interface IBaseAdvertisement {
    id_advertisement: string;
    id_brand: string;
    st_plataform: string;
    st_plataform_id: string;
    st_url: string;
    st_title?: string;
    st_description?: string;
    st_photos?: string;
    db_price?: number;
    st_vendor?: string;
    st_details?: string;
    st_status: string;
}

// Estende a interface base
export interface IMLAdvertisement extends IBaseAdvertisement {
    ml_json: any;
}

// Estende a interface base
export interface IAdvertisement extends IBaseAdvertisement {}

export interface IKeyword {
    scheduler_id: string;
    cron: string;
    platform: string;
    datetime: string;
    keyword_id: string;
    keyword: string;
    brand_id: string;
    products: IClientBrandProduct[];
    statistics: IStatistics;
}

export interface IStatistics {
    nr_pages: number;
    nr_total: number;
    nr_processed: number;
    nr_created: number;
    nr_updated: number;
    nr_error: number;
    nr_manual_revision: number;
    nr_reported: number;
    nr_already_reported: number;
    nr_reconcile: number;
    st_status: 'SE' | 'EP' | 'ET' | 'PE' | 'GE' | null;
}

// Interface base para produtos
export interface IBaseProduct {
    id_product?: string;
    st_varity_seq?: string;
    st_varity_name?: string;
    id_advertisement?: string;
}

// Estende a interface base de produtos
export interface IClientBrandProduct extends IBaseProduct {}

// Estende a interface base de produtos
export interface IAdvertisementProduct extends IBaseProduct {}

export interface IMLAdvertisementUrl {
    title: string;
    price: string;
    link: string;
}

export interface IMLPage {
    advertisements: IMLAdvertisementUrl[];
    pages: IPagination[];
}

export interface IPagination {
    current: string;
    link: string;
}

export interface AWSConfig {
    region: string;
    bucketName: string;
}

export interface GalleryPicture {
    id: string;
    alt: string;
    width: number;
    height: number;
}

export interface AdvertisementResponse {
    url: string;
    html: string;
    status: number;
}


export interface PreloadedState {
    initialState: {
        id: string;
        components: { [key: string]: any;}
    };
}

export interface ProductInfo {
    id: string;
    title?: string;
    description?: string;
    price?: number;
    original_price?: number;
    stock?: number;
    sold?: number;
    new?: boolean;
    seller?: {
        name: string;
        power_seller_status?: string;
        reputation_rank?: string;
    };
    photos?: PhotoInfo[];
    relatedSearches?: string[];
}

export interface PhotoInfo {
    id: string;
    url: string;
    advertisementId: string;
}

export interface IAdvertisementHistory {
    id_advertisement: string;
    st_status: string;
    st_action: string;
    st_history?: string;
    st_ml_json?: string;
}

export interface DatabaseConfig {
    user: string;
    host: string;
    database: string;
    password: string;
    port: number;
    schema: string;
}

export interface Label {
    text: string;
    color?: string;
    bg_color?: string;
    font_size?: string;
    font_family?: string;
    type?: string;
}

export interface Action {
    target: string;
    timeout: number;
    duration: number;
    label?: Label;
    accessibility_text?: string;
    modal_title?: string;
    close_modal_label?: string;
}

export interface RelatedSearch {
    target: string;
    timeout: number;
    duration: number;
    label: Label;
}

export interface Component {
    id: string;
    type: string;
    state: string;
    title?: {
        text: string;
    } | string;
    subtitle?: string;
    content?: string;
    related_searches?: RelatedSearch[];
    closeable?: boolean;
    carousel?: any;
    carousel_config?: {
        site_id: string;
        item_id: string;
        category_id: string;
        web_device: string;
        client: string;
        recommended: {
            force_categories: string;
            cnt: number;
        };
        d2id: string;
        picture_id: string;
        min_recomms: number;
        limit: number;
    };
    background_color?: string;
    is_carousel_polycard?: boolean;
    has_native_card_shadow_background?: boolean;
    has_bottom_spacing?: boolean;
}

export interface Price {
    type: string;
    value: number;
    original_value?: number;
    currency_symbol: string;
    currency_id: string;
    billing: boolean;
}

export interface PriceComponent extends Component {
    price: Price;
    discount_label?: {
        color: string;
        value: number;
        value_font_size: string;
    };
    subtitles?: Array<{
        id?: string;
        text: string;
        color: string;
        font_size: string;
        font_family: string;
        values?: Record<string, any>;
    }>;
    quantity_selector?: {
        available_quantity: number;
        minimum_quantity: number;
    };
}

export interface SellerInfo {
    state: string;
    header: string;
    title: string;
    power_seller_status: {
        title: string;
        subtitle: string;
    };
    store_type: string;
    thermometer: {
        rank: number;
        info: Array<{
            title?: string;
            subtitle: string;
            icon?: {
                id: string;
            };
        }>;
    };
    is_exclusive_official_store: boolean;
}

export interface HighlightedSpec {
    id: string;
    type: string;
    state: string;
    label: {
        text: string;
        color: string;
        font_size: string;
        font_family: string;
    };
    picture?: {
        url: {
            src: string;
        };
        width: number;
        height: number;
    };
    column: string;
    title?: {
        text: string;
        values: {
            value: Label;
            key: Label;
        };
    };
}

export interface TechnicalSpecification {
    title: string;
    type: string;
    column: string;
    attributes: Array<{
        id: string;
        text: string;
    }>;
    heading_label: {
        text: string;
        is_heading: boolean;
    };
}

export interface DescriptionComponent extends Component {
    components: Array<{
        id: string;
        type: string;
        state: string;
        components?: Array<HighlightedSpec>;
        specs?: TechnicalSpecification[];
        label?: {
            text: string;
            color: string;
            font_size: string;
            font_family: string;
        };
        heading_label?: {
            text: string;
            color: string;
            font_size: string;
            font_family: string;
            is_heading: boolean;
        };
        alignment?: string;
        action?: {
            timeout: number;
            duration: number;
            label: {
                text: string;
                color: string;
            };
            track?: {
                melidata_event: {
                    path: string;
                    event_data: {
                        item_id: string;
                        category_id: string;
                        category_path: string[];
                        vertical: string;
                        item_status: string;
                        seller_id: number;
                        is_highlighted: boolean;
                        item_condition: string;
                        listing_type_id: string;
                    };
                };
            };
        };
        max_groups?: number;
        viewport_track?: {
            melidata_event: {
                path: string;
                event_data: {
                    item_id: string;
                    category_id: string;
                    category_path: string[];
                    vertical: string;
                    item_status: string;
                    seller_id: number;
                    is_highlighted: boolean;
                    item_condition: string;
                    listing_type_id: string;
                };
            };
        };
    }>;
}