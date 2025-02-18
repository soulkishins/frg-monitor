import axios from 'axios';

interface Label {
    text: string;
    color?: string;
    bg_color?: string;
    font_size?: string;
    font_family?: string;
    type?: string;
}

interface Action {
    target: string;
    timeout: number;
    duration: number;
    label?: Label;
    accessibility_text?: string;
    modal_title?: string;
    close_modal_label?: string;
}

interface RelatedSearch {
    target: string;
    timeout: number;
    duration: number;
    label: Label;
}

interface Component {
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

interface Price {
    type: string;
    value: number;
    original_value?: number;
    currency_symbol: string;
    currency_id: string;
    billing: boolean;
}

interface PriceComponent extends Component {
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

interface SellerInfo {
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

interface HighlightedSpec {
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

interface TechnicalSpecification {
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

interface DescriptionComponent extends Component {
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

interface GalleryPicture {
    id: string;
    alt: string;
    width: number;
    height: number;
}

interface GalleryConfig {
    template: string;
    template_thumbnail: string;
    template_zoom: string;
    template_2x: string;
    template_thumbnail_2x: string;
}

interface Gallery {
    id: string;
    type: string;
    picture_config: GalleryConfig;
    pictures: GalleryPicture[];
    videos: any[]; // Array vazio no exemplo
    previews: Record<string, any>; // Objeto vazio no exemplo
    track: {
        analytics_event: {
            section: string;
            action: string;
            label: string;
            custom_dimensions: {
                [key: string]: string;
            };
        };
    };
    show_share: boolean;
    gallery_type: string;
    set_paddings: boolean;
    accessibility_text: string;
}

interface Fixed {
    grouped_header_item: {
        id: string;
        type: string;
        state: string;
        components: string[];
    };
    gallery: Gallery;
}

interface PreloadedState {
    translations: Record<string, any>;
    initialState: {
        id: string;
        vip_filters: any;
        layout: string;
        vertical: string;
        components_locations: {
            variations: string;
        };
        components: {
            head: Component[];
            header: Component;
            price: PriceComponent;
            related_searches: Component;
            available_quantity: any;
            description: DescriptionComponent;
            content_left: Array<DescriptionComponent>;
            content_right: Array<{
                id: string;
                type: string;
                state: string;
                seller_info?: SellerInfo;
                payment_methods?: {
                    header: string;
                    payment_methods: Array<{
                        title: {
                            text: string;
                        };
                        icons: Array<{
                            id: string;
                            name: string;
                            url: {
                                src: string;
                            };
                        }>;
                        subtitle?: {
                            text: string;
                        };
                    }>;
                };
            }>;
            seller_experiment: SellerExperiment;
            short_description: Array<Component | PriceComponent>;
            fixed?: Fixed;
        };
    };
}

interface ProductInfo {
    id: string;
    title?: string;
    new?: boolean;
    sold?: number;
    stock?: number;
    description?: string;
    price?: number;
    original_price?: number;
    seller?: {
        name: string;
        power_seller_status?: string;
        reputation_rank?: number;
    };
    photos?: {
        id: string;
        url: string;
    }[];
    relatedSearches?: string[];
}

interface SellerExperiment {
    component_id: string;
    type: string;
    state: string;
    title: string;
    title_value: string;
    seller_link: {
        timeout: number;
        duration: number;
        label: {
            text: string;
            color: string;
        };
        close_modal_label: string;
        track: {
            melidata_event: {
                path: string;
                event_data: {
                    category_id: string;
                    seller_id: number;
                    item_id: string;
                    buying_mode: string;
                    item_seller_type: string;
                    catalog_listing: boolean;
                    listing_type_id: string;
                    item_condition: string;
                    item_status: string;
                    vertical: string;
                    source: string;
                };
                experiments: Record<string, string>;
            };
            analytics_event: {
                action: string;
                category: string;
            };
        };
    };
    subtitles: Array<{
        text: string;
        color: string;
        font_size: string;
        font_family: string;
        values: {
            bold_amount: {
                text: string;
                color: string;
                font_size: string;
                font_family: string;
            };
            font: {
                text: string;
                color: string;
                font_size: string;
                font_family: string;
            };
        };
    }>;
    seller: {
        id: number;
        name: string;
        reputation_level: string;
    };
    seller_info: SellerInfo;
    show_seller_logo: boolean;
    is_exclusive_official_store: boolean;
}

export class MLJsonExtractor {
    private static readonly PRELOADED_STATE_REGEX = /window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/;

