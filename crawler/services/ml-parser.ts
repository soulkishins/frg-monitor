import axios from "axios";
import { ParsingError } from "../errors";
import { S3Uploader } from "./s3-uploader";
import { IMLAdvertisement, IMLAdvertisementUrl, PreloadedState, ProductInfo, PhotoInfo, PriceComponent } from "../base/types";

export class MLParser {
    private static readonly PRELOADED_STATE_REGEX = /window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/;

    constructor(private readonly uploader: S3Uploader) {}

    public async extractAdvertisementDetails(url: IMLAdvertisementUrl): Promise<IMLAdvertisement> {
        const st_plataform = 'MERCADOLIVRE';

        try {
            const cleanUrl = this.removeUrlHash(url.link);
            const preloadedState = await this.extractPreloadedState(cleanUrl);
            
            if (!preloadedState) {
                throw new ParsingError('Não foi possível extrair os dados do produto');
            }

            const advertisementInfo = MLParser.extractAdvertisementInfo(preloadedState);
            const s3Photos = await this.uploadPhotos(advertisementInfo.photos, st_plataform);

            if (!advertisementInfo.title
                || !advertisementInfo.description
                || !advertisementInfo.price
                || !advertisementInfo.stock
                || !advertisementInfo.seller
                || !advertisementInfo.photos
            ) {
                console.log(
                    `${advertisementInfo.id} - ERROR: Informações incompletas ---------------`,
                    advertisementInfo,
                    JSON.stringify(preloadedState, null, 2),
                    `${advertisementInfo.id} - ERROR: Informações incompletas ---------------`,
                );
            }

            return this.createAdvertisement(advertisementInfo, cleanUrl, s3Photos, st_plataform);
        } catch (error) {
            return this.createErrorAdvertisement(url, st_plataform, error as Error);
        }
    }

    private removeUrlHash(url: string): string {
        return url.substring(0, url.indexOf('#'));
    }

    private async extractPreloadedState(url: string): Promise<PreloadedState | null> {
        try {
            const response = await axios.get(url);
            const match = response.data.match(MLParser.PRELOADED_STATE_REGEX);
            
            if (!match?.[1]) return null;

            const jsonStr = match[1].replace(/\\u002F/g, '/');
            const preloadedState = JSON.parse(jsonStr);
            preloadedState.response = response.data;
            return preloadedState;
        } catch (error) {
            throw new ParsingError('Falha ao extrair PreloadedState', error as Error);
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

            return result;
        } catch (error) {
            console.log('Erro ao extrair informações do anúncio:', error, JSON.stringify(preloadedState, null, 2));
            throw error;
        }
    }

    private async uploadPhotos(photos: PhotoInfo[] | undefined, platform: string): Promise<string[]> {
        if (!photos) return [];
        
        return await Promise.all(
            photos.map(photo => 
                this.uploader.uploadImage({
                    imageUrl: photo.url,
                    photoId: photo.id,
                    platform
                })
            )
        );
    }

    private createAdvertisement(
        info: ProductInfo,
        url: string,
        photos: string[],
        platform: string
    ): IMLAdvertisement {
        return {
            id_advertisement: '',
            id_brand: '',
            st_plataform: platform,
            st_plataform_id: info.id,
            st_url: url,
            st_title: info.title,
            st_description: info.description,
            st_photos: photos.join(','),
            db_price: info.price,
            st_vendor: info.seller?.name,
            st_details: JSON.stringify({
                seller: info.seller,
                details: {
                    originalPrice: info.original_price,
                    sold: info.sold,
                    stock: info.stock,
                    new: info.new,
                    relatedSearches: info.relatedSearches
                }
            }),
            st_status: 'NEW'
        };
    }

    private createErrorAdvertisement(
        url: IMLAdvertisementUrl,
        platform: string,
        error: Error
    ): IMLAdvertisement {
        return {
            id_advertisement: '',
            id_brand: '',
            st_plataform: platform,
            st_plataform_id: url.link.match(/MLB-\d+/)?.[0] || 'N/A',
            st_url: url.link,
            st_title: url.title,
            st_description: `Erro ao extrair detalhes do anúncio: ${error.message}`,
            st_photos: 'N/A',
            db_price: Number(url.price),
            st_vendor: 'N/A',
            st_status: 'ERROR'
        };
    }
} 