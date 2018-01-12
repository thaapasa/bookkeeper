import * as log from '../shared/util/log';
import express from 'express';
import * as bodyParser from 'body-parser';
import { config } from './config';
import * as api from './api';
import * as path from 'path';

log.setLevel(config.logLevel);

const curDir = process.cwd();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

api.registerAPI(app);
app.get(/\/p\/.*/, (s, r) => r.sendFile(path.join(curDir + '/public/index.html')));

try {
    app.listen(config.port, () => {
        log.info('Kukkaro server started with configuration', config);
    });
} catch (er) {
    log.error(er);
}
