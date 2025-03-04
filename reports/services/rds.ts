import { Pool } from 'pg';
import { DatabaseConfig } from '../base/types';

export class ReportManager {
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

    async insertAdvertisementExport(st_key: string, st_status: string): Promise<void> {
        const query = `
            INSERT INTO tb_advertisement_export (st_key, st_status, dt_created)
            VALUES ($1, $2, NOW())
        `;
        await this.pool.query(query, [st_key, st_status]);
        console.log(`Registro inserido: ${st_key}, ${st_status}`);
    }

    async updateAdvertisementExport(st_key: string, st_status: string): Promise<void> {
        const query = `
            UPDATE tb_advertisement_export
            SET st_status = $1
            WHERE st_key = $2
        `;
        await this.pool.query(query, [st_status, st_key]);
        console.log(`Registro atualizado: ${st_key}, ${st_status}`);
    }

    async listAdvertisements(ids: string[]): Promise<any[]> {
        // Recuperar registros da tabela tb_advertisement
        var query = `SELECT * FROM tb_advertisement`;
        if (ids.length > 0) {
            query += ` WHERE id_advertisement = ANY($1::uuid[])`;
            return (await this.pool.query(query, [ids])).rows;
        }
        query += ` WHERE st_status = 'REPORT' limit 500`;
        return (await this.pool.query(query)).rows;
    }

    async updateAdvertisement(ids: string[], status: string): Promise<void> {
        const query = `
            UPDATE tb_advertisement
            SET st_status = $1
            WHERE id_advertisement = ANY($2::uuid[])
        `;
        await this.pool.query(query, [status, ids]);
    }

    async insertHistoryReport(advertisements: any[], user: string): Promise<void> {
        var query = `
            INSERT INTO tb_advertisement_history
            (id_advertisement, dt_history, st_status, st_action, dt_created, st_created_by)
            VALUES
        `;

        var pos = 1;
        var params = [];
        for (const advertisement of advertisements) {
            query += `($${pos++}, CURRENT_TIMESTAMP, 'REPORTED', 'USER_REPORTED', CURRENT_TIMESTAMP, $${pos++}),`;
            params.push(advertisement.id_advertisement, user);
        }
        query = query.slice(0, -1);

        await this.pool.query(query, params);
    }

    async insertHistoryManual(advertisements: any[], user: string): Promise<void> {
        var query = `
            INSERT INTO tb_advertisement_history
            (id_advertisement, dt_history, st_status, st_action, dt_created, st_created_by)
            VALUES
        `;

        var pos = 1;
        var params = [];
        for (const advertisement of advertisements) {
            query += `($${pos++}, CURRENT_TIMESTAMP, $${pos++}, 'USER_EXPORT', CURRENT_TIMESTAMP, $${pos++}),`;
            params.push(advertisement.id_advertisement, advertisement.st_status, user);
        }
        query = query.slice(0, -1);

        await this.pool.query(query, params);
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}