    public static async extractFromUrl(url: string): Promise<PreloadedState | null> {
        try {
            const response = await axios.get(url);
            const html = response.data;

            return this.extractFromHtml(html);
        } catch (error) {
            console.log('Erro ao extrair PreloadedState da URL:', error);
            throw error;
        }
    }

    public static extractFromHtml(html: string): PreloadedState | null {
        try {
            const match = html.match(this.PRELOADED_STATE_REGEX);
            
            if (!match || !match[1]) {
                console.warn('PreloadedState não encontrado no HTML');
                return null;
            }

            const jsonStr = match[1].replace(/\\u002F/g, '/');
            const preloadedState = JSON.parse(jsonStr);

            return preloadedState;
        } catch (error) {
            console.log('Erro ao extrair PreloadedState do HTML:', error);
            throw error;
        }
    }

    public static extractAdvertisementInfo(preloadedState: PreloadedState): ProductInfo {
        try {
            const result: ProductInfo = {
                id: preloadedState.initialState.id
            };

            // Extraia descrição do anúncio
            const descriptionComponent = preloadedState.initialState.components.description || preloadedState.initialState.components.content_left?.find(
                comp => comp.type === 'description'
            );
            if (descriptionComponent) {
                result.description = descriptionComponent.content;
            }

            // Extrair informações dos componentes
            if (preloadedState.initialState.components.short_description) {
                for (const component of preloadedState.initialState.components.short_description) {
                    // Extraia descrição do anúncio
                    if (component.type === 'header' && component.title) {
                        result.title = component.title as string;
                        result.new = component.subtitle?.includes('Novo');
                        result.sold = Number(component.subtitle?.match(/\d+/)?.[0]);
                    }
                    if (component.type === 'available_quantity') {
                        const quantityComponent = component as PriceComponent;
                        result.stock = quantityComponent.quantity_selector?.available_quantity;
                    }
                    // Extrair preço
                    if (component.type === 'price' && (component as PriceComponent).price) {
                        const priceComponent = component as PriceComponent;
                        result.price = priceComponent.price.value;
                        result.original_price = priceComponent.price.original_value;
                    }
                }
            }
            
            if (preloadedState.initialState.components.header?.type === 'header') {
                var component = preloadedState.initialState.components['header'] as any;
                result.title = component.title as string;
                result.new = component.subtitle?.includes('Novo');
                result.sold = Number(component.subtitle?.match(/\d+/)?.[0]);
            }

            if (preloadedState.initialState.components.price?.type === 'price') {
                var component = preloadedState.initialState.components.price as any;
                result.price = component.price.value;
                result.original_price = component.price.original_value;
            }

            if (preloadedState.initialState.components['available_quantity']?.type === 'available_quantity') {
                var component = preloadedState.initialState.components.available_quantity as any;
                result.stock = component['picker']?.['track']?.['melidata_event']?.['event_data']?.['quantity'] || 0;
            }

            // Extrair informações do vendedor
            const sellerComponent = preloadedState.initialState.components.seller_experiment;
            if (sellerComponent?.seller_info) {
                result.seller = {
                    name: sellerComponent.seller_info.title,
                    power_seller_status: sellerComponent.seller_info.power_seller_status?.title,
                    reputation_rank: sellerComponent.seller_info.thermometer?.rank
                };
            }

            const galleryComponent = preloadedState.initialState.components.fixed?.gallery;
            if (galleryComponent?.pictures) {
                const pictureConfig = galleryComponent.picture_config;
                result.photos = galleryComponent.pictures.map(
                    photo => {
                        return {
                            id: photo.id,
                            url: pictureConfig.template_zoom.replace('{id}', photo.id).replace('{sanitizedTitle}', '')
                        }
                    }
                );
            }

            // Extrair buscas relacionadas
            const relatedComponent = preloadedState.initialState.components.related_searches || preloadedState.initialState.components.head?.find(
                comp => comp.type === 'related_searches'
            );
            if (relatedComponent?.related_searches) {
                result.relatedSearches = relatedComponent.related_searches.map(
                    search => search.label.text
                );
            }

            if (!result.description
                || !result.title
                || !result.price
                || !result.stock
                || !result.seller
                || !result.seller?.name
                || !result.photos
            ) {
                console.log('ERROR: Informações incompletas', result, JSON.stringify(preloadedState, null, 2));
            }
            return result;
        } catch (error) {
            console.log('Erro ao extrair informações do anúncio:', error, JSON.stringify(preloadedState, null, 2));
            throw error;
        }
    }
} 