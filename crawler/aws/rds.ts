import { Pool } from 'pg';
import { DatabaseConfig, IAdvertisement, IAdvertisementHistory, IAdvertisementProduct, IKeyword } from '../base/types';

export class AdvertisementManager {
    private pool: Pool;

    constructor(config: DatabaseConfig) {
        this.pool = new Pool({
            user: config.user,
            host: config.host,
            database: config.database,
            password: config.password,
            port: config.port,
            ssl: {
                rejectUnauthorized: false, // Desativa a verificação de certificado
            },
            options: `-c search_path=${config.schema}`
        });
        // Definir o fuso horário para cada nova conexão criada no pool
        this.pool.on('connect', async (client) => {
            await client.query("SET TIME ZONE 'America/Sao_Paulo'");
            console.log("Timezone configurado para America/Sao_Paulo");
        });
    }

    async createAdvertisement(data: IAdvertisement): Promise<string> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO tb_advertisement (
                    id_advertisement, id_brand, st_plataform, st_plataform_id,
                    st_url, st_title, st_description, st_photos, db_price,
                    st_vendor, st_details, st_status, st_created_by, dt_created
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'crawler', CURRENT_TIMESTAMP)
                RETURNING id_advertisement
            `;

            const values = [
                data.id_advertisement, data.id_brand, data.st_plataform, data.st_plataform_id,
                data.st_url, data.st_title || 'N/A', data.st_description || 'N/A', data.st_photos || 'N/A', data.db_price, 
                data.st_vendor || 'N/A', data.st_details, data.st_status
            ];

            await client.query(query, values);
            await client.query('COMMIT');
            return data.id_advertisement;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async addProduct(data: IAdvertisementProduct): Promise<void> {
        const query = `
            INSERT INTO tb_advertisement_product (
                id_advertisement, id_product, st_varity_seq, st_varity_name, st_created_by, dt_created
            ) VALUES ($1, $2, $3, $4, 'crawler', CURRENT_TIMESTAMP)
            ON CONFLICT (id_advertisement, id_product, st_varity_seq) 
            DO UPDATE SET
                st_varity_name = EXCLUDED.st_varity_name
            WHERE tb_advertisement_product.st_varity_name <> EXCLUDED.st_varity_name
        `;
        
        const values = [
            data.id_advertisement, data.id_product,
            data.st_varity_seq, data.st_varity_name
        ];

        await this.pool.query(query, values);
    }

    async addKeyword(data: {id_keyword: string, st_keyword: string, id_advertisement: string}): Promise<void> {
        const query = `
            INSERT INTO tb_advertisement_keyword (
                id_advertisement, id_keyword, st_keyword, dt_created
            ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (id_advertisement, id_keyword) 
            DO UPDATE SET
                st_keyword = EXCLUDED.st_keyword
            WHERE tb_advertisement_keyword.st_keyword <> EXCLUDED.st_keyword
        `;
        
        const values = [
            data.id_advertisement, data.id_keyword, data.st_keyword
        ];

        await this.pool.query(query, values);
    }

    async addHistory(data: IAdvertisementHistory): Promise<void> {
        const query = `
            INSERT INTO tb_advertisement_history (
                id_advertisement, dt_history, st_status, st_action, st_history, st_ml_json, st_created_by, dt_created
            ) VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, 'crawler', CURRENT_TIMESTAMP)
        `;
        
        const values = [
            data.id_advertisement, data.st_status,
            data.st_action, data.st_history, data.st_status == 'ERROR' ? data.st_ml_json : null
        ];

        await this.pool.query(query, values);
    }

    async updateStatistics(params: IKeyword): Promise<void> {
        console.log('Incluindo/Atualizando estatisticas');
        const query = `
            insert into tb_scheduler_statistics(
                id_scheduler, dt_created, nr_pages, nr_total, nr_processed, nr_created, nr_updated,
                nr_error, nr_manual_revision, nr_reported, nr_already_reported, nr_invalidate, nr_reconcile, en_status
            ) values (
                coalesce($1, '00000000-0000-0000-0000-000000000000'), coalesce($2, CURRENT_TIMESTAMP), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            ) on conflict (id_scheduler, dt_created) do update set
                nr_pages = tb_scheduler_statistics.nr_pages + EXCLUDED.nr_pages,
                nr_total = tb_scheduler_statistics.nr_total + EXCLUDED.nr_total,
                nr_processed = tb_scheduler_statistics.nr_processed + EXCLUDED.nr_processed,
                nr_created = tb_scheduler_statistics.nr_created + EXCLUDED.nr_created,
                nr_updated = tb_scheduler_statistics.nr_updated + EXCLUDED.nr_updated,
                nr_error = tb_scheduler_statistics.nr_error + EXCLUDED.nr_error,
                nr_manual_revision = tb_scheduler_statistics.nr_manual_revision + EXCLUDED.nr_manual_revision,
                nr_reported = tb_scheduler_statistics.nr_reported + EXCLUDED.nr_reported,
                nr_already_reported = tb_scheduler_statistics.nr_already_reported + EXCLUDED.nr_already_reported,
                nr_invalidate = tb_scheduler_statistics.nr_invalidate + EXCLUDED.nr_invalidate,
                nr_reconcile = tb_scheduler_statistics.nr_reconcile + EXCLUDED.nr_reconcile,
                en_status = EXCLUDED.en_status
            `;
        
        const values = [
            params.scheduler_id || null,
            params.datetime || null,
            params.statistics.nr_pages || 0,
            params.statistics.nr_total || 0,
            params.statistics.nr_processed || 0,
            params.statistics.nr_created || 0,
            params.statistics.nr_updated || 0,
            params.statistics.nr_error || 0,
            params.statistics.nr_manual_revision || 0,
            params.statistics.nr_reported || 0,
            params.statistics.nr_already_reported || 0,
            params.statistics.nr_reconcile || 0,
            params.statistics.nr_invalidate || 0,
            params.statistics.st_status,
        ];

        await this.pool.query(query, values);
    }

    async getAdvertisement(id: string): Promise<IAdvertisement | null> {
        const query = `
            SELECT * FROM tb_advertisement 
            WHERE id_advertisement = $1
        `;
        
        const result = await this.pool.query(query, [id]);
        return result.rows[0] || null;
    }

    async getAdvertisementByPlataform(st_plataform: string, st_plataform_id: string, st_url: string, id_brand: string): Promise<IAdvertisement | null> {
        const queryID = `
            SELECT * FROM tb_advertisement 
            WHERE st_plataform = $1 AND st_plataform_id = $2 AND id_brand = $3
        `;
        const queryURL = `
            SELECT * FROM tb_advertisement 
            WHERE st_plataform = $1 AND st_url = $2 AND id_brand = $3
        `;

        if (st_plataform_id !== 'N/A') {
            const result = await this.pool.query(queryID, [st_plataform, st_plataform_id, id_brand]);
            return result.rows[0] || null;
        }

        const result = await this.pool.query(queryURL, [st_plataform, st_url, id_brand]);
        return result.rows[0] || null;
    }

    async getAdvertisementProducts(id: string): Promise<IAdvertisementProduct[]> {
        const query = `
            SELECT * FROM tb_advertisement_product 
            WHERE id_advertisement = $1
        `;
        
        const result = await this.pool.query(query, [id]);
        return result.rows;
    }

    async getAdvertisementHistory(id: string): Promise<IAdvertisementHistory[]> {
        const query = `
            SELECT * FROM tb_advertisement_history 
            WHERE id_advertisement = $1
            ORDER BY dt_history DESC
        `;
        
        const result = await this.pool.query(query, [id]);
        return result.rows;
    }

    async updateAdvertisement(record: IAdvertisement, data: IAdvertisement): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            var param = 1;
            var query = '';
            var values: any[] = [];

            if (data.st_description && data.st_description !== 'N/A' && record.st_description !== data.st_description) {
                query += 'st_description = $' + param + ',';
                values.push(data.st_description);
                param++;
            }

            if (data.st_details && record.st_details !== data.st_details) {
                query += 'st_details = $' + param + ',';
                values.push(data.st_details);
                param++;
            }

            if (data.db_price && data.db_price !== record.db_price) {
                query += 'db_price = $' + param + ',';
                values.push(data.db_price);
                param++;
            }

            if (data.st_photos && data.st_photos !== 'N/A' && record.st_photos !== data.st_photos) {
                query += 'st_photos = $' + param + ',';
                values.push(data.st_photos);
                param++;
            }

            if (data.st_title && data.st_title !== 'N/A' && record.st_title !== data.st_title) {
                query += 'st_title = $' + param + ',';
                values.push(data.st_title);
                param++;
            }

            if (data.st_url && data.st_url !== 'N/A' && record.st_url !== data.st_url) {
                query += 'st_url = $' + param + ',';
                values.push(data.st_url);
                param++;
            }

            if (data.st_vendor && data.st_vendor !== 'N/A' && record.st_vendor !== data.st_vendor) {
                query += 'st_vendor = $' + param + ',';
                values.push(data.st_vendor);
                param++;
            }

            if (data.st_status === 'NEW' && record.st_status === 'ERROR') {
                query += 'st_status = $' + param + ',';
                values.push(data.st_status);
                param++;
            }

            if (query.length > 0) {
                query += 'dt_modified = CURRENT_TIMESTAMP, ';
                query += 'st_modified_by = \'crawler\' ';

                values.push(record.id_advertisement);

                // Atualiza o status do anúncio
                await client.query(`
                    UPDATE tb_advertisement 
                    SET ${query}
                    WHERE id_advertisement = $${param}
                `, values);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}
