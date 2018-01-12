const Pool = require('pg-pool');
import * as log from '../../shared/util/log';
import { config } from '../config';
import * as util from '../../shared/util/util';
import { Map } from '../../shared/util/util';

function camelCaseObject(o: Map<string>): Map<string> {
    if (typeof o !== 'object') { return o; }
    const r: Map<string> = {};
    Object.keys(o).forEach(k => r[util.underscoreToCamelCase(k)] = o[k]);
    return r;
}

const pool = new Pool({
    connectionString: config.dbUrl,
    ssl: config.dbSSL,
});

function queryFor(client, doRelease, id?) {
    return (name, query, params, mapper) => {
        log.debug((id ? `[${id}] SQL query` : '[db] SQL query'), name, query, 'with params', params);
        return client.query({text: query, name: name, values: params})
            .then(res => {
                const obj = mapper(res);
                if (doRelease) client.release();
                return obj;
            }).catch(e => {
                if (doRelease) client.release();
                log.error("Query error", e.message, e.stack);
                throw e;
            });
    }
}

class BookkeeperDB {

    private query;
    private counter = 0;

    constructor(query) {
        this.query = query;
    }

    public queryObject(name, query, params) {
        return this.query(name, query, params, r => (r.rows && r.rows.length > 0) ? r.rows[0] : undefined)
            .then(camelCaseObject);
    }

    public queryList(name, query, params) {
        return this.query(name, query, params, r => r.rows)
            .then(l => l.map(r => camelCaseObject(r)));
    }

    public transaction<T>(f: (db: any) => Promise<T>, readOnly?: boolean) {
        const mode = readOnly ? "READ ONLY" : "READ WRITE";
        this.counter += 1;
        const txId = this.counter;
        log.debug(`Starting ${mode} transaction ${txId}`);
        return pool.connect().then(client => client.query(`BEGIN ${mode}`)
            .then(() => f(new BookkeeperDB(queryFor(client, false, txId))))
            .then(res => {
                log.debug(`Committing transaction ${txId}`);
                client.query("COMMIT");
                client.release();
                return res;
            })
            .catch(e => {
                log.debug(`Rolling back transaction ${txId} because of error`, e);
                client.query("ROLLBACK");
                client.release();
                log.error("Query error", e.message, e.stack);
                throw e;
            }));
    }

    public insert(name, query, params) {
        return this.query(name, query, params, toId);
    }

    public update(name, query, params) {
        return this.query(name, query, params, toRowCount);
    }
}


function toRowCount(r) {
    return r && r.rowCount !== undefined ? r.rowCount : r;
}

function toId(r) {
    return r && r.rows && r.rows.length > 0 ? r.rows[0].id : undefined;
}

export const db = new BookkeeperDB((name, query, params, mapper) => {
    return pool.connect().then(client => queryFor(client, true)(name, query, params, mapper));
});
