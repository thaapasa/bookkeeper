const Pool = require('pg-pool');
import { config } from '../config';
//import * as util from '../../shared/util/util';
import { Map, camelCaseObject } from '../../shared/util/util';
import { QueryResult, Client } from 'pg';
const debug = require('debug')('db');
const error = require('debug')('db:error');

const pool = new Pool({
    connectionString: config.dbUrl,
    ssl: config.dbSSL,
});

type Queryer = <T>(name: string, query: string, params: any[], mapper: (res: QueryResult) => T) => Promise<T>;

function queryFor<T>(client: Client, doRelease: boolean, id?: number): Queryer {
    return async(name, query, params, mapper) => {
        try {
            debug((id ? `[${id}] SQL query` : '[db] SQL query'), name, query, 'with params', params);
            const res = await client.query({ text: query, name: name, values: params });
            return mapper(res);
        } catch(e) {
            error('Query error', e.message, e.stack);
            throw e;
        } finally {
            if (doRelease) { client.release(); }
        }
    };
}

export interface DbAccess {
    queryObject<T extends object>(name: string, query: string, params?: any[]): Promise<T>;
    queryList<T extends object>(name: string, query: string, params?: any[]): Promise<T[]>;
    insert(name: string, query: string, params?: any[]): Promise<number>;
    update(name: string, query: string, params?: any[]): Promise<number>;
}

class BookkeeperDB implements DbAccess {

    private queryer: Queryer;
    private counter = 0;

    constructor(queryer: Queryer) {
        this.queryer = queryer;
    }

    public async queryObject<T extends object>(name: string, query: string, params?: any[]): Promise<T> {
        const o = await this.queryer(name, query, params || [], r => (r.rows && r.rows.length > 0) ? r.rows[0] : undefined);
        return camelCaseObject(o);
    }

    public async queryList<T extends object>(name: string, query: string, params?: any[]): Promise<T[]> {
        const o = await this.queryer(name, query, params || [], r => r.rows);
        return o.map(camelCaseObject);
    }

    public async transaction<T>(f: (db: DbAccess) => Promise<T>, readOnly: boolean = false): Promise<T> {
        const mode = readOnly ? 'READ ONLY' : 'READ WRITE';
        this.counter += 1;
        const txId = this.counter;
        debug(`Starting ${mode} transaction ${txId}`);
        const client = await pool.connect() as Client;
        try {
            await client.query(`BEGIN ${mode}`);
            const res = await f(new BookkeeperDB(queryFor(client, false, txId)));
            await client.query('COMMIT');
            await client.release();
            return res;
        } catch (e) {
            debug(`Rolling back transaction ${txId} because of error`, e);
            await client.query('ROLLBACK');
            await client.release();
            error('Query error', e.message, e.stack);
            throw e;
        }
    }

    public insert(name: string, query: string, params?: any[]): Promise<number> {
        return this.queryer(name, query, params || [], toId);
    }

    public update(name: string, query: string, params?: any[]): Promise<number> {
        return this.queryer(name, query, params || [], toRowCount);
    }
}


function toRowCount(r: any): number {
    return r && r.rowCount !== undefined ? r.rowCount : r;
}

function toId(r: any): number {
    return r && r.rows && r.rows.length > 0 ? r.rows[0].id : 0;
}

export const db = new BookkeeperDB(async function<T>(name: string, query: string, params: any[], mapper: (res: QueryResult) => T): Promise<T> {
    const client = await pool.connect() as Client;
    return queryFor(client, true)(name, query, params, mapper);
});
