import { Map } from "../shared/util/util";

const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

const envConf = require(`./config-${env}.js`) as Map<string>;
const commitId = require('./revision');

class Config {
    public port = 3100;
    public environment = env;
    public version: string = require('../../package.json').version;
    public refreshTokenTimeout: '2 weeks';
    public commitId = commitId;
    public logLevel = 'info';
    public revision = commitId.substr(0, 8);
    public showErrorCause = true;
    public db = {
        database: "bookkeeper",
        user: "bookkeeper",
        password: "password",
        port: 5432,
        ssl: false
    };
    // ...envConf,
};

export const config = new Config();
